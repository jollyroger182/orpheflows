import { startWorkflow } from '$lib/server/workflows/slack'
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

	await startWorkflow({
		workflowId: id,
		variables: { 'trigger.user': session.user.slackId },
		findTrigger: (step) => step.params.TRIGGER === 'MANUAL'
	})

	return json({ success: true })
}
