import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { userWhitelists, workflows, workflowWhitelists } from '../db/schema'

interface Check {
	id: number
	url: string
}

export async function check({ id, url }: Check) {
	const { host } = new URL(url)

	const checkWorkflow = await db.query.workflowWhitelists.findFirst({
		where: and(
			eq(workflowWhitelists.workflowId, id),
			eq(workflowWhitelists.type, 'domain'),
			eq(workflowWhitelists.value, host)
		)
	})
	if (checkWorkflow) {
		return true
	}

	const [checkUser] = await db
		.select()
		.from(userWhitelists)
		.where(
			and(
				eq(
					userWhitelists.userId,
					db.select({ authorId: workflows.authorId }).from(workflows).where(eq(workflows.id, id))
				),
				eq(userWhitelists.type, 'domain'),
				eq(userWhitelists.value, host)
			)
		)
	if (checkUser) {
		return true
	}

	return false
}
