import { Whitelist } from '$lib/server/services'
import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	time_get_sec: async () => {
		return (Date.now() / 1000).toString()
	},
	integration_request: async (ctx) => {
		const method = ctx.params.METHOD as string
		const url = await ctx.evaluate(ctx.params.URL as WorkflowStep)
		const body = method === 'GET' ? null : await ctx.evaluate(ctx.params.BODY as WorkflowStep)
		const headersText = await ctx.evaluate(ctx.params.HEADERS as WorkflowStep)
		const statusOut = ctx.params.STATUS as string
		const responseOut = ctx.params.RESPONSE as string

		const check = await Whitelist.check({ id: ctx.workflowId, url })
		if (!check) {
			throw new Error(
				`This workflow is not permitted to access the domain ${new URL(url).host}. If you are the workflow author, please contact @Jolly on Slack for approval.`
			)
		}

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
	},
	integration_idv: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)

		const url = new URL('https://auth.hackclub.com/api/external/check')
		url.searchParams.set('slack_id', user)
		return await checkIDV(url)
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>

async function checkIDV(url: URL | string): Promise<string> {
	const resp = await fetch(url)

	if (!resp.ok) {
		console.error('idv check', url, 'failed with status code', resp.status, await resp.text())
		throw new Error(`Failed to check IDV: request failed with status code ${resp.status}`)
	}

	const data = await resp.json()

	if (!data.result) {
		console.error('idv check', url, 'returned no data', JSON.stringify(data))
		throw new Error(`Failed to check IDV: upstream server error`)
	}

	return data.result
}
