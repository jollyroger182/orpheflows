import type { Workflows } from '$lib/server/services'
import type { SlackAction } from '@slack/bolt'
import { startWorkflow } from '../execution'

export async function handleWorkflowInteraction(
	payload: SlackAction,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	if (payload.type === 'block_actions') {
		const { actions } = payload
		for (const action of actions) {
			if (action.action_id === 'run_workflow') {
				await startWorkflow({
					workflowId: workflow.id,
					variables: { 'trigger.user': payload.user.id }
				})
			}
		}
	}
}
