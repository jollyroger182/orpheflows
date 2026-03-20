import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { variables } from '../db/schema'

interface Get {
	workflowId: number
	name: string
}

export async function get({ workflowId, name }: Get) {
	return await db.query.variables.findFirst({
		where: and(eq(variables.workflowId, workflowId), eq(variables.name, name))
	})
}

interface SetVariable {
	workflowId: number
	name: string
	value: string
}

export async function set({ workflowId, name, value }: SetVariable) {
	return (
		await db
			.insert(variables)
			.values({ workflowId, name, value })
			.onConflictDoUpdate({
				target: [variables.workflowId, variables.name],
				set: { value }
			})
			.returning()
	)[0]!
}

interface Delete {
	workflowId: number
	name: string
}

export async function deleteVariable({ workflowId, name }: Delete) {
	return (
		await db
			.delete(variables)
			.where(and(eq(variables.workflowId, workflowId), eq(variables.name, name)))
			.returning()
	)[0]
}
