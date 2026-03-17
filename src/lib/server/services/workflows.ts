import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { installations, listeners, versions, workflows } from '../db/schema'
import { slack } from '../slack'
import { Slack } from '.'

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

interface GetWorkflowByVerificationToken {
	verificationToken: string
}

export async function getWorkflowByVerificationToken({
	verificationToken
}: GetWorkflowByVerificationToken) {
	return await db.query.workflows.findFirst({
		where: eq(workflows.verificationToken, verificationToken),
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

interface SetCode {
	id: number
	blocks?: string
	code: string
	userId: string
}

export async function setCode({
	id,
	blocks,
	code,
	userId
}: SetCode): Promise<typeof workflows.$inferSelect | undefined> {
	const now = new Date()
	return (
		await db
			.update(workflows)
			.set({
				blocks,
				code,
				blocksUpdatedAt: blocks ? now : undefined,
				codeUpdatedAt: now
			})
			.where(and(eq(workflows.id, id), eq(workflows.authorId, userId)))
			.returning()
	)[0]
}

interface PublishVersion {
	id: number
	blocks?: string
	code: string
	userId: string
}

export async function publishVersion({ id, blocks, code, userId }: PublishVersion) {
	const now = new Date()

	const steps = JSON.parse(code) as WorkflowStep[]
	const triggers = steps.filter((s) => s.type === 'trigger')

	const result = await db.transaction(async (tx) => {
		const [workflow] = await tx
			.update(workflows)
			.set({
				blocks,
				code,
				blocksUpdatedAt: blocks ? now : undefined,
				codeUpdatedAt: now
			})
			.where(and(eq(workflows.id, id), eq(workflows.authorId, userId)))
			.returning()
		if (!workflow) return

		const [version] = await tx
			.insert(versions)
			.values({ workflowId: id, blocks: blocks, code: code })
			.returning()

		await tx.delete(listeners).where(eq(listeners.triggersWorkflowId, id))

		for (const trigger of triggers) {
			if (trigger.params.TRIGGER === 'REACTION') {
				const channel = trigger.params.CHANNEL as string
				const emoji = trigger.params.EMOJI as string
				await tx
					.insert(listeners)
					.values({
						triggersWorkflowId: id,
						event: 'reaction_added',
						param: `${channel};${emoji}`,
						handler: 'start',
					})
			}
		}

		return { workflow, version }
	})
	if (result) {
		await Slack.updateApp({ workflow: result.workflow })
	}
	return result
}

interface GetLatestVersion {
	id: number
}

export async function getLatestVersion({ id }: GetLatestVersion) {
	return await db.query.versions.findFirst({
		where: eq(versions.workflowId, id),
		orderBy: desc(versions.createdAt)
	})
}
