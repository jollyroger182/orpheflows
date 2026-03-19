import { db } from '$lib/server/db'
import { users } from '$lib/server/db/schema'
import { AuditLogs } from '$lib/server/services'
import { SvelteKitAuth } from '@auth/sveltekit'
import Slack from '@auth/sveltekit/providers/slack'

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [Slack],
	trustHost: true,
	useSecureCookies: true,
	callbacks: {
		async signIn({ account, user }) {
			const id = account?.providerAccountId
			const name = user.name || 'unknown'
			const photo_url = user.image || null
			if (id) {
				await db
					.insert(users)
					.values({ id, name, photo_url })
					.onConflictDoUpdate({ target: users.id, set: { name, photo_url } })
			}
			return true
		},

		jwt({ token, account }) {
			if (account?.providerAccountId) {
				token.slackId = account.providerAccountId
			}
			return token
		},

		session({ session, token }) {
			session.user.slackId = token.slackId
			return session
		}
	},
	events: {
		async signIn(message) {
			if (!message.account?.providerAccountId) {
				console.warn('no account id in sign in event', message)
				return
			}
			await AuditLogs.create({
				action: 'user.login',
				user: message.account.providerAccountId,
				resourceType: 'user',
				resourceId: message.account.providerAccountId
			})
		},
		async signOut(message) {
			if ('token' in message && message.token?.slackId) {
				await AuditLogs.create({
					action: 'user.logout',
					user: message.token.slackId,
					resourceType: 'user',
					resourceId: message.token.slackId
				})
			} else {
				console.warn('no token or slack id in sign out event', message)
			}
		}
	}
})
