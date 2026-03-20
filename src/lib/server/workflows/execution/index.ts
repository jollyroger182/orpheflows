import { randomUUID } from 'crypto'
import { Executions, Workflows } from '../../services'
import { stepHandlers } from './steps'
import { slack } from '$lib/server/slack'
import { SLACK_BOT_TOKEN } from '$env/static/private'
import {
	EXECUTE_RATE_LIMIT_COUNT,
	EXECUTE_RATE_LIMIT_NOTIFY_INTERVAL,
	EXECUTE_RATE_LIMIT_TIME
} from '$lib/consts'

export interface StepExecutionContext {
	workflowId: number
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
	findTrigger?: (step: WorkflowStep) => boolean
}

export async function startWorkflow({
	workflowId,
	variables = {},
	findTrigger = () => true
}: Start) {
	const count = await Executions.countWhere({
		workflowId,
		createdAfter: new Date(Date.now() - EXECUTE_RATE_LIMIT_TIME)
	})
	if (count >= EXECUTE_RATE_LIMIT_COUNT) {
		const workflow = await Workflows.shouldSendNotification({ id: workflowId })
		if (!workflow) return
		const mention = workflow.installation ? `<@${workflow.installation.userId}>` : workflow.name
		await slack.chat.postMessage({
			channel: workflow.authorId,
			text: `Your workflow, ${mention}, has reached its execution limit of ${workflow.rateLimitCount} executions per ${workflow.rateLimitTime} ms. Please try again later or request an increase. (This message will only be sent once per ${EXECUTE_RATE_LIMIT_NOTIFY_INTERVAL / 1000} seconds.)`,
			token: SLACK_BOT_TOKEN
		})
		return
	}

	const version = await Workflows.getLatestVersion({ id: workflowId })
	if (!version) return

	const steps = JSON.parse(version.code) as WorkflowStep[]
	const trigger = steps.find(findTrigger)
	if (!trigger) {
		throw new Error(`workflow trigger for ${workflowId} not found`)
	}

	const continuationToken = randomUUID()
	const data: ExecutionData = {
		blockId: trigger.id,
		variables,
		continuationToken
	}

	const { id } = await Executions.create({
		workflowId,
		versionId: version.id,
		data: JSON.stringify(data),
		user: variables['trigger.user']
	})

	await progressWorkflow({ executionId: id, continuationToken })
}

interface ProgressWorkflow {
	executionId: number
	continuationToken: string
	updateVariables?: Record<string, string>
	nextBlockId?: string
}

export async function progressWorkflow({
	executionId,
	continuationToken,
	updateVariables,
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
		throw new Error('Workflow next step not found. This should never happen.')
	}
	if (step === NEXT || step.type === 'trigger') {
		// execution finished
		// TODO: log
		return
	}

	const handler = stepHandlers[step.type]
	if (!handler) {
		throw new Error(`Step ${step.type} is not implemented yet`)
	}

	let workflow: ReturnType<typeof Workflows.getWorkflow> | undefined
	const context: StepExecutionContext = {
		workflowId: execution.workflowId,
		executionId,
		data,
		params: step.params,
		getToken: async () => {
			if (!workflow) workflow = Workflows.getWorkflow({ id: execution.workflowId })
			const w = await workflow
			if (!w?.installation?.token) {
				throw new Error('Workflow has been uninstalled')
			}
			return w.installation.token
		},
		evaluate: async (step) => {
			if (!workflow) workflow = Workflows.getWorkflow({ id: execution.workflowId })
			return evaluateStep(step, data, workflow, executionId, execution.workflowId)
		}
	}

	data.blockId = step.id
	data.continuationToken = randomUUID()
	if (updateVariables) {
		Object.assign(data.variables, updateVariables)
	}
	await Executions.updateData({ id: executionId, data: JSON.stringify(data) })

	// don't await the next step
	handler(context).catch(async (error) => {
		console.error('failed to run next step in progressWorkflow,', executionId, data.blockId, error)
		sendErrorMessage(
			execution.workflowId,
			error instanceof Error ? error.message : String(error)
		).catch((error) => {
			console.error('error sending error message', error)
		})
	})
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
	executionId: number,
	workflowId: number
) {
	if (!step) throw new Error('A block is missing in the workflow')

	const context: StepExecutionContext = {
		workflowId,
		executionId,
		data,
		params: step.params,
		getToken: async () => {
			const w = await workflow
			if (!w?.installation?.token) {
				throw new Error('Workflow has been uninstalled')
			}
			return w.installation.token
		},
		evaluate: async (step) => {
			return evaluateStep(step, data, workflow, executionId, workflowId)
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

async function sendErrorMessage(workflowId: number, message: string) {
	const workflow = await Workflows.getWorkflow({ id: workflowId })
	if (!workflow) {
		console.error('sending error message to nonexistent workflow', workflowId)
		return
	}
	const mention = workflow.installation ? `<@${workflow.installation.userId}>` : workflow.name
	await slack.chat.postMessage({
		channel: workflow.authorId,
		text: `Your workflow, ${workflow.name}, finished with an error.`,
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `Your workflow, ${mention}, finished with an error. Please review the information below.`
				}
			},
			{
				type: 'rich_text',
				elements: [{ type: 'rich_text_preformatted', elements: [{ type: 'text', text: message }] }]
			}
		],
		token: SLACK_BOT_TOKEN
	})
}
