import {
	convertVersionToPublic,
	convertVersionToSelf,
	convertWorkflowToPublic,
	convertWorkflowToSelf
} from '$lib/server/convert.js'
import type { workflows } from '$lib/server/db/schema.js'
import { authorize } from '$lib/server/middleware.js'
import { Users, Workflows } from '$lib/server/services'
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
			version = isAuthor
				? convertVersionToSelf(ver)
				: convertVersionToPublic(ver, workflow.isPublic)
		}
	}

	const result = {
		...(isAuthor ? convertWorkflowToSelf(workflow) : convertWorkflowToPublic(workflow)),
		version
	}

	return json(result)
}

const UpdateSchema = z
	.union([
		z.object({
			name: z.string().nonempty().max(36),
			description: z.string().nonempty().max(200)
		}),
		z.object({
			name: z.undefined(),
			description: z.undefined()
		})
	])
	.and(
		z.union([
			z.object({
				blocks: z.string().optional(),
				code: z.string()
			}),
			z.object({
				blocks: z.undefined(),
				code: z.undefined()
			})
		])
	)

export async function PATCH({ params, locals, request }) {
	const userId = await authorize({ locals, request })

	const id = Number(params.id)
	if (!Number.isInteger(id)) return error(404)

	const result = UpdateSchema.safeParse(await request.json())
	if (!result.success) return error(400, z.prettifyError(result.error))
	const data = result.data

	if (!data.name && !data.code) return error(400, 'No fields to update provided')

	let workflow: typeof workflows.$inferSelect | undefined
	if (data.name) {
		workflow = await Workflows.setDetails({
			id,
			name: data.name,
			description: data.description,
			userId
		})
		if (!workflow) return error(403, 'You cannot edit this workflow')
	}
	if (data.code) {
		workflow = await Workflows.setCode({ id, blocks: data.blocks, code: data.code, userId })
		if (!workflow) return error(403, 'You cannot edit this workflow')
	}

	const author = (await Users.get({ id: userId }))!

	return json(convertWorkflowToSelf({ ...workflow!, author }))
}
