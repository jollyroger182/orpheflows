import { progressWorkflow, type StepExecutionContext } from '..'

export const stepHandlers: Record<string, (context: StepExecutionContext) => unknown> = {
	messaging_send_text: async (ctx) => {
		console.log('ok, send msg to', ctx.params.CHANNEL, 'with text', ctx.params.TEXT)
		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	}
}
