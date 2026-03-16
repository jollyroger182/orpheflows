import type { installations, users, workflows } from './db/schema'

type WorkflowWithAuthor = typeof workflows.$inferSelect & {
	author: typeof users.$inferSelect
	installation?: typeof installations.$inferSelect | null
}

export function convertWorkflowToPublic(workflow: WorkflowWithAuthor) {
	return {
		id: workflow.id,
		author: {
			id: workflow.author.id,
			name: workflow.author.name,
			photo_url: workflow.author.photo_url
		},
		installation: workflow.installation
			? {
					userId: workflow.installation.userId
				}
			: null,
		name: workflow.name,
		description: workflow.description,
		appId: workflow.appId,
		createdAt: workflow.createdAt
	}
}

export function convertWorkflowToSelf(workflow: WorkflowWithAuthor) {
	return {
		...convertWorkflowToPublic(workflow),
		blocks: workflow.blocks,
		blocksUpdatedAt: workflow.blocksUpdatedAt,
		code: workflow.code,
		codeUpdatedAt: workflow.codeUpdatedAt
	}
}
