import { slack } from '$lib/server/slack'
import { progressWorkflow, type StepExecutionContext } from '..'
import type { KnownBlock } from '@slack/web-api'

export const stepHandlers: Record<string, (context: StepExecutionContext) => Promise<unknown>> = {
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

	form_present: async (ctx) => {
		const title = await ctx.evaluate(ctx.params.TITLE as WorkflowStep)
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const questions = await ctx.evaluate(ctx.params.QUESTIONS as WorkflowStep)
		const trigger_id = await ctx.evaluate(ctx.params.TRIGGER_ID as WorkflowStep)

		const output = ctx.params.OUTPUT as string
		const trigger_id_output = ctx.params.TRIGGER_OUTPUT as string

		const sectionBlocks: KnownBlock[] = text
			? [{ type: 'section', text: { type: 'mrkdwn', text } }]
			: []

		const questionBlocks: KnownBlock[] = (JSON.parse(questions) as string[]).map((q, i) => ({
			type: 'input',
			block_id: `question_${i}`,
			label: { type: 'plain_text', text: q },
			element: { type: 'plain_text_input', action_id: 'value' }
		}))

		await slack.views.open({
			trigger_id: trigger_id,
			view: {
				type: 'modal',
				callback_id: 'workflow_form_present',
				private_metadata: JSON.stringify({
					questions: questionBlocks.length,
					output,
					trigger_id_output,
					executionId: ctx.executionId,
					continuationToken: ctx.data.continuationToken
				}),
				title: { type: 'plain_text', text: title },
				submit: { type: 'plain_text', text: 'Submit' },
				blocks: [...sectionBlocks, ...questionBlocks]
			},
			token: await ctx.getToken()
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

	variables_set: async (ctx) => {
		const name = ctx.params.VAR as string
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)

		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken,
			updateVariables: { [`variable.${name}`]: value }
		})
	},

	// values

	trigger_user: async (ctx) => ctx.data.variables['trigger.user'],
	trigger_trigger_id: async (ctx) => ctx.data.variables['trigger.trigger_id'],

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
		if (isNaN(idx) || idx >= items.length) {
			throw new Error('Invalid index in list')
		}
		return items[idx]
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

	variables_get: async (ctx) => {
		const name = ctx.params.VAR as string
		const key = `variable.${name}`

		if (!(key in ctx.data.variables)) {
			throw new Error(`Variable ${name} is not set yet`)
		}

		return ctx.data.variables[key]
	}
}
