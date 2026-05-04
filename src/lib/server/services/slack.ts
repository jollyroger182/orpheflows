import { EXTERNAL_URL } from '$env/static/private'
import { WORKFLOW_APP_SCOPES } from '$lib/consts'
import type { Manifest } from '@slack/web-api/dist/types/request/manifest'
import { ConfigTokens } from '.'
import { slack } from '../slack'
import type { workflows } from '../db/schema'
import { getLatestVersion } from './workflows'

interface CreateApp {
	name: string
}

export async function createApp({ name }: CreateApp) {
	const token = await ConfigTokens.getActiveConfigToken()
	if (!token) {
		throw new Error('No app config token set')
	}

	const manifest = await generateManifest({ name })

	const resp = await slack.apps.manifest.create({ manifest, token })

	return {
		appId: resp.app_id!,
		clientId: resp.credentials!.client_id!,
		clientSecret: resp.credentials!.client_secret!,
		verificationToken: resp.credentials!.verification_token!,
		signingSecret: resp.credentials!.signing_secret!
	}
}

interface UpdateApp {
	workflow: typeof workflows.$inferSelect
}

export async function updateApp({ workflow }: UpdateApp) {
	const token = await ConfigTokens.getActiveConfigToken()
	if (!token) {
		throw new Error('No app config token set')
	}

	const version = await getLatestVersion({ id: workflow.id })
	const code = (version ? JSON.parse(version.code) : []) as WorkflowStep[]

	const manifest = await generateManifest({
		name: workflow.name,
		triggers: code.filter((s) => s.type === 'trigger')
	})

	await slack.apps.manifest.update({ app_id: workflow.appId, manifest, token })
}

interface DeleteApp {
	id: string
}

export async function deleteApp({ id }: DeleteApp) {
	const token = await ConfigTokens.getActiveConfigToken()
	if (!token) {
		throw new Error('No app config token set')
	}

	await slack.apps.manifest.delete({ app_id: id, token })
}

interface GenerateManifest {
	name: string
	triggers?: WorkflowStep[]
}

export async function generateManifest({ name, triggers = [] }: GenerateManifest) {
	const reactionEvents = triggers.find((s) => s.params.TRIGGER === 'REACTION')
		? (['reaction_added'] as const)
		: []
	const joinEvents = triggers.find((s) => s.params.TRIGGER === 'JOIN')
		? (['member_joined_channel'] as const)
		: []
	const messageEvents = triggers.find((s) => s.params.TRIGGER === 'MESSAGE')
		? (['message.channels', 'message.groups', 'message.mpim'] as const)
		: []
	const dmEvents = triggers.find((s) => s.params.TRIGGER === 'DM') ? (['message.im'] as const) : []
	const slashCommands = triggers
		.filter((s) => s.params.TRIGGER === 'SLASH')
		.map((s) => ({
			command: `/${s.params.NAME}`,
			description: 'Trigger the workflow',
			should_escape: true,
			url: `${EXTERNAL_URL}/api/slack/slash`
		}))

	const manifest = {
		display_information: {
			name,
			description: 'Workflow created by Orpheflows'
		},
		features: {
			app_home: {
				home_tab_enabled: true,
				messages_tab_enabled: true,
				messages_tab_read_only_enabled: false
			},
			bot_user: {
				display_name: name,
				always_online: false
			},
			slash_commands: slashCommands.length ? slashCommands : undefined
		},
		oauth_config: {
			redirect_urls: [`${EXTERNAL_URL}/api/slack/callback`],
			scopes: {
				bot: WORKFLOW_APP_SCOPES
			}
		},
		settings: {
			event_subscriptions: {
				request_url: `${EXTERNAL_URL}/api/slack/events`,
				bot_events: [
					'app_home_opened',
					...reactionEvents,
					...joinEvents,
					...messageEvents,
					...dmEvents
				]
			},
			interactivity: {
				is_enabled: true,
				request_url: `${EXTERNAL_URL}/api/slack/interaction`,
				message_menu_options_url: `${EXTERNAL_URL}/api/slack/interaction`
			},
			org_deploy_enabled: false,
			socket_mode_enabled: false,
			token_rotation_enabled: false
		}
	} satisfies Manifest

	return manifest
}
