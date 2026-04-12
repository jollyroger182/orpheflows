import type { Manifest } from '@slack/web-api/dist/types/request/manifest'

type BotScope = (((Manifest['oauth_config'] & {})['scopes'] & {})['bot'] & {})[number]

export const ID = {
	runWorkflow: 'run_workflow_80b152f4-c481-4781-8c34-edb5f8488c9f',
	ignore: 'ignore_b113a421-624d-4598-91e3-32cfff49ec71',
	ignore1: 'ignore_b113a421-624d-4598-91e3-32cfff49ec71_1',
	ignore2: 'ignore_b113a421-624d-4598-91e3-32cfff49ec71_2',
	ignore3: 'ignore_b113a421-624d-4598-91e3-32cfff49ec71_3'
}

export const WORKFLOW_LIMIT = 0
export const WORKFLOW_LIMIT_VERIFIED = 100

export const BLOCKS_LENGTH_LIMIT = 1_000_000
export const CODE_LENGTH_LIMIT = 1_000_000
export const CODE_STEPS_LIMIT = 200

export const USER_EXECUTE_RATE_LIMIT_TIME = 60_000
export const USER_EXECUTE_RATE_LIMIT_COUNT = 60
export const USER_EXECUTE_RATE_LIMIT_NOTIFY_INTERVAL = 30_000

export const EXECUTE_RATE_LIMIT_TIME = 60_000
export const EXECUTE_RATE_LIMIT_COUNT = 120
export const EXECUTE_RATE_LIMIT_NOTIFY_INTERVAL = 30_000

export const PERSISTENCE_VAR_LENGTH_LIMIT = 10000

export const FOR_MAX_ITERATIONS = 1000

export const WORKFLOW_APP_SCOPES: BotScope[] = [
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
