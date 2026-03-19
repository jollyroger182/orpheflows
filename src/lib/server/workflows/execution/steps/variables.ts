import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	variables_set: async (ctx) => {
		const name = ctx.params.VAR as string
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)

		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken,
			updateVariables: { [`variable.${name}`]: value }
		})
	},
	variables_get: async (ctx) => {
		const name = ctx.params.VAR as string
		const key = `variable.${name}`

		if (!(key in ctx.data.variables)) {
			throw new Error(`Variable ${name} is not set yet`)
		}

		return ctx.data.variables[key]
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
