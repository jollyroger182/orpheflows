import { convertWorkflowToPublic } from '$lib/server/convert'
import { Workflows } from '$lib/server/services'
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { startWorkflow } from '$lib/server/workflows/execution'
import z from 'zod'

export const load: PageServerLoad = async ({ locals, params }) => {
	const id = parseInt(params.id)
	if (isNaN(id)) return error(404, 'Workflow not found')

	const flow = await Workflows.getWorkflow({ id })
	if (!flow) return error(404, 'Workflow not found')

	const session = await locals.auth()

	const isOwner = flow.authorId == session?.user.slackId
	const isInstalled = !!flow.installation

	let canRun = false
	if (session) {
		const version = await Workflows.getLatestVersion({ id })
		if (version) {
			const steps = JSON.parse(version.code) as WorkflowStep[]
			canRun = !!steps.find((s) => s.type === 'trigger' && s.params.TRIGGER === 'WEBSITE')
		}
	}

	return {
		workflow: convertWorkflowToPublic(flow),
		clientId: isOwner ? flow.clientId : null,
		isOwner,
		isInstalled,
		canRun
	}
}

const EditSchema = z.object({
	name: z.string().nonempty().max(36),
	description: z.string().nonempty().max(200)
})

export const actions = {
	run: async ({ locals, params }) => {
		const id = parseInt(params.id)
		if (isNaN(id)) return error(404, 'Workflow not found')

		const session = await locals.auth()
		if (!session?.user.slackId) return error(401, 'You are not logged in')

		const flow = await Workflows.getWorkflow({ id })
		if (!flow) return error(404, 'Workflow not found')

		await startWorkflow({
			workflowId: id,
			variables: { 'trigger.user': session.user.slackId },
			findTrigger: (step) => step.params.TRIGGER === 'WEBSITE'
		})

		return { message: 'Workflow started!' }
	},
	delete: async ({ locals, params }) => {
		const id = parseInt(params.id)
		if (isNaN(id)) return error(404, 'Workflow not found')

		const session = await locals.auth()
		if (!session?.user.slackId) return error(401, 'You are not logged in')

		const flow = await Workflows.getWorkflow({ id })
		if (!flow) return error(404, 'Workflow not found')

		if (flow.authorId !== session.user.slackId) return error(403, 'You cannot delete this workflow')

		await Workflows.deleteWorkflow({ id, appId: flow.appId })

		redirect(303, '/')
	},
	edit: async ({ locals, params, request }) => {
		const id = parseInt(params.id)
		if (isNaN(id)) return error(404, 'Workflow not found')

		const session = await locals.auth()
		if (!session?.user.slackId) return error(401, 'You are not logged in')

		const form = await request.formData()
		const {
			success,
			error: err,
			data
		} = EditSchema.safeParse({
			name: form.get('name'),
			description: form.get('description')
		})
		if (!success) {
			return { error: z.prettifyError(err) }
		}
		const { name, description } = data

		const flow = await Workflows.setDetails({ id, name, description, userId: session.user.slackId })
		if (!flow) return error(403, 'You cannot edit this workflow')

		return { message: 'Workflow edited!' }
	}
}
