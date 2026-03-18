import { eq } from 'drizzle-orm'
import { db } from '../db'
import { executions } from '../db/schema'
import { AuditLogs } from '.'

interface Create {
	workflowId: number
	versionId: number
	data: string
	user?: string
}

export async function create({ workflowId, versionId, data, user }: Create) {
	const execution = (
		await db.insert(executions).values({ workflowId, versionId, data }).returning()
	)[0]!
	await AuditLogs.create({
		action: 'execution.start',
		user,
		resourceType: 'execution',
		resourceId: execution.id,
		metadata: { workflowId, versionId }
	})
	return execution
}

interface Get {
	id: number
}

export async function getWithVersion({ id }: Get) {
	return await db.query.executions.findFirst({
		where: eq(executions.id, id),
		with: { version: true }
	})
}

interface UpdateData {
	id: number
	data: string
}

export async function updateData({ id, data }: UpdateData) {
	return (await db.update(executions).set({ data }).where(eq(executions.id, id)).returning())[0]!
}
