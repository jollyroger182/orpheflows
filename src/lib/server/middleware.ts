import { error } from '@sveltejs/kit'
import { Users } from './services'

export async function authorize({ locals, request }: { locals: App.Locals; request: Request }) {
	const auth = request.headers.get('Authorization')
	if (auth?.startsWith('Bearer ')) {
		const token = await Users.getUserToken({ token: auth.substring(7) })
		if (!token) throw error(401, 'Invalid or expired token')
		return token.user.id
	}

	const session = await locals.auth()
	if (!session?.user.slackId) throw error(403, 'Not logged in')
	return session.user.slackId
}
