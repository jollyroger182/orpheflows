import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { db } from '$lib/server/db'
import { workflows } from '$lib/server/db/schema'

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

		const [{ id }] = await db
			.insert(workflows)
			.values({ name, description, authorId: session.user.slackId })
			.returning({ id: workflows.id })

		redirect(303, `/workflows/${id}`)
	}
} satisfies Actions
