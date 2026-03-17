import { EXTERNAL_URL } from '$env/static/private'
import { Listeners, Workflows } from '$lib/server/services'
import { slack } from '$lib/server/slack'
import type { ActionsBlockElement, AppHomeOpenedEvent, ContextBlockElement } from '@slack/web-api'
import { startWorkflow } from '../execution'

export async function handleWorkflowEvent(
	payload: Slack.EventCallback,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	const { event } = payload
	console.log(event)

	if (event.type === 'app_home_opened') {
		if (event.tab !== 'home') return
		await updateAppHome(workflow, event)
	} else if (event.type === 'reaction_added') {
		const listeners = await Listeners.getByParam({
			event: 'reaction_added',
			param: `${event.item.channel};${event.reaction}`
		})
		for (const listener of listeners) {
			if (listener.triggersWorkflowId) {
				await startWorkflow({
					workflowId: listener.triggersWorkflowId,
					variables: {
						'trigger.message': JSON.stringify({ channel: event.item.channel, ts: event.item.ts }),
						'trigger.user': event.user
					}
				})
			}
		}
	}
}

async function updateAppHome(
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {},
	event: AppHomeOpenedEvent
) {
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
