import type { StepExecutionContext } from '..'

export default {
	lists_create_with: async (ctx) => {
		const list: string[] = []
		for (let i = 0; ; i++) {
			const value = ctx.params[`ADD${i}`]
			if (value === undefined) break
			list.push(await ctx.evaluate(value as WorkflowStep))
		}
		return JSON.stringify(list)
	},
	lists_custom_getindex: async (ctx) => {
		const list = await ctx.evaluate(ctx.params.LIST as WorkflowStep)
		const index = await ctx.evaluate(ctx.params.INDEX as WorkflowStep)

		const items = JSON.parse(list) as string[]
		const idx = parseInt(index)
		if (isNaN(idx) || idx <= 0 || idx > items.length) {
			throw new Error('Invalid index in list')
		}
		return items[idx - 1]
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
