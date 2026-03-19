import { generateStepBlocks } from '$lib/server/utils'
import type { StepExecutionContext } from '..'

export default {
	trigger_respond: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const ephemeral = ctx.params.EPHEMERAL === 'TRUE'
		const editOriginal = ctx.params.EDIT === 'TRUE'

		const blocks = await generateStepBlocks({
			ctx,
			text,
			components: ctx.params.COMPS as WorkflowStep
		})

		const responseUrl = ctx.data.variables['trigger.response_url']
		if (!responseUrl) {
			throw new Error(
				'This trigger cannot be responded to. Currently, only slash commands can be responded to with this block.'
			)
		}

		const resp = await fetch(responseUrl, {
			method: 'POST',
			body: JSON.stringify({
				response_type: ephemeral || editOriginal ? undefined : 'in_channel',
				replace_original: editOriginal,
				text,
				blocks
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		})
		if (!resp.ok) {
			console.error('sending message to response_url failed', await resp.text())
			throw new Error('Failed to respond to trigger')
		}
		return ''
	},
	trigger_user: async (ctx) => {
		if (!ctx.data.variables['trigger.user']) {
			throw new Error('The workflow was not triggered by a user.')
		}
		return ctx.data.variables['trigger.user']
	},
	trigger_message: async (ctx) => {
		if (!ctx.data.variables['trigger.message']) {
			throw new Error('The workflow was not triggered by a message or a message reaction.')
		}
		return ctx.data.variables['trigger.message']
	},
	trigger_trigger_id: async (ctx) => {
		if (!ctx.data.variables['trigger.trigger_id']) {
			throw new Error(
				'The trigger does not have a trigger_id. There will only be a trigger_id if the workflow is started by a button or shortcut in Slack.'
			)
		}
		return ctx.data.variables['trigger.trigger_id']
	},
	trigger_data: async (ctx) => {
		if (!('trigger.data' in ctx.data.variables)) {
			throw new Error('The trigger does not have any data.')
		}
		return ctx.data.variables['trigger.data']
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
