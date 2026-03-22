import { ID } from '$lib/consts'
import { startWorkflow } from '$lib/server/workflows/execution'
import type { SlackAction } from '@slack/bolt'

export async function handleCoreInteraction(payload: SlackAction) {
	console.log(payload)

	if (payload.type === 'block_actions') {
		const { actions } = payload
		for (const action of actions) {
			if (action.action_id === ID.runWorkflow) {
				if (action.type !== 'button') return
				const { id } = JSON.parse(action.value!) as { id: number }
				await startWorkflow({
					workflowId: id,
					variables: { 'trigger.user': payload.user.id, 'trigger.trigger_id': payload.trigger_id },
					findTrigger: (step) => step.params.TRIGGER === 'MANUAL'
				})
			}
		}
	}
}
