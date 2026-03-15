import { SvelteKitAuth } from '@auth/sveltekit'
import Slack from '@auth/sveltekit/providers/slack'

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [Slack]
})
