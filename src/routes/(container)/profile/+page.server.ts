import { WORKFLOW_LIMIT_VERIFIED } from '$lib/consts.js'
import { Users } from '$lib/server/services'
import z from 'zod'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth()
	if (!session?.user.slackId) return await locals.signIn('slack')

	const user = await Users.get({ id: session.user.slackId })
	if (!user) return await locals.signOut()

	const limitIncreases: string[] = []
	if (user.workflowLimit < WORKFLOW_LIMIT_VERIFIED) {
		limitIncreases.push('IDV')
	}
	limitIncreases.push('REQUEST')

	return {
		workflowLimit: user.workflowLimit,
		limitIncreases,
		tokens: user.tokens.map((token) => ({
			id: token.id,
			name: token.name,
			lastUsed: token.lastUsed,
			createdAt: token.createdAt,
			expiresAt: token.expiresAt
		}))
	}
}

const CreateTokenSchema = z.object({
	name: z.string().optional(),
	expiry: z.enum(['30', '60', '90', '0'])
})

const DeleteTokenSchema = z.object({
	id: z.coerce.number().int()
})

export const actions = {
	token: async ({ locals, request }) => {
		const session = await locals.auth()
		if (!session?.user.slackId) return await locals.signIn('slack')

		const form = await request.formData()
		const result = CreateTokenSchema.safeParse({
			name: form.get('name'),
			expiry: form.get('expiry')
		})
		if (!result.success) return { tokenError: z.prettifyError(result.error) }
		const { name, expiry } = result.data

		const days = parseInt(expiry)
		const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : undefined

		const token = await Users.createUserToken({ userId: session.user.slackId, name, expiresAt })

		return { token: token.token }
	},
	deleteToken: async ({ locals, request }) => {
		const session = await locals.auth()
		if (!session?.user.slackId) return await locals.signIn('slack')

		const form = await request.formData()
		const result = DeleteTokenSchema.safeParse({
			id: form.get('id')
		})
		if (!result.success) return { deleteError: z.prettifyError(result.error) }
		const { id } = result.data

		await Users.deleteUserToken({ id })
	},
	idv: async ({ locals }) => {
		const session = await locals.auth()
		if (!session?.user.slackId) return await locals.signIn('slack')

		const { result } = (await fetch(
			`https://auth.hackclub.com/api/external/check?slack_id=${session.user.slackId}`
		).then((r) => r.json())) as { result: string }

		const isIdv = result === 'verified_eligible' || result === 'verified_but_over_18'
		if (isIdv) {
			await Users.updateWorkflowLimit({
				id: session.user.slackId,
				limit: WORKFLOW_LIMIT_VERIFIED
			})
			return { limitMessage: 'Successfully updated your limit!' }
		} else {
			return { limitError: 'You are not ID verified.' }
		}
	}
}
