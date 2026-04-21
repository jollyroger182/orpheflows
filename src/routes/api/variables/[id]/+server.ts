import { PERSISTENCE_VAR_LENGTH_LIMIT } from '$lib/consts'
import { authorize } from '$lib/server/middleware'
import { Variables } from '$lib/server/services'
import { error, json } from '@sveltejs/kit'
import z from 'zod'

const UpdateSchema = z.object({
	value: z.string().max(PERSISTENCE_VAR_LENGTH_LIMIT)
})

export async function PATCH({ locals, params, request }) {
	const userId = await authorize({ locals, request })

	const id = parseInt(params.id)
	if (isNaN(id)) return error(404, 'Variable not found')

	let data: z.infer<typeof UpdateSchema>
	try {
		data = UpdateSchema.parse(await request.json())
	} catch {
		return error(400, 'Invalid parameters')
	}

	const variable = await Variables.setById({ id, value: data.value, userId })
	if (!variable) return error(403, 'Variable not found or not owned by you')

	return json({
		id: variable.id,
		workflowId: variable.workflowId,
		name: variable.name,
		value: variable.value
	})
}

export async function DELETE({ locals, params, request }) {
	const userId = await authorize({ locals, request })

	const id = parseInt(params.id)
	if (isNaN(id)) return error(404, 'Variable not found')

	const variable = await Variables.deleteById({ id, userId })
	if (!variable) return error(403, 'Variable not found or not owned by you')

	return json({
		id: variable.id,
		workflowId: variable.workflowId,
		name: variable.name,
		value: variable.value
	})
}
