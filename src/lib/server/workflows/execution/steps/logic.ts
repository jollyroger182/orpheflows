import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	controls_if: async (ctx) => {
		for (let i = 0; ; i++) {
			if (!(`IF${i}` in ctx.params)) break
			const value = ctx.params[`IF${i}`]
			if (!value) continue
			const test = await ctx.evaluate(value as WorkflowStep)
			if (test !== 'false' && test) {
				const connection = ctx.params[`DO${i}`] as WorkflowStep[]
				const nextBlockId = connection[0]?.id
				await progressWorkflow({
					executionId: ctx.executionId,
					continuationToken: ctx.data.continuationToken,
					nextBlockId
				})
				return
			}
		}
		const connection = (ctx.params.ELSE || []) as WorkflowStep[]
		const nextBlockId = connection[0]?.id
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken,
			nextBlockId
		})
	},
	logic_compare: async (ctx) => {
		const lhs = await ctx.evaluate(ctx.params.A as WorkflowStep)
		const rhs = await ctx.evaluate(ctx.params.B as WorkflowStep)

		switch (ctx.params.OP as string) {
			case 'EQ':
				return lhs === rhs ? 'true' : 'false'
			case 'NEQ':
				return lhs !== rhs ? 'true' : 'false'
			case 'LT':
				return lhs < rhs ? 'true' : 'false'
			case 'LTE':
				return lhs <= rhs ? 'true' : 'false'
			case 'GT':
				return lhs > rhs ? 'true' : 'false'
			case 'GTE':
				return lhs >= rhs ? 'true' : 'false'
			default:
				throw new Error(`Unknown comparison operator ${ctx.params.OP}`)
		}
	},
	logic_operation: async (ctx) => {
		const lhs = await ctx.evaluate(ctx.params.A as WorkflowStep)
		const rhs = await ctx.evaluate(ctx.params.B as WorkflowStep)
		const op = ctx.params.OP as 'AND' | 'OR'

		return (op === 'AND' ? lhs !== 'false' && rhs !== 'false' : lhs !== 'false' || rhs !== 'false')
			? 'true'
			: 'false'
	},
	logic_negate: async (ctx) => {
		const value = await ctx.evaluate(ctx.params.BOOL as WorkflowStep)
		return value === 'true' ? 'false' : 'true'
	},
	logic_boolean: async (ctx) => (ctx.params.BOOL === 'TRUE' ? 'true' : 'false'),
	logic_ternary: async (ctx) => {
		const test = await ctx.evaluate(ctx.params.IF as WorkflowStep)
		const iftrue = await ctx.evaluate(ctx.params.THEN as WorkflowStep)
		const iffalse = await ctx.evaluate(ctx.params.ELSE as WorkflowStep)
		return test !== 'false' ? iftrue : iffalse
	},
	ignore_output: async (ctx) => {
		await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
