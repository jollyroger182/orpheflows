import { db } from '$lib/server/db'
import { users } from '$lib/server/db/schema'
import { SvelteKitAuth } from '@auth/sveltekit'
import Slack from '@auth/sveltekit/providers/slack'

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [Slack],
	trustHost: true,
	useSecureCookies: true,
	callbacks: {
		async signIn({ account, user }) {
			console.log('signin', account, user, )
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
	}
})
