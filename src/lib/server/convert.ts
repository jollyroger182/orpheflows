import type { users, workflows } from './db/schema'

type WorkflowWithAuthor = typeof workflows.$inferSelect & { author: typeof users.$inferSelect }

export function convertWorkflowToPublic(workflow: WorkflowWithAuthor) {
	return {
		id: workflow.id,
		author: {
			id: workflow.author.id,
			name: workflow.author.name,
			photo_url: workflow.author.photo_url
		},
		name: workflow.name,
		description: workflow.description,
		createdAt: workflow.createdAt
	}
}
