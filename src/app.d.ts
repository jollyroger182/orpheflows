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
			getWorkflow(id: number): Promise<BasicWorkflow | undefined>
			authorize(apiToken: string): Promise<AuthorizedAPI>
		}

		interface AuthorizedAPI {
			getMe(): Promise<User>
			getMyWorkflows(): Promise<BasicWorkflow[]>
		}

		// workflows

		interface BasicWorkflow {
			getDetails(): Promise<Schemas.PublicWorkflow>
		}

		interface ReadonlyWorkflow extends BasicWorkflow {
			getFullDetails(): Promise<Schemas.SelfWorkflow>
			getVersions(): Promise<ReadonlyVersion[]>
			getLatestVersion(): Promise<ReadonlyVersion | undefined>
		}

		interface Workflow extends ReadonlyWorkflow {
			updateDetails(data: { name: string; description: string }): Promise<void>
			updateCode(data: { code: string; blocks: string | null }): Promise<void>
			setPublic(isPublic: boolean): Promise<void>
			publish(): Promise<Version>
			getFullVersions(): Promise<Version[]>
			getFullLatestVersion(): Promise<Version | undefined>
		}

		// versions

		interface ReadonlyVersion {
			getDetails(): Promise<Schemas.PublicVersion>
		}

		interface Version extends ReadonlyVersion {
			getFullDetails(): Promise<Schemas.SelfVersion>
		}

		// users

		interface BasicUser {
			getDetails(): Promise<Schemas.PublicUser>
		}

		interface User {
			getFullDetails(): Promise<Schemas.SelfUser>
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
