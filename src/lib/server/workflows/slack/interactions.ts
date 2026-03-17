import type { Workflows } from '$lib/server/services'
import type { SlackAction, ViewSubmitAction } from '@slack/bolt'
import { progressWorkflow, startWorkflow } from '../execution'

export async function handleWorkflowInteraction(
	payload: SlackAction | ViewSubmitAction,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	if (payload.type === 'block_actions') {
		const { actions } = payload
		for (const action of actions) {
			if (action.action_id === 'run_workflow') {
				await startWorkflow({
					workflowId: workflow.id,
					variables: { 'trigger.user': payload.user.id, 'trigger.trigger_id': payload.trigger_id },
					findTrigger: (step) => step.params.TRIGGER === 'MANUAL'
				})
			}
		}
	} else if (payload.type === 'view_submission') {
		if (payload.view.callback_id === 'workflow_form_present') {
			const { questions, output, trigger_id_output, executionId, continuationToken } = JSON.parse(
				payload.view.private_metadata
			) as {
				questions: number
				output: string
				trigger_id_output: string
				executionId: number
				continuationToken: string
			}
			const responses = []
			for (let i = 0; i < questions; i++) {
				const value = payload.view.state.values[`question_${i}`]['value'].value!
				responses.push(value)
			}
			await progressWorkflow({
				executionId,
				continuationToken,
				updateVariables: {
					[`variable.${output}`]: JSON.stringify(responses),
					[`variable.${trigger_id_output}`]: payload.trigger_id
				}
			})
		}
	}
}
