import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { workflows } from '../db/schema'

interface GetWorkflows {
	limit?: number
}

export async function getWorkflows({ limit = 10 }: GetWorkflows = {}) {
	return await db.query.workflows.findMany({
		limit,
		orderBy: desc(workflows.createdAt),
		with: { author: true }
	})
}

interface GetWorkflow {
	id: number
}

export async function getWorkflow({ id }: GetWorkflow) {
	return await db.query.workflows.findFirst({
		where: eq(workflows.id, id),
		with: { author: true }
	})
}

interface GetWorkflowsByUser {
	author: string
	limit?: number
}

export async function getWorkflowsByAuthor({ author, limit = 10 }: GetWorkflowsByUser) {
	return await db.query.workflows.findMany({
		where: eq(workflows.authorId, author),
		limit,
		orderBy: desc(workflows.createdAt),
		with: { author: true }
	})
}

interface CreateWorkflow {
	author: string
	name: string
	description: string
}

export async function createWorkflow({ author, name, description }: CreateWorkflow) {
	return (
		await db.insert(workflows).values({ authorId: author, name, description }).returning()
	)[0]!
}
