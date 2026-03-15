import { WebClient } from '@slack/web-api'

const slack = new WebClient()

const refreshToken = prompt('Refresh token:')!

const resp = await slack.tooling.tokens.rotate({ refresh_token: refreshToken })

const payload = { refresh_token: resp.refresh_token!, token: resp.token!, expires_at: new Date(resp.exp! *1000) }

await Bun.sql`INSERT INTO config_tokens ${Bun.sql(payload)}`
