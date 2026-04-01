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
			getWorkflow(id: number): Promise<{ id: number } | undefined>
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
			createdAt: Date
		}

		interface SelfWorkflow extends PublicWorkflow {
			author: SelfUser
			blocks: string | null
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
