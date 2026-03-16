import type { Manifest } from '@slack/web-api/dist/types/request/manifest'
import { getActiveConfigToken } from './config_tokens'
import { EXTERNAL_URL } from '$env/static/private'
import { slack } from '../slack'
import { WORKFLOW_APP_SCOPES } from '$lib/consts'

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
			redirect_urls: [`${EXTERNAL_URL}/api/slack/callback`],
			scopes: {
				bot: WORKFLOW_APP_SCOPES
			}
		},
		settings: {
			event_subscriptions: {
				request_url: `${EXTERNAL_URL}/api/slack/events`,
				bot_events: ['app_home_opened']
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

	const resp = await slack.apps.manifest.create({ manifest, token })

	return {
		appId: resp.app_id!,
		clientId: resp.credentials!.client_id!,
		clientSecret: resp.credentials!.client_secret!,
		verificationToken: resp.credentials!.verification_token!,
		signingSecret: resp.credentials!.signing_secret!
	}
}
