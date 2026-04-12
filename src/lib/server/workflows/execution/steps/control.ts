import { FOR_MAX_ITERATIONS } from '$lib/consts'
import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	controls_if: async (ctx) => {
		if (ctx.data.variables[`if.${ctx.data.blockId}.run`] === '1') {
			return progressWorkflow({
				executionId: ctx.executionId,
				continuationToken: ctx.data.continuationToken
			})
		}
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
					updateVariables: { [`if.${ctx.data.blockId}.run`]: '1' },
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
			updateVariables: { [`if.${ctx.data.blockId}.run`]: '1' },
			nextBlockId
		})
	},
	controls_repeat_ext: async (ctx) => {
		const totalKey = `for.${ctx.data.blockId}.total`
		const currentKey = `for.${ctx.data.blockId}.cur`

		const updateVariables: Record<string, string> = {}

		if (!ctx.data.variables[totalKey] || !ctx.data.variables[currentKey]) {
			const total = Math.floor(Number(await ctx.evaluate(ctx.params.TIMES as WorkflowStep)))
			if (isNaN(total)) {
				throw new Error('Argument to for block is not a number')
			}
			if (total > FOR_MAX_ITERATIONS) {
				throw new Error(`For loops cannot iterate more than ${total} times`)
			}
			updateVariables[totalKey] = total.toString()
			updateVariables[currentKey] = '1'
		} else {
			const total = parseInt(ctx.data.variables[totalKey])
			let current = parseInt(ctx.data.variables[currentKey])

			current++
			if (current > total) {
				return progressWorkflow({
					executionId: ctx.executionId,
					continuationToken: ctx.data.continuationToken
				})
			}

			updateVariables[currentKey] = current.toString()
		}

		const connection = ctx.params.DO as WorkflowStep[]
		const nextBlockId = connection[0]?.id
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken,
			updateVariables,
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
	timer_sleep: async (ctx) => {
		const ms = parseFloat(await ctx.evaluate(ctx.params.MS as WorkflowStep))
		if (isNaN(ms)) {
			throw new Error('Argument to sleep block is not a number')
		}
		await new Promise((resolve) => setTimeout(resolve, ms))
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	ignore_output: async (ctx) => {
		await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
