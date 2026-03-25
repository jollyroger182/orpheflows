import { error } from '@sveltejs/kit'
import { Users } from './services'

export async function authorize(
	{ locals, request }: { locals: App.Locals; request: Request },
	required?: true | 'admin'
): Promise<string>
export async function authorize(
	{ locals, request }: { locals: App.Locals; request: Request },
	required: false
): Promise<string | undefined>

export async function authorize(
	{ locals, request }: { locals: App.Locals; request: Request },
	required: boolean | 'admin' = true
) {
	return (await authorizeUser({ locals, request }, required as false)).userId
}

interface AuthorizedUser {
	userId: string
	role: string
}

export async function authorizeUser(
	{ locals, request }: { locals: App.Locals; request: Request },
	required?: true | 'admin'
): Promise<AuthorizedUser>
export async function authorizeUser(
	{ locals, request }: { locals: App.Locals; request: Request },
	required: false
): Promise<Partial<AuthorizedUser>>

export async function authorizeUser(
	{ locals, request }: { locals: App.Locals; request: Request },
	required: boolean | 'admin' = true
): Promise<Partial<AuthorizedUser>> {
	const auth = request.headers.get('Authorization')
	if (auth?.startsWith('Bearer ')) {
		const token = await Users.getUserToken({ token: auth.substring(7) })
		if (!token && required) throw error(401, 'Invalid or expired token')
		if (required === 'admin' && token?.user.role !== 'admin') throw error(401, 'Not an admin')
		return { userId: token?.user.id, role: token?.user.role || 'user' }
	}

	const session = await locals.auth()
	if (!session?.user.slackId && required) throw error(403, 'Not logged in')
	if (required === 'admin' && session?.user.role !== 'admin') throw error(401, 'Not an admin')
	return { userId: session?.user.slackId, role: session?.user.role || 'user' }
}
