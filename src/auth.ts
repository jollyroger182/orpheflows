import { db } from '$lib/server/db'
import { users } from '$lib/server/db/schema'
import { SvelteKitAuth } from '@auth/sveltekit'
import Slack from '@auth/sveltekit/providers/slack'

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [Slack],
	callbacks: {
		async signIn(params) {
			const id = params.profile!.sub!
			const name = params.user.name || 'unknown'
			const photo_url = params.user.image || null
			if (id) {
				await db
					.insert(users)
					.values({ id, name, photo_url })
					.onConflictDoUpdate({ target: users.id, set: { name, photo_url } })
			}
			return true
		}
	}
})
