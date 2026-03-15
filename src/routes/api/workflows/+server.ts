import { convertWorkflowToPublic } from '$lib/server/convert'
import { Workflows } from '$lib/server/services'
import { json } from '@sveltejs/kit'

export async function GET() {
	const flows = await Workflows.getWorkflows()

	return json(flows.map((f) => convertWorkflowToPublic(f)))
}
