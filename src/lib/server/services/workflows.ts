import {
	BLOCKS_LENGTH_LIMIT,
	CODE_LENGTH_LIMIT,
	EXECUTE_RATE_LIMIT_NOTIFY_INTERVAL,
	USER_EXECUTE_RATE_LIMIT_NOTIFY_INTERVAL
} from '$lib/consts'
import { and, count, desc, eq, ilike, isNull, lt, or } from 'drizzle-orm'
import { AuditLogs, Slack } from '.'
import { db } from '../db'
import {
	installations,
	listeners,
	users,
	versions,
	workflows,
	workflowUserNotifs
} from '../db/schema'
import { slack } from '../slack'

interface GetWorkflows {
	offset?: number
	limit?: number
	search?: string
	authorId?: string
}

export async function getWorkflows({
	offset = 0,
	limit = 10,
	search,
	authorId
}: GetWorkflows = {}) {
	const where = and(
		search ? ilike(workflows.name, `%${search}%`) : undefined,
		authorId ? eq(workflows.authorId, authorId) : undefined
	)
	return await db.query.workflows.findMany({
		offset,
		limit,
		where,
		orderBy: desc(workflows.createdAt),
		with: { author: true, installation: true }
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

export async function getWorkflowByUserId({ userId }: { userId: string }) {
	const installation = await db.query.installations.findFirst({
		where: eq(installations.userId, userId),
		with: { workflow: { with: { author: true } } }
	})
	if (!installation) return
	return { ...installation.workflow, installation: { ...installation, workflow: undefined } }
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
	return await db.transaction(async (tx) => {
		const user = (await tx.select().from(users).where(eq(users.id, author)))[0]
		if (!user) throw new Error('User is not registered')
		const cnt = (
			await tx.select({ count: count() }).from(workflows).where(eq(workflows.authorId, author))
		)[0].count
		if (cnt >= user.workflowLimit) throw new Error('User workflow limit reached')

		const workflow = (
			await tx
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
	})
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
	if (blocks && blocks.length > BLOCKS_LENGTH_LIMIT) {
		throw new Error(
			`Your serialized blocks is longer than the limit of ${BLOCKS_LENGTH_LIMIT} bytes.`
		)
	}
	if (code.length > CODE_LENGTH_LIMIT) {
		throw new Error(`Your transpiled code is longer than the limit of ${CODE_LENGTH_LIMIT} bytes.`)
	}
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

interface SetPublic {
	id: number
	public: boolean
	userId: string
}

export async function setPublic({ id, public: isPublic, userId }: SetPublic) {
	const workflow = (
		await db
			.update(workflows)
			.set({ isPublic })
			.where(and(eq(workflows.id, id), eq(workflows.authorId, userId)))
			.returning()
	)[0]
	if (workflow) {
		await AuditLogs.create({
			action: 'workflow.editPublic',
			user: userId,
			resourceType: 'workflow',
			resourceId: workflow.id,
			metadata: { isPublic }
		})
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
	if (blocks && blocks.length > BLOCKS_LENGTH_LIMIT) {
		throw new Error(
			`Your serialized blocks is longer than the limit of ${BLOCKS_LENGTH_LIMIT} bytes.`
		)
	}
	if (code.length > CODE_LENGTH_LIMIT) {
		throw new Error(`Your transpiled code is longer than the limit of ${CODE_LENGTH_LIMIT} bytes.`)
	}

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

		const addListener = (
			trigger: WorkflowStep,
			{ event, param, paramNum }: { event: string; param?: string; paramNum?: number }
		) =>
			tx.insert(listeners).values({
				triggersWorkflowId: id,
				event,
				param,
				paramNum,
				handler: 'start',
				data: JSON.stringify({ trigger: trigger.id })
			})

		for (const trigger of triggers) {
			if (trigger.params.TRIGGER === 'REACTION') {
				const channel = trigger.params.CHANNEL as string
				const emoji = trigger.params.EMOJI as string
				await addListener(trigger, { event: 'reaction_added', param: `${channel};${emoji}` })
			} else if (trigger.params.TRIGGER === 'MESSAGE') {
				const channel = trigger.params.CHANNEL as string
				await addListener(trigger, { event: 'message_received', param: channel })
			} else if (trigger.params.TRIGGER === 'DM') {
				await addListener(trigger, { event: 'dm_received' })
			} else if (trigger.params.TRIGGER === 'BUTTON') {
				const actionId = trigger.params.ACTIONID as string
				await addListener(trigger, { event: 'button_pressed', param: actionId })
			} else if (trigger.params.TRIGGER === 'SLASH') {
				const name = trigger.params.NAME as string
				await addListener(trigger, { event: 'slash_command', param: name })
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

export async function shouldSendNotification({ id }: { id: number }) {
	return await db.transaction(async (tx) => {
		const workflow = await tx.query.workflows.findFirst({
			where: and(
				eq(workflows.id, id),
				or(
					isNull(workflows.rateLimitNotifiedAt),
					lt(
						workflows.rateLimitNotifiedAt,
						new Date(Date.now() - EXECUTE_RATE_LIMIT_NOTIFY_INTERVAL)
					)
				)
			),
			with: { installation: true }
		})
		if (workflow) {
			await tx
				.update(workflows)
				.set({ rateLimitNotifiedAt: new Date() })
				.where(eq(workflows.id, id))
			return workflow
		}
	})
}

export async function shouldSendUserNotif({ id, userId }: { id: number; userId: string }) {
	return await db.transaction(async (tx) => {
		const notif = await tx.query.workflowUserNotifs.findFirst({
			where: and(eq(workflowUserNotifs.workflowId, id), eq(workflowUserNotifs.userId, userId)),
			with: { workflow: { with: { installation: true } } }
		})
		if (notif) {
			if (notif.notifiedAt.getTime() >= Date.now() - USER_EXECUTE_RATE_LIMIT_NOTIFY_INTERVAL) return
			await tx
				.update(workflowUserNotifs)
				.set({ notifiedAt: new Date() })
				.where(eq(workflows.id, id))
			return notif.workflow
		} else {
			await tx.insert(workflowUserNotifs).values({ workflowId: id, userId, notifiedAt: new Date() })
			return await tx.query.workflows.findFirst({
				where: eq(workflows.id, id),
				with: { installation: true }
			})
		}
	})
}
