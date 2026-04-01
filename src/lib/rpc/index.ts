import { convertWorkflowToPublic } from '$lib/server/convert'
import { Workflows } from '$lib/server/services'
import { RpcTarget } from 'capnweb'

export class RPCSession extends RpcTarget implements RPC.PublicAPI {
	async getWorkflow(id: number) {
		const workflow = await Workflows.getWorkflow({ id })
		if (workflow) return convertWorkflowToPublic(workflow)
	}
}
