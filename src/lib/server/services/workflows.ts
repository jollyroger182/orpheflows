import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { installations, workflows } from '../db/schema'
import { slack } from '../slack'

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
		with: { author: true, installation: true }
	})
}

interface GetWorkflowByClientId {
	clientId: string
}

export async function getWorkflowByClientId({ clientId }: GetWorkflowByClientId) {
	return await db.query.workflows.findFirst({
		where: eq(workflows.clientId, clientId),
		with: { author: true, installation: true }
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
	appId: string
	clientId: string
	clientSecret: string
	verificationToken: string
	signingSecret: string
}

export async function createWorkflow({
	author,
	name,
	description,
	appId,
	clientId,
	clientSecret,
	verificationToken,
	signingSecret
}: CreateWorkflow) {
	return (
		await db
			.insert(workflows)
			.values({
				authorId: author,
				name,
				description,
				appId,
				clientId,
				clientSecret,
				verificationToken,
				signingSecret
			})
			.returning()
	)[0]!
}

interface CreateWorkflowInstallation {
	id: number
	token: string
}

export async function createWorkflowInstallation({ id, token }: CreateWorkflowInstallation) {
	const resp = await slack.auth.test({ token })
	return (
		await db
			.insert(installations)
			.values({ token, workflowId: id, userId: resp.user_id! })
			.returning()
	)[0]!
}
