import { convertWorkflowToPublic } from '$lib/server/convert'
import { Workflows } from '$lib/server/services'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	const id = parseInt(params.id)
	if (isNaN(id)) return error(404, 'Workflow not found')

	const flow = await Workflows.getWorkflow({ id })
	if (!flow) return error(404, 'Workflow not found')

	const session = await locals.auth()

	const isOwner = flow.authorId == session?.user.slackId
	const isInstalled = !!flow.installation

	return {
		workflow: convertWorkflowToPublic(flow),
		clientId: isOwner ? flow.clientId : null,
		isOwner,
		isInstalled
	}
}
