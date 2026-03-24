import { and, count, eq, gt } from 'drizzle-orm'
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
		await db.insert(executions).values({ workflowId, versionId, data, userId: user }).returning()
	)[0]!
	await AuditLogs.create({
		action: 'workflow.execute',
		user,
		resourceType: 'workflow',
		resourceId: workflowId,
		metadata: { id: execution.id, versionId }
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

interface Count {
	workflowId: number
	createdAfter: Date
	userId?: string
}

export async function countWhere({ workflowId, createdAfter, userId }: Count) {
	return (
		await db
			.select({ count: count() })
			.from(executions)
			.where(
				and(
					eq(executions.workflowId, workflowId),
					gt(executions.createdAt, createdAfter),
					userId ? eq(executions.userId, userId) : undefined
				)
			)
	)[0]!.count
}

interface UpdateData {
	id: number
	data: string
}

export async function updateData({ id, data }: UpdateData) {
	return (await db.update(executions).set({ data }).where(eq(executions.id, id)).returning())[0]!
}
