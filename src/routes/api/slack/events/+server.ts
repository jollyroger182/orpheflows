import { SLACK_VERIFICATION_TOKEN } from '$env/static/private'
import { Workflows } from '$lib/server/services'
import { error, text } from '@sveltejs/kit'
import { handleCoreEvent } from '$lib/server/core/slack/events'
import { handleWorkflowEvent } from '$lib/server/workflows/slack/events'

export async function POST({ request }) {
	const payload = await request.json()

	if (typeof payload !== 'object' || typeof payload.token !== 'string') return error(400)

	const token: string = payload.token

	if (token === SLACK_VERIFICATION_TOKEN) {
		if (payload.type === 'url_verification') {
			return text(payload.challenge)
		} else {
			handleCoreEvent(payload).catch((error) => {
				console.error('error handling core event', error)
			})
			return text('')
		}
	}

	const workflow = await Workflows.getWorkflowByVerificationToken({ verificationToken: token })
	if (!workflow) return error(400)

	if (payload.type === 'url_verification') {
		return text(payload.challenge)
	} else {
		handleWorkflowEvent(payload, workflow).catch((error) => {
			console.error('error handling workflow event for workflow', workflow.id, error)
		})
		return text('')
	}
}
