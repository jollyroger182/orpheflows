import { slack } from '$lib/server/slack'
import { progressWorkflow, type StepExecutionContext } from '..'
import type { KnownBlock } from '@slack/web-api'

export const stepHandlers: Record<string, (context: StepExecutionContext) => Promise<unknown>> = {
	// statements

	messaging_send_text: async (ctx) => {
		const channel = await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep)
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
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
	messaging_reply: async (ctx) => {
		const thread = await ctx.evaluate(ctx.params.THREAD as WorkflowStep)
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const { channel, ts } = JSON.parse(thread)
		await slack.chat.postMessage({
			channel,
			thread_ts: ts,
			text,
			token: await ctx.getToken()
		})
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	messaging_add_reaction: async (ctx) => {
		const { channel, ts } = JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep))
		const emoji = await ctx.evaluate(ctx.params.EMOJI as WorkflowStep)
		await slack.reactions.add({ channel, timestamp: ts, name: emoji, token: await ctx.getToken() })
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
	ignore_output: async (ctx) => {
		await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
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

	trigger_user: async (ctx) => {
		if (!ctx.data.variables['trigger.user']) {
			throw new Error('The workflow was not triggered by a user.')
		}
		return ctx.data.variables['trigger.user']
	},
	trigger_message: async (ctx) => {
		if (!ctx.data.variables['trigger.message']) {
			throw new Error('The workflow was not triggered by a message or a message reaction.')
		}
		return ctx.data.variables['trigger.message']
	},
	trigger_trigger_id: async (ctx) => {
		if (!ctx.data.variables['trigger.trigger_id']) {
			throw new Error(
				'The trigger does not have a trigger_id. There will only be a trigger_id if the workflow is started by a button or shortcut in Slack.'
			)
		}
		return ctx.data.variables['trigger.trigger_id']
	},

	message_from_ts: async (ctx) =>
		JSON.stringify({
			channel: await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep),
			ts: await ctx.evaluate(ctx.params.TS as WorkflowStep)
		}),
	message_to_channel: async (ctx) =>
		JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep)).channel,
	message_to_ts: async (ctx) =>
		JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep)).ts,

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
	convert_float: async (ctx) => {
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		if (isNaN(parseFloat(value))) {
			throw new Error(`convert_float input is not a valid float: "${value}"`)
		}
		return parseFloat(value).toString()
	},
	convert_int: async (ctx) => {
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		if (isNaN(parseInt(value))) {
			throw new Error(`convert_int input is not a valid int: "${value}"`)
		}
		return parseInt(value).toString()
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

	variables_get: async (ctx) => {
		const name = ctx.params.VAR as string
		const key = `variable.${name}`

		if (!(key in ctx.data.variables)) {
			throw new Error(`Variable ${name} is not set yet`)
		}

		return ctx.data.variables[key]
	}
}
