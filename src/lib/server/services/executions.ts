import { db } from '../db'
import { executions } from '../db/schema'

interface Create {
	workflowId: number
	versionId: number
	data: string
}

export async function create({ workflowId, versionId, data }: Create) {
	return (await db.insert(executions).values({ workflowId, versionId, data }).returning())[0]!
}
