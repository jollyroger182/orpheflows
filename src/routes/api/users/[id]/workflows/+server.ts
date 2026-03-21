import { convertWorkflowToPublic } from '$lib/server/convert.js'
import { Workflows } from '$lib/server/services'
import { error, json } from '@sveltejs/kit'
import z from 'zod'

const QuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(25),
	search: z.string().optional()
})

export async function GET({ url, params }) {
	const id = params.id

	const query = QuerySchema.safeParse({
		page: url.searchParams.get('page') || undefined,
		limit: url.searchParams.get('limit') || undefined,
		search: url.searchParams.get('search') || undefined
	})
	if (!query.success) return error(400, z.prettifyError(query.error))
	const { page, limit, search } = query.data

	const offset = (page - 1) * limit

	const workflows = await Workflows.getWorkflows({ authorId: id, limit, offset, search })

	return json(workflows.map((w) => convertWorkflowToPublic(w)))
}
