// See https://svelte.dev/docs/kit/types#app.d.ts
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
}

declare module '@auth/core/types' {
	interface Session {
		user: {
			slackId?: string
		} & DefaultSession['user']
	}
}

declare module '@auth/core/jwt' {
	interface JWT {
		slackId?: string
	}
}

export {}
