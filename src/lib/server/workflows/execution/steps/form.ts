import { slack } from '$lib/server/slack'
import { type KnownBlock } from '@slack/web-api'
import type { StepExecutionContext } from '..'

export default {
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
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
