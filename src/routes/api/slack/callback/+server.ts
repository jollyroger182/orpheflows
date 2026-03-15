import { Workflows } from '$lib/server/services'
import { slack } from '$lib/server/slack'
import { error, redirect } from '@sveltejs/kit'

export async function GET({ url }) {
	const code = url.searchParams.get('code')
	const clientId = url.searchParams.get('state')

	if (typeof code !== 'string' || typeof clientId !== 'string') {
		return error(400, 'Invalid parameters')
	}

	const workflow = await Workflows.getWorkflowByClientId({ clientId })
	if (!workflow) {
		console.warn('Workflow with client_id', clientId, 'not found')
		return error(400, 'Invalid parameters')
	}

	const resp = await slack.oauth.v2.access({
		client_id: workflow.clientId,
		client_secret: workflow.clientSecret,
		code
	})

	await Workflows.createWorkflowInstallation({ id: workflow.id, token: resp.access_token! })

	return redirect(307, `/workflows/${workflow.id}`)
}
