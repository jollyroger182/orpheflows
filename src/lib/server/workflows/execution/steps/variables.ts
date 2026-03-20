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
			throw new Error(`Variable is not set yet`)
		}

		return ctx.data.variables[key]
	},
	math_change: async (ctx) => {
		const name = ctx.params.VAR as string
		const delta = parseFloat(await ctx.evaluate(ctx.params.DELTA as WorkflowStep))

		if (isNaN(delta)) throw new Error('Value to change is not a number')

		const key = `variable.${name}`
		if (!(key in ctx.data.variables)) {
			throw new Error(`Variable ${name} is not set yet`)
		}

		const num = parseFloat(ctx.data.variables[key])
		if (isNaN(num)) throw new Error(`Variable is not a number`)

		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken,
			updateVariables: { [key]: (num + delta).toString() }
		})
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
