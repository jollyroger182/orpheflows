import type { StepExecutionContext } from '..'

export default {
	user_from_id: async (ctx) => ctx.evaluate(ctx.params.ID as WorkflowStep),
	user_to_id: async (ctx) => ctx.evaluate(ctx.params.USER as WorkflowStep),
	user_mention: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		return `<@${user}>`
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
