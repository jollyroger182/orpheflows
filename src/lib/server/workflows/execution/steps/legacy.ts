import { slack } from '$lib/server/slack'
import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	text_indexOf2: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const substring = await ctx.evaluate(ctx.params.SUB as WorkflowStep)
		return (text.indexOf(substring) + 1).toString()
	},
	messaging_send_text: async (ctx) => {
		const channel = await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep)
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		await slack.chat.postMessage({
			channel,
			text,
			token: await ctx.getToken()
		})
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	messaging_reply: async (ctx) => {
		const thread = await ctx.evaluate(ctx.params.THREAD as WorkflowStep)
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const { channel, ts } = JSON.parse(thread)
		await slack.chat.postMessage({
			channel,
			thread_ts: ts,
			text,
			token: await ctx.getToken()
		})
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	text_embed: async (ctx) => ctx.params.TEXT as string
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
