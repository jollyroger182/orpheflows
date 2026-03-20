import { Workflows } from '$lib/server/services'
import { startWorkflow } from '$lib/server/workflows/execution/index.js'
import { error, json } from '@sveltejs/kit'
import z from 'zod'

const RequestSchema = z.object({
	id: z.int()
})

export async function POST({ request, locals }) {
	const session = await locals.auth()
	if (!session?.user.slackId) return error(401, 'Not logged in')

	let data: z.infer<typeof RequestSchema>
	try {
		data = RequestSchema.parse(await request.json())
	} catch {
		return error(400, 'Invalid parameters')
	}

	const { id } = data

	const workflow = await Workflows.getWorkflow({ id })
	if (workflow?.authorId !== session.user.slackId) return error(403, 'You do not own this workflow')

	try {
		await startWorkflow({
			workflowId: id,
			variables: { 'trigger.user': session.user.slackId },
			findTrigger: (step) => step.params.TRIGGER === 'EDITOR'
		})
	} catch (e) {
		console.error('Failed to run workflow from editor', e)
		return error(
			500,
			'Failed to run workflow. Did you publish your version with the editor trigger?'
		)
	}

	return json({ success: true })
}
