import { randomUUID } from 'crypto'
import { Executions, Workflows } from '../services'
import { stepHandlers } from './steps'

export interface StepExecutionContext {
	executionId: number
	params: WorkflowStep['params']
	data: ExecutionData
	getToken: () => Promise<string>
	evaluate: (step: WorkflowStep) => Promise<string>
}

interface ExecutionData {
	blockId: string
	variables: Record<string, string>
	continuationToken: string
}

interface Start {
	workflowId: number
	variables?: Record<string, string>
}

export async function startWorkflow(params: Start) {
	const { workflowId, variables = {} } = params

	const version = await Workflows.getLatestVersion({ id: workflowId })
	if (!version) return

	const steps = JSON.parse(version.code) as WorkflowStep[]
	const trigger = steps[0]!

	const continuationToken = randomUUID()
	const data: ExecutionData = {
		blockId: trigger.id,
		variables,
		continuationToken
	}

	const { id } = await Executions.create({
		workflowId,
		versionId: version.id,
		data: JSON.stringify(data)
	})

	await progressWorkflow({ executionId: id, continuationToken })
}

interface ProgressWorkflow {
	executionId: number
	continuationToken: string
	nextBlockId?: string
}

export async function progressWorkflow({
	executionId,
	continuationToken,
	nextBlockId
}: ProgressWorkflow) {
	const execution = await Executions.getWithVersion({ id: executionId })
	if (!execution) {
		console.warn('Execution', executionId, 'not found, cannot progress')
		return
	}

	const data = JSON.parse(execution.data) as ExecutionData
	if (data.continuationToken !== continuationToken) {
		console.warn('Execution', executionId, 'continued more than once with token', continuationToken)
		return
	}

	const steps = JSON.parse(execution.version.code)
	const step = nextBlockId ? findStep(steps, nextBlockId) : findNextStep(steps, data.blockId)

	if (!step) {
		console.error(
			'Workflow',
			execution.workflowId,
			'version',
			execution.versionId,
			'failed to find next step for',
			data.blockId
		)
		// TODO: log
		return
	}
	if (step === NEXT) {
		// execution finished
		// TODO: log
		return
	}

	const handler = stepHandlers[step.type]
	if (!handler) {
		console.error('Step', step.type, 'is not implemented yet')
		return
	}

	let workflow: ReturnType<typeof Workflows.getWorkflow> | undefined
	const context: StepExecutionContext = {
		executionId,
		data,
		params: step.params,
		getToken: async () => {
			if (!workflow) workflow = Workflows.getWorkflow({ id: execution.workflowId })
			return workflow.then((w) => w!.installation!.token)
		},
		evaluate: async (step) => {
			if (!workflow) workflow = Workflows.getWorkflow({ id: execution.workflowId })
			return evaluateStep(step, data, workflow, executionId)
		}
	}

	data.blockId = step.id
	data.continuationToken = randomUUID()
	await Executions.updateData({ id: executionId, data: JSON.stringify(data) })

	// don't await the next step
	handler(context)
}

function findStep(steps: WorkflowStep[], id: string): WorkflowStep | undefined {
	for (const step of steps) {
		if (step.id === id) return step
		for (const value of Object.values(step.params)) {
			if (value instanceof Array) {
				const result = findStep(value, id)
				if (result) return result
			}
		}
	}
}

async function evaluateStep(
	step: WorkflowStep,
	data: ExecutionData,
	workflow: ReturnType<typeof Workflows.getWorkflow>,
	executionId: number
) {
	const context: StepExecutionContext = {
		executionId,
		data,
		params: step.params,
		getToken: async () => {
			return workflow.then((w) => w!.installation!.token)
		},
		evaluate: async (step) => {
			return evaluateStep(step, data, workflow, executionId)
		}
	}

	const handler = stepHandlers[step.type]
	if (!handler) {
		console.error(`Value step ${step.type} is not implemented yet`)
		throw new Error(`Value step ${step.type} is not implemented yet`)
	}

	const result = await handler(context)
	if (typeof result !== 'string') {
		throw new Error(`Value step ${step.type} returned non-string type`)
	}
	return result
}

/** Finds a next step among an array of steps. Only considers statement blocks. */
function findNextStep(steps: WorkflowStep[], id: string): WorkflowStep | typeof NEXT | undefined {
	for (const [i, step] of steps.entries()) {
		if (step.id === id) {
			if (i !== steps.length - 1) return steps[i + 1]
			return NEXT
		}
		for (const value of Object.values(step.params)) {
			if (value instanceof Array) {
				const result = findNextStep(value, id)
				if (result === NEXT) {
					if (i !== steps.length - 1) return steps[i + 1]
					return NEXT
				} else if (result) {
					return result
				}
			}
		}
	}
}

const NEXT = Symbol.for('orpheflows.execution.NEXT')
