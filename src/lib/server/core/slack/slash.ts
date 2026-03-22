import { EXTERNAL_URL } from '$env/static/private'
import { Workflows } from '$lib/server/services'
import { startWorkflow } from '$lib/server/workflows/execution'
import { generateWorkflowBlocks } from '$lib/server/workflows/slack/blocks'
import type { SlashCommand } from '@slack/bolt'

export async function handleCoreSlash(payload: SlashCommand) {
	if (payload.command.endsWith('orpheflows-info')) {
		const workflow = await parseWorkflowMention(payload.text)
		if (!workflow) {
			await fetch(payload.response_url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: 'Please specify a valid workflow mention.' })
			})
			return
		}

		await fetch(payload.response_url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				text: `${EXTERNAL_URL}/workflows/${workflow.id}`,
				attachments: [
					{ blocks: await generateWorkflowBlocks(workflow, { edit: false, view: true }) }
				]
			})
		})
		return
	} else if (payload.command.endsWith('orpheflows-run')) {
		const workflow = await parseWorkflowMention(payload.text)
		if (!workflow) {
			await fetch(payload.response_url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: 'Please specify a valid workflow mention.' })
			})
			return
		}

		try {
			await startWorkflow({
				workflowId: workflow.id,
				variables: { 'trigger.user': payload.user_id, 'trigger.trigger_id': payload.trigger_id },
				findTrigger: (step) => step.params.TRIGGER === 'MANUAL'
			})
		} catch (e) {
			await fetch(payload.response_url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: `Failed to start workflow! Error: ${String(e)}` })
			})
			return
		}

		await fetch(payload.response_url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: 'Workflow started successfully!' })
		})
	}
}

async function parseWorkflowMention(mention: string) {
	console.log(mention)
	let match: RegExpMatchArray | null
	if ((match = mention.match(/^<@([A-Z0-9]+)(?:\|.*)?>$/))) {
		const workflowUserId = match[1]
		return await Workflows.getWorkflowByUserId({ userId: workflowUserId })
	} else if (
		(match = mention.match(
			new RegExp(`^<${EXTERNAL_URL.replaceAll('.', '\\.')}/workflows/([1-9][0-9]*)(?:\\|.*)?>$`)
		))
	) {
		const workflowId = parseInt(match[1])
		return await Workflows.getWorkflow({ id: workflowId })
	}
}
