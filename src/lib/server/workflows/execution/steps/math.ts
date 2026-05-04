import { isPrime } from '$lib/server/utils'
import type { StepExecutionContext } from '..'

export default {
	math_number: async (ctx) => (ctx.params.NUM as number).toString(),
	math_arithmetic: async (ctx) => {
		const lhs = parseFloat(await ctx.evaluate(ctx.params.A as WorkflowStep))
		if (isNaN(lhs)) throw new Error('LHS of math operation is an invalid number')
		const rhs = parseFloat(await ctx.evaluate(ctx.params.B as WorkflowStep))
		if (isNaN(rhs)) throw new Error('RHS of math operation is an invalid number')
		const op = ctx.params.OP as 'ADD' | 'MINUS' | 'MULTIPLY' | 'DIVIDE' | 'POWER'

		switch (op) {
			case 'ADD':
				return (lhs + rhs).toString()
			case 'MINUS':
				return (lhs - rhs).toString()
			case 'MULTIPLY':
				return (lhs * rhs).toString()
			case 'DIVIDE':
				return (lhs / rhs).toString()
			case 'POWER':
				return (lhs ** rhs).toString()
		}
	},
	math_single: async (ctx) => {
		const value = parseFloat(await ctx.evaluate(ctx.params.NUM as WorkflowStep))
		if (isNaN(value)) throw new Error('operand of math operation is an invalid number')
		const op = ctx.params.OP as 'ROOT' | 'ABS' | 'NEG' | 'LN' | 'LOG10' | 'EXP' | 'POW10'

		switch (op) {
			case 'ROOT':
				return Math.sqrt(value).toString()
			case 'ABS':
				return Math.abs(value).toString()
			case 'NEG':
				return (-value).toString()
			case 'LN':
				return Math.log(value).toString()
			case 'LOG10':
				return Math.log10(value).toString()
			case 'EXP':
				return Math.exp(value).toString()
			case 'POW10':
				return (10 ** value).toString()
		}
	},
	math_trig: async (ctx) => {
		const value = parseFloat(await ctx.evaluate(ctx.params.NUM as WorkflowStep))
		if (isNaN(value)) throw new Error('operand of trig operation is an invalid number')
		const op = ctx.params.OP as 'SIN' | 'COS' | 'TAN' | 'ASIN' | 'ACOS' | 'ATAN'

		switch (op) {
			case 'SIN':
				return Math.sin((value * Math.PI) / 180).toString()
			case 'COS':
				return Math.cos((value * Math.PI) / 180).toString()
			case 'TAN':
				return Math.tan((value * Math.PI) / 180).toString()
			case 'ASIN':
				return ((Math.asin(value) * 180) / Math.PI).toString()
			case 'ACOS':
				return ((Math.asin(value) * 180) / Math.PI).toString()
			case 'ATAN':
				return ((Math.asin(value) * 180) / Math.PI).toString()
		}
	},
	math_constant: async (ctx) => {
		const value = ctx.params.CONSTANT as
			| 'PI'
			| 'E'
			| 'GOLDEN_RATIO'
			| 'SQRT2'
			| 'SQRT1_2'
			| 'INFINITY'
		switch (value) {
			case 'PI':
				return Math.PI.toString()
			case 'E':
				return Math.E.toString()
			case 'GOLDEN_RATIO':
				return ((1 + Math.sqrt(5)) / 2).toString()
			case 'SQRT2':
				return Math.SQRT2.toString()
			case 'SQRT1_2':
				return Math.SQRT1_2.toString()
			case 'INFINITY':
				return 'Infinity'
		}
	},
	math_number_property: async (ctx) => {
		const lhs = parseFloat(await ctx.evaluate(ctx.params.NUMBER_TO_CHECK as WorkflowStep))
		if (isNaN(lhs)) throw new Error('LHS of math check is an invalid number')
		const op = ctx.params.OP as
			| 'EVEN'
			| 'ODD'
			| 'PRIME'
			| 'WHOLE'
			| 'POSITIVE'
			| 'NEGATIVE'
			| 'DIVISIBLE_BY'

		let rhs: number
		switch (op) {
			case 'EVEN':
				return lhs % 2 === 0 ? 'true' : 'false'
			case 'ODD':
				return lhs % 2 === 1 ? 'true' : 'false'
			case 'PRIME':
				return lhs % 1 === 0 && isPrime(BigInt(lhs)) ? 'true' : 'false'
			case 'WHOLE':
				return lhs % 1 === 0 ? 'true' : 'false'
			case 'POSITIVE':
				return lhs > 0 ? 'true' : 'false'
			case 'NEGATIVE':
				return lhs < 0 ? 'true' : 'false'
			case 'DIVISIBLE_BY':
				rhs = parseFloat(await ctx.evaluate(ctx.params.DIVISOR as WorkflowStep))
				if (isNaN(rhs)) throw new Error('RHS of math check is an invalid number')
				return lhs % rhs === 0 ? 'true' : 'false'
		}
	},
	math_round: async (ctx) => {
		const op = ctx.params.OP as 'ROUND' | 'ROUNDUP' | 'ROUNDDOWN'
		const value = await ctx.evaluate(ctx.params.NUM as WorkflowStep)
		const num = parseFloat(value)
		if (isNaN(num)) {
			throw new Error(`math_round input is not a valid float: "${value}"`)
		}
		switch (op) {
			case 'ROUND':
				return Math.round(num).toString()
			case 'ROUNDUP':
				return Math.ceil(num).toString()
			case 'ROUNDDOWN':
				return Math.floor(num).toString()
		}
	},
	math_modulo: async (ctx) => {
		const lhs = parseFloat(await ctx.evaluate(ctx.params.DIVIDEND as WorkflowStep))
		if (isNaN(lhs)) throw new Error('LHS of modulo operation is an invalid number')
		const rhs = parseFloat(await ctx.evaluate(ctx.params.DIVISOR as WorkflowStep))
		if (isNaN(rhs)) throw new Error('RHS of modulo operation is an invalid number')

		return (lhs % rhs).toString()
	},
	math_constrain: async (ctx) => {
		const value = parseFloat(await ctx.evaluate(ctx.params.VALUE as WorkflowStep))
		if (isNaN(value)) throw new Error('value of constrain operation is an invalid number')
		const low = parseFloat(await ctx.evaluate(ctx.params.LOW as WorkflowStep))
		if (isNaN(low)) throw new Error('lower bound of constrain operation is an invalid number')
		const high = parseFloat(await ctx.evaluate(ctx.params.HIGH as WorkflowStep))
		if (isNaN(high)) throw new Error('upper bound of constrain operation is an invalid number')

		return Math.min(Math.max(value, low), high).toString()
	},
	math_random_int: async (ctx) => {
		const low = parseFloat(await ctx.evaluate(ctx.params.FROM as WorkflowStep))
		if (isNaN(low)) throw new Error('lower bound of random operation is an invalid number')
		const high = parseFloat(await ctx.evaluate(ctx.params.TO as WorkflowStep))
		if (isNaN(high)) throw new Error('upper bound of random operation is an invalid number')

		const a = Math.ceil(low)
		const b = Math.floor(high) + 1
		return Math.floor(Math.random() * (b - a) + a).toString()
	},
	math_random_float: async () => Math.random().toString(),
	math_atan2: async (ctx) => {
		const x = parseFloat(await ctx.evaluate(ctx.params.X as WorkflowStep))
		if (isNaN(x)) throw new Error('x for atan2 operation is an invalid number')
		const y = parseFloat(await ctx.evaluate(ctx.params.Y as WorkflowStep))
		if (isNaN(y)) throw new Error('x for atan2 operation is an invalid number')

		return Math.atan2((y * Math.PI) / 180, (x * Math.PI) / 180).toString()
	},
	convert_float: async (ctx) => {
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		if (isNaN(parseFloat(value))) {
			throw new Error(`convert_float input is not a valid float: "${value}"`)
		}
		return parseFloat(value).toString()
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
