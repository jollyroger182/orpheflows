import type { StepExecutionContext } from '..'

export default {
	text: async (ctx) => ctx.params.TEXT as string,
	text_join: async (ctx) => {
		let text = ''
		for (let i = 0; ; i++) {
			const value = ctx.params[`ADD${i}`]
			if (value === undefined) break
			if (!value) continue
			text += await ctx.evaluate(value as WorkflowStep)
		}
		return text
	},
	text_length2: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		return text.length.toString()
	},
	text_indexOf: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		const substring = await ctx.evaluate(ctx.params.FIND as WorkflowStep)
		const mode = ctx.params.END as 'FIRST' | 'LAST'
		return (
			(mode === 'FIRST' ? text.indexOf(substring) : text.lastIndexOf(substring)) + 1
		).toString()
	},
	text_charAt: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		const loc = ctx.params.WHERE as 'FROM_START' | 'FROM_END' | 'FIRST' | 'LAST' | 'RANDOM'

		switch (loc) {
			case 'FIRST':
				return text.charAt(0)
			case 'LAST':
				return text.charAt(text.length - 1)
			case 'RANDOM':
				return text.charAt(Math.floor(Math.random() * text.length))
		}

		const index = parseFloat(await ctx.evaluate(ctx.params.AT as WorkflowStep))
		if (isNaN(index)) throw new Error('index in text is an invalid number')

		switch (loc) {
			case 'FROM_START':
				return text.charAt(index - 1)
			case 'FROM_END':
				return text.slice(-index).charAt(0)
		}
	},
	text_getSubstring: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.STRING as WorkflowStep)
		const startMode = ctx.params.WHERE1 as 'FROM_START' | 'FROM_END' | 'FIRST'
		const endMode = ctx.params.WHERE2 as 'FROM_START' | 'FROM_END' | 'LAST'

		let startIndex = 0
		if (startMode !== 'FIRST') {
			const start = parseFloat(await ctx.evaluate(ctx.params.AT1 as WorkflowStep))
			if (isNaN(start)) throw new Error('start index in substring is an invalid number')
			startIndex = startMode === 'FROM_START' ? start - 1 : text.length - start
		}
		let endIndex = text.length
		if (endMode !== 'LAST') {
			const end = parseFloat(await ctx.evaluate(ctx.params.AT2 as WorkflowStep))
			if (isNaN(end)) throw new Error('end index in substring is an invalid number')
			endIndex = endMode === 'FROM_START' ? end : text.length - end + 1
		}

		return text.slice(startIndex, endIndex)
	},
	text_changeCase: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const mode = ctx.params.CASE as 'UPPERCASE' | 'LOWERCASE' | 'TITLECASE'

		switch (mode) {
			case 'UPPERCASE':
				return text.toUpperCase()
			case 'LOWERCASE':
				return text.toLowerCase()
			case 'TITLECASE':
				return text.replace(
					/\w\S*/g,
					(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
				)
		}
	},
	text_trim: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const mode = ctx.params.CASE as 'BOTH' | 'LEFT' | 'RIGHT'

		switch (mode) {
			case 'BOTH':
				return text.trim()
			case 'LEFT':
				return text.trimStart()
			case 'RIGHT':
				return text.trimEnd()
		}
	},
	text_count: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const substring = await ctx.evaluate(ctx.params.SUB as WorkflowStep)

		return substring ? text.split(substring).length - 1 : '0'
	},
	text_replace: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const find = await ctx.evaluate(ctx.params.FROM as WorkflowStep)
		const repl = await ctx.evaluate(ctx.params.TO as WorkflowStep)

		return text.replaceAll(find, repl)
	},
	text_reverse: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		return text.split('').reverse().join('')
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
