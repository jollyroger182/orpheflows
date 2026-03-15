import { desc } from 'drizzle-orm'
import { db } from '../db'
import { configTokens } from '../db/schema'
import { slack } from '../slack'

async function refresh(refreshToken: string) {
	const resp = await slack.tooling.tokens.rotate({
		refresh_token: refreshToken
	})
	return (
		await db
			.insert(configTokens)
			.values({
				refreshToken: resp.refresh_token!,
				token: resp.token!,
				expiresAt: new Date(resp.exp! * 1000)
			})
			.returning()
	)[0]!
}

export async function getActiveConfigToken() {
	let token = await db.query.configTokens.findFirst({
		orderBy: desc(configTokens.createdAt)
	})
	if (!token) return

	if (token.expiresAt.getTime() < Date.now() + 60 * 60 * 1000) {
		token = await refresh(token.refreshToken)
	}

	return token.token
}
