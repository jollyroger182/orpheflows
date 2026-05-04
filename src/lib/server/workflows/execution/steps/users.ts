import { slack } from '$lib/server/slack'
import { isSlackPlatformError } from '$lib/server/utils'
import type { StepExecutionContext } from '..'

export default {
	user_from_id: async (ctx) => ctx.evaluate(ctx.params.ID as WorkflowStep),
	user_to_id: async (ctx) => ctx.evaluate(ctx.params.USER as WorkflowStep),
	user_mention: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		return `<@${user}>`
	},
	user_exists: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		try {
			await slack.users.info({ user, token: await ctx.getToken() })
			return 'true'
		} catch (e) {
			if (isSlackPlatformError(e, 'user_not_found')) {
				return 'false'
			}
			throw e
		}
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
