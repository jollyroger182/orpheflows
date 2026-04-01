import type { SlackEvent } from '@slack/web-api'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface WebSocketData {
		wrapped?: import('$lib/rpc/websocket').BunWebsocketWrapper
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			server: Bun.Server<WebSocketData>
			request: Request
		}
	}

	interface WorkflowStep {
		id: string
		type: string
		params: Record<string, string | number | WorkflowStep | WorkflowStep[] | null>
	}

	namespace Slack {
		interface EventCallback<T extends SlackEvent = SlackEvent> {
			token: string
			team_id: string
			api_app_id: string
			event: T
			type: 'event_callback'
			event_id: string
			event_time: number
			authorizations: unknown[]
		}
	}

	namespace RPC {
		interface PublicAPI {
			getWorkflow(id: number): Promise<BasicWorkflow | null>
			getUser(id: string): Promise<BasicUser | null>
			authorize(apiToken: string): Promise<AuthorizedAPI>
		}

		interface AuthorizedAPI {
			getMe(): Promise<User>
		}

		// workflows

		interface BasicWorkflow {
			refresh(): Promise<void>
			getDetails(): Promise<Schemas.PublicWorkflow>
			getVersions(): Promise<BasicVersion[]>
			getLatestVersion(): Promise<BasicVersion | null>
		}

		interface Workflow extends ReadonlyWorkflow {
			getFullDetails(): Promise<Schemas.SelfWorkflow>
			getFullVersions(): Promise<Version[]>
			getFullLatestVersion(): Promise<Version | null>
			updateDetails(data: { name: string; description: string }): Promise<void>
			updateCode(data: { code: string; blocks: string | null }): Promise<void>
			setPublic(isPublic: boolean): Promise<void>
			publish(): Promise<Version>
		}

		// versions

		interface BasicVersion {
			refresh(): Promise<void>
			getDetails(): Promise<Schemas.PublicVersion>
		}

		interface Version extends BasicVersion {
			getFullDetails(): Promise<Schemas.SelfVersion>
		}

		// users

		interface BasicUser {
			refresh(): Promise<void>
			getDetails(): Promise<Schemas.PublicUser>
			getWorkflows(pagination?: { offset?: number; limit?: number }): Promise<BasicWorkflow[]>
		}

		interface User extends BasicUser {
			getFullDetails(): Promise<Schemas.SelfUser>
			getFullWorkflows(pagination?: { offset?: number; limit?: number }): Promise<Workflow[]>
		}
	}

	namespace Schemas {
		interface PublicWorkflow {
			id: number
			author: PublicUser
			installation: PublicInstallation | null
			name: string
			description: string
			appId: string
			isPublic: boolean
			blocks: string | null
			code: string | null
			createdAt: Date
		}

		interface SelfWorkflow extends PublicWorkflow {
			author: SelfUser
			blocksUpdatedAt: Date
			code: string
			codeUpdatedAt: Date
		}

		interface PublicUser {
			id: string
			name: string
			photo_url: string | null
		}

		interface SelfUser extends PublicUser {
			workflowLimit: number
		}

		interface PublicInstallation {
			userId: string
		}

		interface PublicVersion {
			id: number
			workflowId: number
			blocks: string | null
			code: string | null
			createdAt: Date
		}

		interface SelfVersion extends PublicVersion {
			code: string
		}
	}

	namespace DB {
		type Workflow = typeof import('$lib/server/db/schema').workflows.$inferSelect
		type Installation = typeof import('$lib/server/db/schema').installations.$inferSelect
		type Version = typeof import('$lib/server/db/schema').versions.$inferSelect
		type Execution = typeof import('$lib/server/db/schema').executions.$inferSelect
		type User = typeof import('$lib/server/db/schema').users.$inferSelect
		type Token = typeof import('$lib/server/db/schema').tokens.$inferSelect

		type WorkflowWithAuthor = Workflow & { author: User; installation?: Installation | null }
	}
}

declare module '@auth/core/types' {
	interface Session {
		user: {
			slackId?: string
			role?: string
		} & DefaultSession['user']
	}
}

declare module '@auth/core/jwt' {
	interface JWT {
		slackId?: string
		role?: string
	}
}

export {}
