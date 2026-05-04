import { Listeners, type Workflows } from '$lib/server/services'
import type { SlashCommand } from '@slack/bolt'
import { and, eq } from 'drizzle-orm'
import { listeners as listenersSchema } from '$lib/server/db/schema'
import { startWorkflow } from '../execution'

export async function handleWorkflowSlash(
	payload: SlashCommand,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	const listeners = await Listeners.getByFilter({
		filter: and(
			eq(listenersSchema.event, 'slash_command'),
			eq(listenersSchema.param, payload.command.substring(1)),
			eq(listenersSchema.triggersWorkflowId, workflow.id)
		)
	})
	for (const listener of listeners) {
		await startWorkflow({
			workflowId: workflow.id,
			variables: {
				'trigger.trigger_id': payload.trigger_id,
				'trigger.user': payload.user_id,
				'trigger.channel': payload.channel_id,
				'trigger.data': payload.text,
				'trigger.response_url': payload.response_url
			},
			findTrigger: (step) =>
				listener.data
					? step.id === JSON.parse(listener.data).trigger
					: step.params.TRIGGER === 'SLASH' && step.params.NAME === payload.command.substring(1)
		})
	}
}
