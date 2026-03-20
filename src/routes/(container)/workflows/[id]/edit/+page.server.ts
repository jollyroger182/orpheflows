import { convertWorkflowToSelf } from '$lib/server/convert'
import { Workflows } from '$lib/server/services'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const id = parseInt(params.id)
	if (isNaN(id)) return error(404, 'Workflow not found')

	const flow = await Workflows.getWorkflow({ id })
	if (!flow) return error(404, 'Workflow not found')

	const session = await locals.auth()

	if (flow.authorId !== session?.user.slackId) return error(403, 'Forbidden')

	const version = await Workflows.getLatestVersion({ id })
	const hasEditorTrigger =
		version &&
		!!(JSON.parse(version.code) as WorkflowStep[]).find(
			(s) => s.type === 'trigger' && s.params.TRIGGER === 'EDITOR'
		)

	return {
		workflow: convertWorkflowToSelf(flow),
		dev: url.searchParams.has('dev'),
		hasEditorTrigger
	}
}
