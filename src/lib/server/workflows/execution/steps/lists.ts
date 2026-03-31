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
	},
	lists_repeat: async (ctx) => {
		const item = await ctx.evaluate(ctx.params.ITEM as WorkflowStep)
		const num = await ctx.evaluate(ctx.params.NUM as WorkflowStep)

		const repeat = parseInt(num)
		if (isNaN(repeat) || repeat < 0) throw new Error('Invalid repeat count')
		const json = JSON.stringify(item)
		return (
			'[' +
			Array.from({ length: repeat })
				.map(() => json)
				.join(',') +
			']'
		)
	},
	lists_length: async (ctx) => {
		const item = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		return JSON.parse(item).length.toString()
	},
	lists_isEmpty: async (ctx) => {
		const item = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		return JSON.parse(item).length === 0 ? 'true' : 'false'
	},
	lists_indexOf: async (ctx) => {
		const list = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		const find = await ctx.evaluate(ctx.params.FIND as WorkflowStep)
		const end = ctx.params.END as 'FIRST' | 'LAST'

		const array = JSON.parse(list) as string[]
		return ((end === 'FIRST' ? array.indexOf(find) : array.lastIndexOf(find)) + 1).toString()
	},
	lists_setIndex2: async (ctx) => {
		const list = await ctx.evaluate(ctx.params.LIST as WorkflowStep)
		const index = await ctx.evaluate(ctx.params.INDEX as WorkflowStep)
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)

		const array = JSON.parse(list) as string[]
		const idx = parseInt(index)
		if (isNaN(idx) || idx <= 0 || idx > array.length) {
			throw new Error('Invalid index in list to set item')
		}

		array[idx] = value
		return JSON.stringify(array)
	},
	lists_getSublist: async (ctx) => {
		const list = await ctx.evaluate(ctx.params.LIST as WorkflowStep)
		const startMode = ctx.params.WHERE1 as 'FROM_START' | 'FROM_END' | 'FIRST'
		const endMode = ctx.params.WHERE2 as 'FROM_START' | 'FROM_END' | 'LAST'

		const array = JSON.parse(list) as string[]

		let startIndex = 0
		if (startMode !== 'FIRST') {
			const start = parseFloat(await ctx.evaluate(ctx.params.AT1 as WorkflowStep))
			if (isNaN(start)) throw new Error('start index in substring is an invalid number')
			startIndex = startMode === 'FROM_START' ? start - 1 : array.length - start
		}
		let endIndex = array.length
		if (endMode !== 'LAST') {
			const end = parseFloat(await ctx.evaluate(ctx.params.AT2 as WorkflowStep))
			if (isNaN(end)) throw new Error('end index in substring is an invalid number')
			endIndex = endMode === 'FROM_START' ? end : array.length - end + 1
		}

		return JSON.stringify(array.slice(startIndex, endIndex))
	},
	lists_split: async (ctx) => {
		const input = await ctx.evaluate(ctx.params.INPUT as WorkflowStep)
		const delim = await ctx.evaluate(ctx.params.DELIM as WorkflowStep)
		const mode = ctx.params.MODE as 'SPLIT' | 'JOIN'

		if (mode === 'SPLIT') {
			const array = input.split(delim)
			return JSON.stringify(array)
		} else {
			const array = JSON.parse(input) as string[]
			return array.join(delim)
		}
	},
	lists_sort: async (ctx) => {
		const list = await ctx.evaluate(ctx.params.LIST as WorkflowStep)
		const type = ctx.params.TYPE as 'NUMERIC' | 'TEXT' | 'IGNORE_CASE'
		const dir = parseInt(ctx.params.DIRECTION as '1' | '-1') // 1 is ascending

		const comparators: Record<typeof type, (a: string, b: string) => number> = {
			NUMERIC: (a, b) => Number(a) - Number(b),
			TEXT: (a, b) => (a > b ? 1 : -1),
			IGNORE_CASE: (a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1)
		}

		const array = JSON.parse(list) as string[]
		array.sort((a, b) => comparators[type](a, b) * dir)
		return JSON.stringify(array)
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
