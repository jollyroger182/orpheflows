import { SLACK_BOT_TOKEN } from '$env/static/private'
import { Workflows } from '$lib/server/services'
import { slack } from '$lib/server/slack'
import { generateWorkflowBlocks } from '$lib/server/workflows/slack/blocks'
import type { LinkUnfurls } from '@slack/web-api'

export async function handleCoreEvent(payload: Slack.EventCallback) {
	const { event } = payload
	console.log(event)

	if (event.type === 'link_shared') {
		const unfurls: LinkUnfurls = {}

		for (const link of event.links) {
			const { pathname } = new URL(link.url)
			let match: RegExpMatchArray | null
			if ((match = pathname.match(/^\/workflows\/([1-9][0-9]*)\/?$/))) {
				const workflowId = parseInt(match[1]!)
				const workflow = await Workflows.getWorkflow({ id: workflowId })
				if (workflow) {
					unfurls[link.url] = {
						preview: { title: { type: 'plain_text', text: workflow.name } },
						blocks: await generateWorkflowBlocks(workflow, { view: true, edit: false })
					}
				}
			}
		}

		console.log(JSON.stringify(unfurls, null, 2))

		await slack.chat.unfurl({
			channel: event.channel,
			ts: event.message_ts,
			unfurls,
			token: SLACK_BOT_TOKEN
		})
	}
}
