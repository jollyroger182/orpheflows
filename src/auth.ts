import { WORKFLOW_LIMIT_VERIFIED } from '$lib/consts'
import { AuditLogs, Users } from '$lib/server/services'
import { checkIdv } from '$lib/server/utils'
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
				const dbUser = await Users.createOrUpdate({ id, name, photo_url })
				if (dbUser.workflowLimit < WORKFLOW_LIMIT_VERIFIED) {
					// check idv in background
					;(async () => {
						const isIdv = await checkIdv(id)
						if (isIdv) {
							await Users.updateWorkflowLimit({ id, limit: WORKFLOW_LIMIT_VERIFIED })
						}
					})()
				}
			}
			return true
		},

		async jwt({ token, account }) {
			if (account?.providerAccountId) {
				token.slackId = account.providerAccountId
				const user = await Users.get({ id: token.slackId })
				token.role = user?.role
			}
			return token
		},

		session({ session, token }) {
			session.user.slackId = token.slackId
			session.user.role = token.role
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
