import { SLACK_VERIFICATION_TOKEN } from '$env/static/private'
import { handleCoreInteraction } from '$lib/server/core/slack/interactions.js'
import { Workflows } from '$lib/server/services'
import { handleWorkflowInteraction } from '$lib/server/workflows/slack/interactions.js'
import { error, text } from '@sveltejs/kit'

export async function POST({ request }) {
	const formData = await request.formData()
	const payload = formData.get('payload')
	if (typeof payload !== 'string') return error(400)

	const data = JSON.parse(payload)

	if (typeof data !== 'object' || typeof data.token !== 'string') return error(400)

	const token: string = data.token

	if (token === SLACK_VERIFICATION_TOKEN) {
		handleCoreInteraction(data)
		return text('')
	}

	const workflow = await Workflows.getWorkflowByVerificationToken({ verificationToken: token })
	if (!workflow) return error(400)

	handleWorkflowInteraction(data, workflow)
	return text('')
}
