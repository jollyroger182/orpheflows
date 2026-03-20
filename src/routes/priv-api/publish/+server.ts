import { Workflows } from '$lib/server/services'
import { error, json } from '@sveltejs/kit'
import z from 'zod'

const RequestSchema = z.object({
	id: z.int(),
	blocks: z.string(),
	code: z.string()
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

	const { id, blocks, code } = data

	const steps = JSON.parse(code) as WorkflowStep[]
	if (!steps.find((s) => s.type === 'trigger')) {
		return error(400, 'No trigger block found')
	}

	const workflow = await Workflows.publishVersion({
		id,
		blocks,
		code,
		userId: session.user.slackId
	})
	if (!workflow) return error(404, 'Workflow not found')

	const hasEditorTrigger = steps.find((s) => s.type === 'trigger' && s.params.TRIGGER === 'EDITOR')

	return json({ success: true, hasEditorTrigger })
}
