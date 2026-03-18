import { EXTERNAL_URL } from '$env/static/private'
import { ID } from '$lib/consts'
import { listeners as listenersSchema } from '$lib/server/db/schema'
import { Listeners, Workflows } from '$lib/server/services'
import { slack } from '$lib/server/slack'
import type { ActionsBlockElement, AppHomeOpenedEvent, ContextBlockElement } from '@slack/web-api'
import { and, eq } from 'drizzle-orm'
import { startWorkflow } from '../execution'

export async function handleWorkflowEvent(
	payload: Slack.EventCallback,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	const { event } = payload

	if (event.type === 'app_home_opened') {
		if (event.tab !== 'home') return
		await updateAppHome(workflow, event)
	} else if (event.type === 'reaction_added') {
		console.log(payload)
		const listeners = await Listeners.getByFilter({
			filter: and(
				eq(listenersSchema.event, 'reaction_added'),
				eq(listenersSchema.param, `${event.item.channel};${event.reaction}`),
				eq(listenersSchema.triggersWorkflowId, workflow.id)
			)
		})
		for (const listener of listeners) {
			await startWorkflow({
				workflowId: workflow.id,
				variables: {
					'trigger.message': JSON.stringify({ channel: event.item.channel, ts: event.item.ts }),
					'trigger.user': event.user
				},
				findTrigger: (step) =>
					listener.data
						? step.id === JSON.parse(listener.data).trigger
						: step.params.TRIGGER === 'REACTION' &&
							step.params.CHANNEL === event.item.channel &&
							step.params.EMOJI === event.reaction
			})
		}
	} else if (event.type === 'message') {
		if (
			(!event.subtype || event.subtype === 'file_share' || event.subtype === 'thread_broadcast') &&
			(event.channel_type === 'channel' ||
				event.channel_type === 'group' ||
				event.channel_type === 'mpim')
		) {
			const listeners = await Listeners.getByFilter({
				filter: and(
					eq(listenersSchema.event, 'message_received'),
					eq(listenersSchema.param, event.channel),
					eq(listenersSchema.triggersWorkflowId, workflow.id)
				)
			})
			for (const listener of listeners) {
				await startWorkflow({
					workflowId: workflow.id,
					variables: {
						'trigger.message': JSON.stringify({
							channel: event.channel,
							ts: event.ts,
							text: event.text || ''
						}),
						'trigger.user': event.user
					},
					findTrigger: (step) =>
						listener.data
							? step.id === JSON.parse(listener.data).trigger
							: step.params.TRIGGER === 'MESSAGE' && step.params.CHANNEL === event.channel
				})
			}
		} else if (
			(!event.subtype || event.subtype === 'file_share' || event.subtype === 'thread_broadcast') &&
			(event.channel_type === 'im' || event.channel_type === 'app_home')
		) {
			const listeners = await Listeners.getByFilter({
				filter: and(
					eq(listenersSchema.event, 'dm_received'),
					eq(listenersSchema.triggersWorkflowId, workflow.id)
				)
			})
			for (const listener of listeners) {
				await startWorkflow({
					workflowId: workflow.id,
					variables: {
						'trigger.message': JSON.stringify({
							channel: event.channel,
							ts: event.ts,
							text: event.text || ''
						}),
						'trigger.user': event.user
					},
					findTrigger: (step) =>
						listener.data
							? step.id === JSON.parse(listener.data).trigger
							: step.params.TRIGGER === 'DM'
				})
			}
		}
	}
}

async function updateAppHome(
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {},
	event: AppHomeOpenedEvent
) {
	const version = await Workflows.getLatestVersion({ id: workflow.id })
	const hasManualTrigger =
		!!version &&
		!!(JSON.parse(version.code) as WorkflowStep[]).find(
			(s) => s.type === 'trigger' && s.params.TRIGGER === 'MANUAL'
		)

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

	const runElements: ActionsBlockElement[] = hasManualTrigger
		? [
				{
					type: 'button',
					text: { type: 'plain_text', text: 'Run workflow' },
					style: 'primary',
					action_id: ID.runWorkflow
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
					elements: [...editElements, ...runElements]
				}
			]
		},
		token: workflow.installation!.token
	})
}
