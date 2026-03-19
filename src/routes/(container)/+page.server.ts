import { convertWorkflowToPublic } from '$lib/server/convert'
import type { PageServerLoad } from './$types'
import { Workflows } from '$lib/server/services'

const PER_PAGE = 25

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = Number(url.searchParams.get('page') ?? '1')

	const limit = PER_PAGE
	const offset = (page - 1) * PER_PAGE

	const session = await locals.auth()

	const flows = session?.user.slackId
		? await Workflows.getWorkflowsByAuthor({ author: session.user.slackId, limit, offset })
		: []

	const total = session?.user.slackId
		? await Workflows.countWorkflowsByUser({ author: session.user.slackId })
		: 0

	return {
		workflows: flows.map(convertWorkflowToPublic),
		page,
		total,
		totalPages: Math.ceil(total / limit)
	}
}
