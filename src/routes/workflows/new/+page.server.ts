import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { Slack, Workflows } from '$lib/server/services'

export const actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth()
		if (!session?.user.slackId) {
			return { error: 'You are not logged in' }
		}

		const data = await request.formData()
		const name = data.get('name')! as string
		const description = data.get('description')! as string

		if (!name) {
			return { error: 'Name is not provided' }
		}
		if (!description) {
			return { error: 'Description is not provided' }
		}

		const app = await Slack.createApp({ name })

		const { id } = await Workflows.createWorkflow({
			author: session.user.slackId,
			name,
			description,
			appId: app.appId,
			clientId: app.clientId,
			clientSecret: app.clientSecret,
			verificationToken: app.verificationToken,
			signingSecret: app.signingSecret
		})

		redirect(303, `/workflows/${id}`)
	}
} satisfies Actions
