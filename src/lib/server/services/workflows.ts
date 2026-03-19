import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { installations, listeners, versions, workflows } from '../db/schema'
import { slack } from '../slack'
import { AuditLogs, Slack } from '.'

interface GetWorkflows {
	offset?: number
	limit?: number
}

export async function getWorkflows({ offset = 0, limit = 10 }: GetWorkflows = {}) {
	return await db.query.workflows.findMany({
		offset,
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
	offset?: number
}

export async function getWorkflowsByAuthor({ author, limit = 10, offset = 0 }: GetWorkflowsByUser) {
	return await db.query.workflows.findMany({
		where: eq(workflows.authorId, author),
		limit,
		offset,
		orderBy: desc(workflows.createdAt),
		with: { author: true }
	})
}

interface CountWorkflowsByUser {
	author: string
}

export async function countWorkflowsByUser({ author }: CountWorkflowsByUser) {
	return (
		await db.select({ count: count() }).from(workflows).where(eq(workflows.authorId, author))
	)[0]!.count
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
	source?: string
}

export async function createWorkflow({
	author,
	name,
	description,
	appId,
	clientId,
	clientSecret,
	verificationToken,
	signingSecret,
	source
}: CreateWorkflow) {
	const workflow = (
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
	await AuditLogs.create({
		action: 'workflow.create',
		user: author,
		resourceType: 'workflow',
		resourceId: workflow.id,
		metadata: { name, description },
		source
	})
	return workflow
}

interface CreateWorkflowInstallation {
	id: number
	token: string
}

export async function createWorkflowInstallation({ id, token }: CreateWorkflowInstallation) {
	const resp = await slack.auth.test({ token })
	const installation = (
		await db
			.insert(installations)
			.values({ token, workflowId: id, userId: resp.user_id! })
			.returning()
	)[0]!
	await AuditLogs.create({
		action: 'installation.create',
		resourceType: 'installation',
		resourceId: installation.id,
		metadata: { workflowId: id }
	})
	return installation
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

interface SetDetails {
	id: number
	name: string
	description: string
	userId: string
}

export async function setDetails({
	id,
	name,
	description,
	userId
}: SetDetails): Promise<typeof workflows.$inferSelect | undefined> {
	const workflow = (
		await db
			.update(workflows)
			.set({ name, description })
			.where(and(eq(workflows.id, id), eq(workflows.authorId, userId)))
			.returning()
	)[0]
	if (workflow) {
		await AuditLogs.create({
			action: 'workflow.editDetails',
			user: userId,
			resourceType: 'workflow',
			resourceId: workflow.id,
			metadata: { name, description }
		})
		await Slack.updateApp({ workflow })
	}
	return workflow
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
				await tx.insert(listeners).values({
					triggersWorkflowId: id,
					event: 'reaction_added',
					param: `${channel};${emoji}`,
					handler: 'start',
					data: JSON.stringify({ trigger: trigger.id })
				})
			} else if (trigger.params.TRIGGER === 'MESSAGE') {
				const channel = trigger.params.CHANNEL as string
				await tx.insert(listeners).values({
					triggersWorkflowId: id,
					event: 'message_received',
					param: channel,
					handler: 'start',
					data: JSON.stringify({ trigger: trigger.id })
				})
			} else if (trigger.params.TRIGGER === 'DM') {
				await tx.insert(listeners).values({
					triggersWorkflowId: id,
					event: 'dm_received',
					handler: 'start',
					data: JSON.stringify({ trigger: trigger.id })
				})
			} else if (trigger.params.TRIGGER === 'BUTTON') {
				await tx.insert(listeners).values({
					triggersWorkflowId: id,
					event: 'button_pressed',
					param: trigger.params.ACTIONID as string,
					handler: 'start',
					data: JSON.stringify({ trigger: trigger.id })
				})
			} else if (trigger.params.TRIGGER === 'SLASH') {
				await tx.insert(listeners).values({
					triggersWorkflowId: id,
					event: 'slash_command',
					param: trigger.params.NAME as string,
					handler: 'start',
					data: JSON.stringify({ trigger: trigger.id })
				})
			}
		}

		return { workflow, version }
	})
	if (result) {
		await AuditLogs.create({
			action: 'workflow.publish',
			user: userId,
			resourceType: 'workflow',
			resourceId: id,
			metadata: { versionId: result.version.id }
		})
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

interface Delete {
	id: number
	userId: string
}

export async function deleteWorkflow({ id, userId }: Delete) {
	const workflow = await db.transaction(async (tx) => {
		const result = (
			await tx
				.delete(workflows)
				.where(and(eq(workflows.id, id), eq(workflows.authorId, userId)))
				.returning()
		)[0]
		if (!result) return
		try {
			await Slack.deleteApp({ id: result.appId })
		} catch (e) {
			console.error('failed to delete slack app', e)
			throw e
		}
		return result
	})
	if (workflow) {
		await AuditLogs.create({
			action: 'workflow.delete',
			user: userId,
			resourceType: 'workflow',
			resourceId: id,
			metadata: { name: workflow.name }
		})
	}
	return workflow
}
