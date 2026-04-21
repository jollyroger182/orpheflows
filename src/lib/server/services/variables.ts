import { PERSISTENCE_VAR_LENGTH_LIMIT } from '$lib/consts'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { variables, workflows } from '../db/schema'

interface Get {
	workflowId: number
	name: string
}

export async function get({ workflowId, name }: Get) {
	return await db.query.variables.findFirst({
		where: and(eq(variables.workflowId, workflowId), eq(variables.name, name))
	})
}

export async function getAllByWorkflow(id: number) {
	return await db.query.workflows.findFirst({
		where: eq(workflows.id, id),
		with: { variables: true }
	})
}

interface SetVariable {
	workflowId: number
	name: string
	value: string
}

export async function set({ workflowId, name, value }: SetVariable) {
	const length = name.length + value.length
	if (length > PERSISTENCE_VAR_LENGTH_LIMIT) {
		throw new Error(
			`Persistent variable ${name} exceeded limit of ${PERSISTENCE_VAR_LENGTH_LIMIT} bytes per variable`
		)
	}
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

interface SetById {
	id: number
	value: string
	userId: string
}

export async function setById({
	id,
	value,
	userId
}: SetById): Promise<typeof variables.$inferSelect | undefined> {
	return (
		await db
			.update(variables)
			.set({ value })
			.from(workflows)
			.where(
				and(
					eq(variables.id, id),
					eq(variables.workflowId, workflows.id),
					eq(workflows.authorId, userId)
				)
			)
			.returning()
	)[0]
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

interface DeleteById {
	id: number
	userId: string
}

export async function deleteById({
	id,
	userId
}: DeleteById): Promise<typeof variables.$inferSelect | undefined> {
	return (
		await db
			.delete(variables)
			.where(
				and(
					eq(variables.id, id),
					eq(
						variables.workflowId,
						db
							.select({ id: workflows.id })
							.from(workflows)
							.where(and(eq(workflows.id, variables.workflowId), eq(workflows.authorId, userId)))
					)
				)
			)
			.returning()
	)[0]
}
