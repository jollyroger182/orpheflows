import { convertUserToSelf } from '$lib/server/convert.js'
import { authorize } from '$lib/server/middleware'
import { Users } from '$lib/server/services'
import { error, json } from '@sveltejs/kit'

export async function GET({ request, locals }) {
	const slackId = await authorize({ request, locals })

	const user = await Users.get({ id: slackId })
	if (!user) return error(404, 'User not found')

	return json(convertUserToSelf(user))
}
