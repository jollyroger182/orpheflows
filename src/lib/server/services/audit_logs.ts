import { db } from '../db'
import { auditLogs } from '../db/schema'

interface Create {
	action: string
	user?: string
	resourceType: string
	resourceId: string | number
	metadata?: unknown
}

export async function create({ action, user, resourceType, resourceId, metadata }: Create) {
	return (
		await db
			.insert(auditLogs)
			.values({
				action,
				user,
				resourceType,
				resourceId: String(resourceId),
				metadata: metadata ? JSON.stringify(metadata) : undefined
			})
			.returning()
	)[0]
}
