import { ID } from '$lib/consts'
import { listeners as listenersSchema } from '$lib/server/db/schema'
import { Listeners, type Workflows } from '$lib/server/services'
import type { SlackAction, SlackShortcut, ViewSubmitAction } from '@slack/bolt'
import { hash } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { progressWorkflow, startWorkflow } from '../execution'

export async function handleWorkflowInteraction(
	payload: SlackAction | ViewSubmitAction | SlackShortcut,
	workflow: Awaited<ReturnType<typeof Workflows.getWorkflowByVerificationToken>> & {}
) {
	if (payload.type === 'block_actions') {
		const { actions } = payload
		for (const action of actions) {
			if (action.action_id === ID.runWorkflow) {
				const variables: Record<string, string> = {
					'trigger.user': payload.user.id,
					'trigger.trigger_id': payload.trigger_id
				}
				if (payload.channel?.id) {
					variables['trigger.channel'] = payload.channel.id
				}
				await startWorkflow({
					workflowId: workflow.id,
					variables,
					findTrigger: (step) => step.params.TRIGGER === 'MANUAL'
				})
			} else if (!action.action_id.startsWith(ID.ignore)) {
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
						if (payload.channel) {
							variables['trigger.channel'] = payload.channel.id
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
	} else if (payload.type === 'shortcut') {
		// global shortcut
		console.log(payload) // TODO remove me
		const listeners = await Listeners.getByFilter({
			filter: and(
				eq(listenersSchema.event, 'global_shortcut'),
				eq(listenersSchema.param, payload.callback_id),
				eq(listenersSchema.triggersWorkflowId, workflow.id)
			)
		})
		for (const listener of listeners) {
			const variables: Record<string, string> = {
				'trigger.user': payload.user.id,
				'trigger.trigger_id': payload.trigger_id
			}
			await startWorkflow({
				workflowId: workflow.id,
				variables,
				findTrigger: (step) =>
					listener.data
						? step.id === JSON.parse(listener.data).trigger
						: step.params.TRIGGER === 'GLOBAL' &&
							hash('sha1', step.params.NAME as string, 'hex') === payload.callback_id
			})
		}
	} else if (payload.type === 'message_action') {
		// message shortcut
		console.log(payload) // TODO remove me
		const listeners = await Listeners.getByFilter({
			filter: and(
				eq(listenersSchema.event, 'message_shortcut'),
				eq(listenersSchema.param, payload.callback_id),
				eq(listenersSchema.triggersWorkflowId, workflow.id)
			)
		})
		for (const listener of listeners) {
			const variables: Record<string, string> = {
				'trigger.user': payload.user.id,
				'trigger.channel': payload.channel.id,
				'trigger.message': JSON.stringify({
					channel: payload.channel.id,
					ts: payload.message.ts,
					text: payload.message.text
				}),
				'trigger.trigger_id': payload.trigger_id
			}
			await startWorkflow({
				workflowId: workflow.id,
				variables,
				findTrigger: (step) => step.id === JSON.parse(listener.data!).trigger
			})
		}
	}
}
