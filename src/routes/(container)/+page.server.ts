import { convertWorkflowToPublic } from '$lib/server/convert'
import type { PageServerLoad } from './$types'
import { Workflows } from '$lib/server/services'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth()

	const flows = session?.user.slackId
		? await Workflows.getWorkflowsByAuthor({ author: session.user.slackId })
		: []

	return {
		workflows: flows.map(convertWorkflowToPublic)
	}
}
