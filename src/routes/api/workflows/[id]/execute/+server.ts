import { authorize } from '$lib/server/middleware'
import { startWorkflow } from '$lib/server/workflows/execution/index.js'
import { error, json } from '@sveltejs/kit'
import z from 'zod'

const ExecuteSchema = z.object({
	data: z.string().optional()
})

export async function POST({ request, locals, params }) {
	const slackId = await authorize({ request, locals })

	const id = Number(params.id)
	if (!Number.isInteger(id)) return error(404)

	const result = ExecuteSchema.safeParse(await request.json())
	if (!result.success) return error(400, z.prettifyError(result.error))
	const { data } = result.data

	try {
		await startWorkflow({
			workflowId: id,
			variables: { 'trigger.user': slackId, 'trigger.data': data || '' },
			findTrigger: (step) => step.params.TRIGGER === 'API'
		})
	} catch (e) {
		console.error('Failed to run workflow from api', e)
		return error(500, 'Failed to run workflow')
	}

	return json({ success: true }, { status: 201 })
}
