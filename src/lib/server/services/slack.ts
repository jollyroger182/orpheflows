import type { Manifest } from '@slack/web-api/dist/types/request/manifest'
import { getActiveConfigToken } from './config_tokens'
import { EXTERNAL_URL } from '$env/static/private'
import { slack } from '../slack'

type BotScope = (((Manifest['oauth_config'] & {})['scopes'] & {})['bot'] & {})[number]

interface CreateApp {
	name: string
}

export async function createApp({ name }: CreateApp) {
	const token = await getActiveConfigToken()
	if (!token) {
		throw new Error('No app config token set')
	}

	const manifest = {
		display_information: {
			name,
			description: 'Workflow created by Orpheflows'
		},
		features: {
			app_home: {
				home_tab_enabled: true,
				messages_tab_enabled: true,
				messages_tab_read_only_enabled: true
			},
			bot_user: {
				display_name: name,
				always_online: false
			}
		},
		oauth_config: {
			redirect_urls: [`${EXTERNAL_URL}/oauth/callback`],
			scopes: {
				bot: WORKFLOW_APP_SCOPES
			}
		},
		settings: {
			event_subscriptions: {
				request_url: `${EXTERNAL_URL}/slack/events`,
				bot_events: ['app_home_opened']
			},
			interactivity: {
				is_enabled: true,
				request_url: `${EXTERNAL_URL}/slack/interaction`,
				message_menu_options_url: `${EXTERNAL_URL}/slack/interaction`
			},
			org_deploy_enabled: false,
			socket_mode_enabled: false,
			token_rotation_enabled: false
		}
	} satisfies Manifest

	const resp = await slack.apps.manifest.create({ manifest, token })

	return {
		appId: resp.app_id!,
		clientId: resp.credentials!.client_id!,
		clientSecret: resp.credentials!.client_secret!,
		verificationToken: resp.credentials!.verification_token!,
		signingSecret: resp.credentials!.signing_secret!,
	}
}

const WORKFLOW_APP_SCOPES: BotScope[] = [
	'app_mentions:read',
	'bookmarks:read',
	'bookmarks:write',
	'calls:read',
	'calls:write',
	'channels:history',
	'channels:join',
	'channels:manage',
	'channels:read',
	'channels:write.invites',
	'channels:write.topic',
	'chat:write',
	'chat:write.customize',
	'chat:write.public',
	'commands',
	'dnd:read',
	'emoji:read',
	'files:read',
	'files:write',
	'groups:history',
	'groups:read',
	'groups:write',
	'groups:write.invites',
	'groups:write.topic',
	'im:history',
	'im:read',
	'im:write',
	'links.embed:write',
	'links:read',
	'links:write',
	'metadata.message:read',
	'mpim:history',
	'mpim:read',
	'mpim:write',
	'mpim:write.topic',
	'pins:read',
	'pins:write',
	'reactions:read',
	'reactions:write',
	'reminders:read',
	'reminders:write',
	'team.billing:read',
	'team.preferences:read',
	'team:read',
	'usergroups:read',
	'usergroups:write',
	'users.profile:read',
	'users:read',
	'users:read.email',
	'users:write',

	// bolt doesn't recognize these smh
	'canvases:read' as BotScope,
	'canvases:write' as BotScope,
	'im:write.topic' as BotScope,
	'lists:read' as BotScope,
	'lists:write' as BotScope,
	'search:read.files' as BotScope,
	'search:read.im' as BotScope,
	'search:read.mpim' as BotScope,
	'search:read.private' as BotScope,
	'search:read.public' as BotScope,
	'search:read.users' as BotScope
]
