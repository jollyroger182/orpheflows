// See https://svelte.dev/docs/kit/types#app.d.ts

import type { SlackEvent } from '@slack/web-api'

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
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
