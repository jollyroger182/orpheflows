import { Workflows } from '$lib/server/services'
import { slack } from '$lib/server/slack'

export async function handleWorkflowEvent(
	payload: Slack.EventCallback,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	const { event } = payload
	console.log(event)

	if (event.type === 'app_home_opened') {
		if (event.tab !== 'home') return
		await slack.views.publish({
			user_id: event.user,
			view: {
				type: 'home',
				blocks: [
					{
						type: 'section',
						text: { type: 'mrkdwn', text: `*${workflow.name}*` }
					},
					{
						type: 'actions',
						elements: [
							{
								type: 'button',
								text: { type: 'plain_text', text: 'Run workflow' },
								style: 'primary',
								action_id: 'run_workflow'
							}
						]
					}
				]
			},
			token: workflow.installation!.token
		})
	}
}
