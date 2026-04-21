import { RPCSession } from '$lib/server/rpc/index.js'
import { newHttpBatchRpcResponse } from 'capnweb'

export async function POST({ request }) {
	return await newHttpBatchRpcResponse(request, new RPCSession())
}
