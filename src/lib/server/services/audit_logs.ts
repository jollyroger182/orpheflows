import { db } from '../db'
import { auditLogs } from '../db/schema'

interface Create {
	action: string
	user?: string
	resourceType: string
	resourceId: string | number
	metadata?: unknown
	source?: string
}

export async function create({ action, user, resourceType, resourceId, metadata, source }: Create) {
	return (
		await db
			.insert(auditLogs)
			.values({
				action,
				userId: user,
				resourceType,
				resourceId: String(resourceId),
				metadata: metadata ? JSON.stringify(metadata) : undefined,
				source
			})
			.returning()
	)[0]
}
