import { Variables } from '$lib/server/services'
import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	pvar_get: async (ctx) => {
		const name = ctx.params.NAME as string
		const dflt = await ctx.evaluate(ctx.params.DEFAULT as WorkflowStep)

		const variable = await Variables.get({ workflowId: ctx.workflowId, name })
		if (!variable) return dflt
		return variable.value
	},
	// pvar_get_keyed: async (ctx) => {},
	pvar_set: async (ctx) => {
		const name = ctx.params.NAME as string
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)

		await Variables.set({ workflowId: ctx.workflowId, name, value })
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	// pvar_set_keyed: async (ctx) => {},
	pvar_delete: async (ctx) => {
		const name = ctx.params.NAME as string

		await Variables.deleteVariable({ workflowId: ctx.workflowId, name })
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	}
	// pvar_delete_keyed: async (ctx) => {}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
