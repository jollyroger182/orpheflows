import { Slack, Users, Workflows } from '$lib/server/services'
import { redirect } from '@sveltejs/kit'
import z from 'zod'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth()
	if (!session?.user.slackId) return await locals.signIn('slack')

	const user = await Users.get({ id: session.user.slackId })
	if (!user) return await locals.signOut()

	const count = await Workflows.countWorkflowsByUser({ author: session.user.slackId })

	return {
		reachedLimit: count >= user.workflowLimit
	}
}

const CreateSchema = z.object({
	name: z.string().nonempty().max(36),
	description: z.string().nonempty().max(200)
})

export const actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth()
		if (!session?.user.slackId) {
			return { error: 'You are not logged in' }
		}

		const form = await request.formData()

		const { success, error, data } = CreateSchema.safeParse({
			name: form.get('name'),
			description: form.get('description')
		})
		if (!success) {
			return { error: z.prettifyError(error) }
		}
		const { name, description } = data

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
