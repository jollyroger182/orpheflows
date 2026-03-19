import {
	convertVersionToPublic,
	convertVersionToSelf,
	convertWorkflowToPublic,
	convertWorkflowToSelf
} from '$lib/server/convert.js'
import { authorize } from '$lib/server/middleware.js'
import { Workflows } from '$lib/server/services'
import { error, json } from '@sveltejs/kit'
import z from 'zod'

const QuerySchema = z.object({
	with: z.literal('version').nullable()
})

export async function GET({ url, params, locals, request }) {
	const userId = await authorize({ locals, request }, false)

	const id = Number(params.id)
	if (!Number.isInteger(id)) return error(404)

	const query = QuerySchema.safeParse({ with: url.searchParams.get('with') })
	if (!query.success) return error(400, z.prettifyError(query.error))
	const { with: include } = query.data

	const workflow = await Workflows.getWorkflow({ id })
	if (!workflow) return error(404)

	const isAuthor = workflow.authorId === userId

	let version: object | undefined = undefined
	if (include === 'version') {
		const ver = await Workflows.getLatestVersion({ id })
		if (ver) {
			version = isAuthor ? convertVersionToSelf(ver) : convertVersionToPublic(ver)
		}
	}

	const result = {
		...(isAuthor ? convertWorkflowToSelf(workflow) : convertWorkflowToPublic(workflow)),
		version
	}

	return json(result)
}
