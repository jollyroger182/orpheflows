import type { users, versions } from './db/schema'

export function convertWorkflowToPublic(workflow: DB.WorkflowWithAuthor) {
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

export function convertWorkflowToSelf(workflow: DB.WorkflowWithAuthor) {
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
		workflowId: version.workflowId,
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

export function convertVariableToSelf(variable: DB.Variable) {
	return {
		id: variable.id,
		workflowId: variable.workflowId,
		name: variable.name,
		value: variable.value
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
