import { Workflows } from '$lib/server/services'
import { handleWorkflowSlash } from '$lib/server/workflows/slack/slash'
import type { SlashCommand } from '@slack/bolt'
import { error, text } from '@sveltejs/kit'

export async function POST({ request }) {
	const form = await request.formData()

	const token = form.get('token')
	if (typeof token !== 'string') return error(400)

	const workflow = await Workflows.getWorkflowByVerificationToken({ verificationToken: token })
	if (!workflow) return error(400)

	handleWorkflowSlash(Object.fromEntries(form.entries()) as SlashCommand, workflow).catch(
		(error) => {
			console.error('error handling workflow slash command', error)
		}
	)

	return text('')
}
