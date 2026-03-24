import type { installations, users, versions, workflows } from './db/schema'

type WorkflowWithAuthor = typeof workflows.$inferSelect & {
	author: typeof users.$inferSelect
	installation?: typeof installations.$inferSelect | null
}

export function convertWorkflowToPublic(workflow: WorkflowWithAuthor) {
	return {
		id: workflow.id,
		author: convertUserToPublic(workflow.author),
		installation: workflow.installation
			? {
					userId: workflow.installation.userId
				}
			: null,
		name: workflow.name,
		description: workflow.description,
		appId: workflow.appId,
		isPublic: workflow.isPublic,
		createdAt: workflow.createdAt,
		blocks: workflow.isPublic ? workflow.blocks : null,
		code: workflow.isPublic ? workflow.code : null
	}
}

export function convertWorkflowToSelf(workflow: WorkflowWithAuthor) {
	return {
		...convertWorkflowToPublic(workflow),
		author: convertUserToSelf(workflow.author),
		blocks: workflow.blocks,
		blocksUpdatedAt: workflow.blocksUpdatedAt,
		code: workflow.code,
		codeUpdatedAt: workflow.codeUpdatedAt
	}
}

export function convertVersionToPublic(
	version: typeof versions.$inferSelect,
	isPublic: boolean = false
) {
	return {
		id: version.id,
		createdAt: version.createdAt,
		blocks: isPublic ? version.blocks : null,
		code: isPublic ? version.code : null
	}
}

export function convertVersionToSelf(version: typeof versions.$inferSelect) {
	return {
		...convertVersionToPublic(version),
		blocks: version.blocks,
		code: version.code
	}
}

export function convertUserToPublic(user: typeof users.$inferSelect) {
	return {
		id: user.id,
		name: user.name,
		photo_url: user.photo_url,
		role: user.role
	}
}

export function convertUserToSelf(user: typeof users.$inferSelect) {
	return {
		...convertUserToPublic(user),
		workflowLimit: user.workflowLimit
	}
}
