import { authorize } from '$lib/server/middleware'
import { Variables } from '$lib/server/services'
import { error, json } from '@sveltejs/kit'

export async function GET({ locals, params, request }) {
	const userId = await authorize({ locals, request })

	const id = parseInt(params.id)
	if (isNaN(id)) return error(404, 'Workflow not found')

	const workflow = await Variables.getAllByWorkflow(id)
	if (workflow?.authorId !== userId) return error(403, 'Forbidden')

	return json(
		workflow.variables.map((v) => ({
			id: v.id,
			workflowId: v.workflowId,
			name: v.name,
			value: v.value
		}))
	)
}
