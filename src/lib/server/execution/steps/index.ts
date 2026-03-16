import { slack } from '$lib/server/slack'
import { progressWorkflow, type StepExecutionContext } from '..'

export const stepHandlers: Record<string, (context: StepExecutionContext) => unknown> = {
	// statements

	messaging_send_text: async (ctx) => {
		const channel = await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep)
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		// console.log('ok, send msg to', channel, 'with text', text)
		await slack.chat.postMessage({
			channel,
			text,
			token: await ctx.getToken()
		})
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},

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

	// values

	trigger_user: async (ctx) => ctx.data.variables['trigger.user'],

	channel_from_id: async (ctx) => ctx.evaluate(ctx.params.ID as WorkflowStep),

	user_from_id: async (ctx) => ctx.evaluate(ctx.params.ID as WorkflowStep),
	user_to_id: async (ctx) => ctx.evaluate(ctx.params.USER as WorkflowStep),

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
	logic_boolean: async (ctx) => (ctx.params.BOOL === 'TRUE' ? 'true' : 'false'),
	math_number: async (ctx) => (ctx.params.NUM as number).toString(),
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
	}
}
