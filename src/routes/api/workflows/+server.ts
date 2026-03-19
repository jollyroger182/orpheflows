import { convertWorkflowToPublic } from '$lib/server/convert'
import { authorize } from '$lib/server/middleware.js'
import { Slack, Users, Workflows } from '$lib/server/services'
import { error, json } from '@sveltejs/kit'
import z from 'zod'

const QuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(0).max(100).default(25)
})

export async function GET({ url }) {
	const query = QuerySchema.safeParse({
		page: url.searchParams.get('page'),
		limit: url.searchParams.get('limit')
	})
	if (!query.success) return error(400, z.prettifyError(query.error))
	const { page, limit } = query.data

	const offset = (page - 1) * limit

	const flows = await Workflows.getWorkflows({ offset, limit })

	return json(flows.map((f) => convertWorkflowToPublic(f)))
}

const PostSchema = z.object({
	name: z.string().nonempty().max(36),
	description: z.string().nonempty().max(200)
})

export async function POST({ request, locals }) {
	const slackId = await authorize({ locals, request })

	const result = PostSchema.safeParse(await request.json())
	if (!result.success) return error(400, z.prettifyError(result.error))
	const { name, description } = result.data

	const app = await Slack.createApp({ name })

	const workflow = await Workflows.createWorkflow({
		author: slackId,
		name,
		description,
		appId: app.appId,
		clientId: app.clientId,
		clientSecret: app.clientSecret,
		verificationToken: app.verificationToken,
		signingSecret: app.signingSecret,
		source: 'api'
	})
	const author = (await Users.get({ id: slackId }))!

	return json(convertWorkflowToPublic({ ...workflow, author }), { status: 201 })
}
