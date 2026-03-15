import { convertWorkflowToPublic } from '$lib/server/convert'
import { db } from '$lib/server/db'
import { workflows } from '$lib/server/db/schema'
import { json } from '@sveltejs/kit'
import { desc } from 'drizzle-orm'

export async function GET() {
	const flows = await db.query.workflows.findMany({
		limit: 10,
		orderBy: desc(workflows.createdAt),
		with: { author: true }
	})

	return json(flows.map((f) => convertWorkflowToPublic(f)))
}
