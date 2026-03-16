export async function handleCoreEvent(payload: Slack.EventCallback) {
	const { event } = payload
	console.log(event)
}
