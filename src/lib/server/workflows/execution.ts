import { Executions, Workflows } from '../services'

interface ExecutionData {
	blockId: string
}

interface Start {
	workflowId: number
	code: string
	variables?: Record<string, string>
}

export async function startWorkflow(params: Start) {
	// const { workflowId, code, variables = {} } = params

	// const version = await Workflows.getLatestVersion({ id: workflowId })
	// if (!version) return

	// const data: ExecutionData = {}

	// const execution = await Executions.create({ workflowId, versionId: version.id, data })
}
