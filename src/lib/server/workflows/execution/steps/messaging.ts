import { slack } from '$lib/server/slack'
import { generateStepBlocks, isSlackPlatformError } from '$lib/server/utils'
import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	message_from_ts: async (ctx) =>
		JSON.stringify({
			channel: await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep),
			ts: await ctx.evaluate(ctx.params.TS as WorkflowStep)
		}),
	message_to_channel: async (ctx) =>
		JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep)).channel,
	message_to_ts: async (ctx) =>
		JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep)).ts,
	messaging_get_text: async (ctx) => {
		const message = JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep))
		if ('text' in message) return message.text

		const resp = await slack.conversations.replies({
			channel: message.channel,
			ts: message.ts,
			limit: 1,
			token: await ctx.getToken()
		})
		const msg = resp.messages?.[0]
		if (msg?.ts !== message.ts) return ''
		return msg?.text || ''
	},
	messaging_send_v1: async (ctx) => {
		const mode = ctx.params.MODE as 'CHANNEL' | 'THREAD' | 'USER'
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)

		const blocks = await generateStepBlocks({
			ctx,
			text,
			components: ctx.params.COMPS as WorkflowStep
		})

		const location = await ctx.evaluate(ctx.params.LOC as WorkflowStep)
		const { channel, ts: thread_ts } =
			mode === 'CHANNEL' || mode === 'USER' ? { channel: location } : JSON.parse(location)

		const resp = await slack.chat.postMessage({
			channel,
			thread_ts,
			text,
			blocks,
			token: await ctx.getToken()
		})
		return JSON.stringify({ channel, ts: resp.ts! })
	},
	messaging_action_button: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const action_id = await ctx.evaluate(ctx.params.ACTIONID as WorkflowStep)
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		const style = ctx.params.STYLE as string

		return JSON.stringify({ type: 'button', text, action_id, value, style })
	},
	messaging_add_reaction: async (ctx) => {
		const { channel, ts } = JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep))
		const emoji = await ctx.evaluate(ctx.params.EMOJI as WorkflowStep)
		try {
			await slack.reactions.add({
				channel,
				timestamp: ts,
				name: emoji,
				token: await ctx.getToken()
			})
		} catch (e) {
			if (!isSlackPlatformError(e, 'already_reacted')) {
				throw e
			}
		}
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	messaging_unreact: async (ctx) => {
		const { channel, ts } = JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep))
		const emoji = await ctx.evaluate(ctx.params.EMOJI as WorkflowStep)
		try {
			await slack.reactions.remove({
				channel,
				timestamp: ts,
				name: emoji,
				token: await ctx.getToken()
			})
		} catch (e) {
			if (!isSlackPlatformError(e, 'no_reaction')) {
				throw e
			}
		}
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
