import { and, eq, gt } from 'drizzle-orm'
import { db } from '../db'
import { tokens, users } from '../db/schema'
import { createHash, randomUUID } from 'crypto'
import { AuditLogs } from '.'

interface CreateOrUpdate {
	id: string
	name: string
	photo_url: string | null
}

export async function createOrUpdate({ id, name, photo_url }: CreateOrUpdate) {
	return (
		await db
			.insert(users)
			.values({ id, name, photo_url })
			.onConflictDoUpdate({ target: users.id, set: { name, photo_url } })
			.returning()
	)[0]!
}

interface Get {
	id: string
}

export async function get({ id }: Get) {
	return await db.query.users.findFirst({ where: eq(users.id, id), with: { tokens: true } })
}

interface CreateUserToken {
	userId: string
	name?: string
	expiresAt?: Date
}

export async function createUserToken({ userId, name, expiresAt }: CreateUserToken) {
	const token = randomUUID()

	const hasher = createHash('sha256')
	hasher.update(token)
	const hash = hasher.digest('hex')

	const result = (
		await db.insert(tokens).values({ userId, tokenHash: hash, name, expiresAt }).returning()
	)[0]!
	await AuditLogs.create({
		action: 'token.create',
		user: userId,
		resourceType: 'token',
		resourceId: result.id,
		metadata: { name, expiresAt: expiresAt?.toISOString() }
	})
	return { ...result, token }
}

interface GetUserToken {
	token: string
}

export async function getUserToken({ token }: GetUserToken) {
	const hasher = createHash('sha256')
	hasher.update(token)
	const hash = hasher.digest('hex')

	return await db.query.tokens.findFirst({
		where: and(eq(tokens.tokenHash, hash), gt(tokens.expiresAt, new Date())),
		with: { user: true }
	})
}

interface DeleteUserToken {
	id: number
}

export async function deleteUserToken({ id }: DeleteUserToken) {
	const deleted = (await db.delete(tokens).where(eq(tokens.id, id)).returning())[0]
	if (deleted) {
		await AuditLogs.create({
			action: 'token.delete',
			user: deleted.userId,
			resourceType: 'token',
			resourceId: id,
			metadata: { lastUsed: deleted.lastUsed?.toISOString() || null }
		})
	}
}

interface UpdateWorkflowLimit {
	id: string
	limit: number
	actorId?: string
}

export async function updateWorkflowLimit({ id, limit, actorId }: UpdateWorkflowLimit) {
	const result = (
		await db.update(users).set({ workflowLimit: limit }).where(eq(users.id, id)).returning()
	)[0]
	if (result) {
		await AuditLogs.create({
			action: 'user.updateLimit',
			user: actorId,
			resourceType: 'user',
			resourceId: id,
			metadata: { limit }
		})
	}
	return result
}
