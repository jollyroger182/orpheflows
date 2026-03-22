import { EXTERNAL_URL } from '$env/static/private'
import { ID } from '$lib/consts'
import { Workflows } from '$lib/server/services'
import type { ActionsBlockElement, ContextBlockElement, KnownBlock } from '@slack/web-api'

export async function generateWorkflowBlocks(
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflow>> & {},
	{ edit = false, view = false }: { edit?: boolean; view?: boolean }
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

	const viewElements: ActionsBlockElement[] = view
		? [
				{
					type: 'button',
					text: { type: 'plain_text', text: 'View workflow' },
					action_id: ID.ignore1,
					url: `${EXTERNAL_URL}/workflows/${workflow.id}`
				}
			]
		: []

	const editElements: ActionsBlockElement[] = edit
		? [
				{
					type: 'button',
					text: { type: 'plain_text', text: 'Edit workflow' },
					action_id: ID.ignore2,
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
					action_id: ID.runWorkflow,
					value: JSON.stringify({ id: workflow.id })
				}
			]
		: []

	const actionBlocks: KnownBlock[] =
		viewElements.length || editElements.length || runElements.length
			? [
					{
						type: 'actions',
						elements: [...viewElements, ...editElements, ...runElements]
					}
				]
			: []

	return [
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
		...actionBlocks
	] satisfies KnownBlock[]
}
