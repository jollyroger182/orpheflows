import { slack } from '$lib/server/slack'
import { progressWorkflow, type StepExecutionContext } from '..'
import { type KnownBlock, type ActionsBlockElement } from '@slack/web-api'
import { isPrime, isSlackPlatformError } from '$lib/server/utils'

export const stepHandlers: Record<string, (context: StepExecutionContext) => Promise<unknown>> = {
	// trigger

	trigger_respond: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const ephemeral = ctx.params.EPHEMERAL === 'TRUE'
		const editOriginal = ctx.params.EDIT === 'TRUE'

		const blocks = await generateBlocks({ ctx, text, components: ctx.params.COMPS as WorkflowStep })

		const responseUrl = ctx.data.variables['trigger.response_url']
		if (!responseUrl) {
			throw new Error(
				'This trigger cannot be responded to. Currently, only slash commands can be responded to with this block.'
			)
		}

		const resp = await fetch(responseUrl, {
			method: 'POST',
			body: JSON.stringify({
				response_type: ephemeral || editOriginal ? undefined : 'in_channel',
				replace_original: editOriginal,
				text,
				blocks
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		})
		if (!resp.ok) {
			console.error('sending message to response_url failed', await resp.text())
			throw new Error('Failed to respond to trigger')
		}
		return ''
	},
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
	trigger_data: async (ctx) => {
		if (!('trigger.data' in ctx.data.variables)) {
			throw new Error('The trigger does not have any data.')
		}
		return ctx.data.variables['trigger.data']
	},

	// messaging

	message_from_ts: async (ctx) =>
		JSON.stringify({
			channel: await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep),
			ts: await ctx.evaluate(ctx.params.TS as WorkflowStep)
		}),
	message_to_channel: async (ctx) =>
		JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep)).channel,
	message_to_ts: async (ctx) =>
		JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep)).ts,
	messaging_get_text: async (ctx) => {
		const message = JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep))
		if ('text' in message) return message.text

		const resp = await slack.conversations.replies({
			channel: message.channel,
			ts: message.ts,
			limit: 1,
			token: await ctx.getToken()
		})
		const msg = resp.messages?.[0]
		if (msg?.ts !== message.ts) return ''
		return msg?.text || ''
	},
	messaging_send_v1: async (ctx) => {
		const mode = ctx.params.MODE as 'CHANNEL' | 'THREAD' | 'USER'
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)

		const blocks = await generateBlocks({ ctx, text, components: ctx.params.COMPS as WorkflowStep })

		const location = await ctx.evaluate(ctx.params.LOC as WorkflowStep)
		const { channel, ts: thread_ts } =
			mode === 'CHANNEL' || mode === 'USER' ? { channel: location } : JSON.parse(location)

		const resp = await slack.chat.postMessage({
			channel,
			thread_ts,
			text,
			blocks,
			token: await ctx.getToken()
		})
		return JSON.stringify({ channel, ts: resp.ts! })
	},
	messaging_action_button: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const action_id = await ctx.evaluate(ctx.params.ACTIONID as WorkflowStep)
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)
		const style = ctx.params.STYLE as string

		return JSON.stringify({ type: 'button', text, action_id, value, style })
	},
	messaging_add_reaction: async (ctx) => {
		const { channel, ts } = JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep))
		const emoji = await ctx.evaluate(ctx.params.EMOJI as WorkflowStep)
		try {
			await slack.reactions.add({
				channel,
				timestamp: ts,
				name: emoji,
				token: await ctx.getToken()
			})
		} catch (e) {
			if (!isSlackPlatformError(e, 'already_reacted')) {
				throw e
			}
		}
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	messaging_unreact: async (ctx) => {
		const { channel, ts } = JSON.parse(await ctx.evaluate(ctx.params.MESSAGE as WorkflowStep))
		const emoji = await ctx.evaluate(ctx.params.EMOJI as WorkflowStep)
		try {
			await slack.reactions.remove({
				channel,
				timestamp: ts,
				name: emoji,
				token: await ctx.getToken()
			})
		} catch (e) {
			if (!isSlackPlatformError(e, 'no_reaction')) {
				throw e
			}
		}
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},

	// form

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

	// channels

	channel_from_id: async (ctx) => ctx.evaluate(ctx.params.ID as WorkflowStep),
	channel_to_id: async (ctx) => ctx.evaluate(ctx.params.CHANNEL as WorkflowStep),
	channel_create: async (ctx) => {
		const name = await ctx.evaluate(ctx.params.NAME as WorkflowStep)
		const is_private = ctx.params.MODE === 'PRIVATE'

		const resp = await slack.conversations.create({ name, is_private, token: await ctx.getToken() })
		return resp.channel!.id!
	},
	channel_invite: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		const channel = await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep)
		await slack.conversations.invite({ channel, users: user, token: await ctx.getToken() })
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	channel_archive: async (ctx) => {
		const channel = await ctx.evaluate(ctx.params.CHANNEL as WorkflowStep)
		await slack.conversations.archive({ channel, token: await ctx.getToken() })
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},

	// users

	user_from_id: async (ctx) => ctx.evaluate(ctx.params.ID as WorkflowStep),
	user_to_id: async (ctx) => ctx.evaluate(ctx.params.USER as WorkflowStep),

	// ---------

	// logic

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
	},

	// math

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
		const value = parseFloat(await ctx.evaluate(ctx.params.A as WorkflowStep))
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
		const value = parseFloat(await ctx.evaluate(ctx.params.A as WorkflowStep))
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
		return (Math.random() * (b - a) + a).toString()
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
	},

	// text

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
	text_indexOf2: async (ctx) => {
		const text = await ctx.evaluate(ctx.params.TEXT as WorkflowStep)
		const substring = await ctx.evaluate(ctx.params.SUB as WorkflowStep)
		return text.indexOf(substring).toString()
	},

	// lists

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

	// variables

	variables_set: async (ctx) => {
		const name = ctx.params.VAR as string
		const value = await ctx.evaluate(ctx.params.VALUE as WorkflowStep)

		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken,
			updateVariables: { [`variable.${name}`]: value }
		})
	},
	variables_get: async (ctx) => {
		const name = ctx.params.VAR as string
		const key = `variable.${name}`

		if (!(key in ctx.data.variables)) {
			throw new Error(`Variable ${name} is not set yet`)
		}

		return ctx.data.variables[key]
	},

	// legacy

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

	// hidden

	text_embed: async (ctx) => ctx.params.TEXT as string
}

async function generateBlocks({
	ctx,
	text,
	components: componentsStep
}: {
	ctx: StepExecutionContext
	text: string
	components: WorkflowStep
}): Promise<KnownBlock[]> {
	const components = JSON.parse(await ctx.evaluate(componentsStep as WorkflowStep)) as string[]

	const actionBlocks: KnownBlock[] = []
	if (components.length) {
		const actions: ActionsBlockElement[] = []
		for (const def of components) {
			const action = JSON.parse(def)
			if (action.type === 'button') {
				const style = action.style === 'NORMAL' ? undefined : action.style.toLowerCase()
				actions.push({
					type: 'button',
					text: { type: 'plain_text', text: action.text, emoji: true },
					action_id: action.action_id,
					value: action.value || undefined,
					style
				})
			}
		}
		actionBlocks.push({ type: 'actions', elements: actions })
	}

	return [{ type: 'section', text: { type: 'mrkdwn', text } }, ...actionBlocks]
}
