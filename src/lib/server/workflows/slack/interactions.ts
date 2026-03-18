import { Listeners, type Workflows } from '$lib/server/services'
import type { SlackAction, ViewSubmitAction } from '@slack/bolt'
import { progressWorkflow, startWorkflow } from '../execution'
import { ID } from '$lib/consts'
import { and, eq } from 'drizzle-orm'
import { listeners as listenersSchema } from '$lib/server/db/schema'

export async function handleWorkflowInteraction(
	payload: SlackAction | ViewSubmitAction,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	if (payload.type === 'block_actions') {
		const { actions } = payload
		for (const action of actions) {
			if (action.action_id === ID.runWorkflow) {
				await startWorkflow({
					workflowId: workflow.id,
					variables: { 'trigger.user': payload.user.id, 'trigger.trigger_id': payload.trigger_id },
					findTrigger: (step) => step.params.TRIGGER === 'MANUAL'
				})
			} else {
				if (action.type === 'button') {
					const listeners = await Listeners.getByFilter({
						filter: and(
							eq(listenersSchema.event, 'button_pressed'),
							eq(listenersSchema.param, action.action_id),
							eq(listenersSchema.triggersWorkflowId, workflow.id)
						)
					})
					for (const listener of listeners) {
						const variables: Record<string, string> = {
							'trigger.user': payload.user.id,
							'trigger.trigger_id': payload.trigger_id,
							'trigger.data': action.value || '',
							'trigger.response_url': payload.response_url
						}
						if (payload.channel && payload.message) {
							variables['trigger.message'] = JSON.stringify({
								channel: payload.channel.id,
								ts: payload.message.ts
							})
						}
						await startWorkflow({
							workflowId: workflow.id,
							variables,
							findTrigger: (step) =>
								listener.data
									? step.id === JSON.parse(listener.data).trigger
									: step.params.TRIGGER === 'BUTTON' && step.params.ACTIONID === action.action_id
						})
					}
				}
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
