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

	return json(
		flows.map((f) => ({
			id: f.id,
			author: { id: f.author.id, name: f.author.name, photo_url: f.author.photo_url },
			name: f.name,
			description: f.description,
			createdAt: f.createdAt
		}))
	)
}
