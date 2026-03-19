import { slack } from '$lib/server/slack'
import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	channel_from_id: async (ctx) => ctx.evaluate(ctx.params.ID as WorkflowStep),
	channel_to_id: async (ctx) => ctx.evaluate(ctx.params.CHANNEL as WorkflowStep),
	channel_create: async (ctx) => {
		const name = await ctx.evaluate(ctx.params.NAME as WorkflowStep)
		const is_private = ctx.params.MODE === 'PRIVATE'

		const resp = await slack.conversations.create({ name, is_private, token: await ctx.getToken() })
		return resp.channel!.id!
	},
	channel_invite: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		const channel = await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep)
		await slack.conversations.invite({ channel, users: user, token: await ctx.getToken() })
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	channel_archive: async (ctx) => {
		const channel = await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep)
		await slack.conversations.archive({ channel, token: await ctx.getToken() })
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
