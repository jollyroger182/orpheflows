import { and, eq, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { listeners } from '../db/schema'

interface Create {
	event: string
	triggersWorkflowId?: number
	param?: string
	paramNum?: number
	handler: string
	data?: string
}

export async function create({
	event,
	triggersWorkflowId,
	param,
	paramNum,
	handler,
	data
}: Create) {
	return (
		await db
			.insert(listeners)
			.values({ event, triggersWorkflowId, param, paramNum, handler, data })
			.returning()
	)[0]!
}

interface GetByEvent {
	event: string
}

export async function getByEvent({ event }: GetByEvent) {
	return await db.query.listeners.findMany({
		where: and(eq(listeners.event, event))
	})
}

interface GetByParam {
	event: string
	param: string
}

export async function getByParam({ event, param }: GetByParam) {
	return await db.query.listeners.findMany({
		where: and(eq(listeners.event, event), eq(listeners.param, param))
	})
}

interface GetByFilter {
	filter?: SQL
}

export async function getByFilter({ filter }: GetByFilter) {
	return await db.query.listeners.findMany({ where: filter })
}
