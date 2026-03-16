import { EXTERNAL_URL } from '$env/static/private'
import { Workflows } from '$lib/server/services'
import { slack } from '$lib/server/slack'
import type { ActionsBlockElement, ContextBlockElement } from '@slack/web-api'

export async function handleWorkflowEvent(
	payload: Slack.EventCallback,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	const { event } = payload
	console.log(event)

	if (event.type === 'app_home_opened') {
		if (event.tab !== 'home') return

		const pfpElements: ContextBlockElement[] = workflow.author.photo_url
			? [{ type: 'image', image_url: workflow.author.photo_url, alt_text: 'Profile picture' }]
			: []

		const editElements: ActionsBlockElement[] =
			workflow.authorId === event.user
				? [
						{
							type: 'button',
							text: { type: 'plain_text', text: 'Edit workflow' },
							url: `${EXTERNAL_URL}/workflows/${workflow.id}/edit`
						}
					]
				: []

		await slack.views.publish({
			user_id: event.user,
			view: {
				type: 'home',
				blocks: [
					{
						type: 'header',
						text: { type: 'plain_text', text: workflow.name }
					},
					{
						type: 'context',
						elements: [
							...pfpElements,
							{ type: 'mrkdwn', text: `<@${workflow.author.id}>` },
							{
								type: 'mrkdwn',
								text: `Created at <!date^${Math.round(workflow.createdAt.getTime() / 1000)}^{date}, {time}|${workflow.createdAt.toISOString()}>`
							}
						]
					},
					{
						type: 'section',
						text: { type: 'mrkdwn', text: workflow.description }
					},
					{
						type: 'actions',
						elements: [
							...editElements,
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
