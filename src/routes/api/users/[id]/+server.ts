import { convertUserToSelf } from '$lib/server/convert'
import { authorize } from '$lib/server/middleware'
import { Users } from '$lib/server/services'
import { error, json } from '@sveltejs/kit'
import z from 'zod'

const UpdateUserSchema = z.object({
	workflowLimit: z.int()
})

export async function PATCH({ request, locals, params }) {
	const id = params.id

	const actorId = await authorize({ request, locals }, 'admin')

	const result = UpdateUserSchema.safeParse(await request.json())
	if (!result.success) return error(400, z.prettifyError(result.error))
	const { workflowLimit } = result.data

	const user = await Users.updateWorkflowLimit({ id, limit: workflowLimit, actorId })

	return json(convertUserToSelf(user))
}
