import { convertWorkflowToPublic } from '$lib/server/convert'
import { db } from '$lib/server/db'
import { workflows } from '$lib/server/db/schema'
import { desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth()

	const flows = session
		? await db.query.workflows.findMany({
				limit: 10,
				orderBy: desc(workflows.createdAt),
				with: { author: true }
			})
		: []

	return {
		workflows: flows.map(convertWorkflowToPublic)
	}
}
