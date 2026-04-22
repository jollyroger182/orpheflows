import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { whitelists, workflows } from '../db/schema'

interface Check {
	id: number
	url: string
}

export async function check({ id, url }: Check) {
	const { host } = new URL(url)

	const checkUser = await db.query.whitelists.findFirst({
		where: and(
			eq(whitelists.scope, 'user'),
			eq(
				whitelists.userId,
				db.select({ authorId: workflows.authorId }).from(workflows).where(eq(workflows.id, id))
			),
			eq(whitelists.type, 'domain'),
			eq(whitelists.value, host)
		)
	})
	if (checkUser) {
		return checkUser
	}

	const checkGlobal = db.query.whitelists.findFirst({
		where: and(
			eq(whitelists.scope, 'global'),
			eq(whitelists.type, 'domain'),
			eq(whitelists.value, host)
		)
	})
	if (checkGlobal) {
		return checkGlobal
	}

	const checkWorkflow = db.query.whitelists.findFirst({
		where: and(
			eq(whitelists.scope, 'workflow'),
			eq(whitelists.workflowId, id),
			eq(whitelists.type, 'domain'),
			eq(whitelists.value, host)
		)
	})
	if (checkWorkflow) {
		return checkWorkflow
	}
}
