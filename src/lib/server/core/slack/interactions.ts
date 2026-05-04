import { ID } from '$lib/consts'
import { startWorkflow } from '$lib/server/workflows/execution'
import type { SlackAction } from '@slack/bolt'

export async function handleCoreInteraction(payload: SlackAction) {
	if (payload.type === 'block_actions') {
		const { actions } = payload
		for (const action of actions) {
			if (action.action_id === ID.runWorkflow) {
				if (action.type !== 'button') return
				const { id } = JSON.parse(action.value!) as { id: number }
				const variables: Record<string, string> = {
					'trigger.user': payload.user.id,
					'trigger.trigger_id': payload.trigger_id
				}
				if (payload.channel?.id) {
					variables['trigger.channel'] = payload.channel.id
				}
				await startWorkflow({
					workflowId: id,
					variables,
					findTrigger: (step) => step.params.TRIGGER === 'MANUAL'
				})
			}
		}
	}
}
