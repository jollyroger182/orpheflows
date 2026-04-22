import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	integration_request: async (ctx) => {
		const method = ctx.params.METHOD as string
		const url = await ctx.evaluate(ctx.params.URL as WorkflowStep)
		const body = method === 'GET' ? null : await ctx.evaluate(ctx.params.BODY as WorkflowStep)
		const headersText = await ctx.evaluate(ctx.params.HEADERS as WorkflowStep)
		const statusOut = ctx.params.STATUS as string
		const responseOut = ctx.params.RESPONSE as string

		const headers = new Headers()
		const headersArray = JSON.parse(headersText)
		for (const header of headersArray) {
			const [key, value] = JSON.parse(header)
			headers.set(key, value)
		}

		const resp = await fetch(url, { method, body, headers })
		const respBody = await resp.text()

		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken,
			updateVariables: {
				[`variable.${statusOut}`]: resp.status.toString(),
				[`variable.${responseOut}`]: respBody
			}
		})
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
