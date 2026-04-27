import type { StepExecutionContext } from '..'

export default {
	dict_new: async () => '{}',
	dict_from_pairs: async (ctx) => {
		const valuesText = await ctx.evaluate(ctx.params.VALUES as WorkflowStep)

		const valuesArray = JSON.parse(valuesText)
		const result: Record<string, unknown> = {}
		for (const item of valuesArray) {
			const [key, value] = JSON.parse(item)
			result[key] = value
		}

		return JSON.stringify(result)
	},
	dict_from_json: async (ctx) => {
		const json = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)

		return jsonStringToDict(json)
	},
	dict_getkey: async (ctx) => {
		const dictText = await ctx.evaluate(ctx.params.DICT as WorkflowStep)
		const key = await ctx.evaluate(ctx.params.KEY as WorkflowStep)
		const dflt = await ctx.evaluate(ctx.params.DEFAULT as WorkflowStep)

		const dict = JSON.parse(dictText)
		if (key in dict) return dict[key]
		return dflt
	},
	dict_setkey: async (ctx) => {
		const dictText = await ctx.evaluate(ctx.params.DICT as WorkflowStep)
		const key = await ctx.evaluate(ctx.params.KEY as WorkflowStep)
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)

		const dict = JSON.parse(dictText)
		dict[key] = value
		return JSON.stringify(dict)
	},
	dict_deletekey: async (ctx) => {
		const dictText = await ctx.evaluate(ctx.params.DICT as WorkflowStep)
		const key = await ctx.evaluate(ctx.params.KEY as WorkflowStep)

		const dict = JSON.parse(dictText)
		if (key in dict) delete dict[key]
		return JSON.stringify(dict)
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>

function jsonStringToDict(json: string): string {
	return JSON.parse(json, (_, value) => {
		if (value === null) return undefined
		if (typeof value === 'string') return value
		return JSON.stringify(value)
	})
}
