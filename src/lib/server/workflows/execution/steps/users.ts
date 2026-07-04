import { slack } from '$lib/server/slack'
import { isSlackPlatformError } from '$lib/server/utils'
import { progressWorkflow, type StepExecutionContext } from '..'

export default {
	user_from_id: async (ctx) => ctx.evaluate(ctx.params.ID as WorkflowStep),
	user_to_id: async (ctx) => ctx.evaluate(ctx.params.USER as WorkflowStep),
	user_mention: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		return `<@${user}>`
	},
	user_is_bot: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		const resp = await slack.users.info({ user, token: await ctx.getToken() })
		return resp.user?.is_bot ? 'true' : 'false'
	},
	user_exists: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		try {
			await slack.users.info({ user, token: await ctx.getToken() })
			return 'true'
		} catch (e) {
			if (isSlackPlatformError(e, 'user_not_found')) {
				return 'false'
			}
			throw e
		}
	},
	usergroup_add: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		const group = await ctx.evaluate(ctx.params.GROUP as WorkflowStep)

		const token = await ctx.getToken()

		const usersResp = await slack.usergroups.users.list({ usergroup: group, token })
		const users = usersResp.users!
		if (!users.includes(user)) {
			await slack.usergroups.users.update({
				users: [...users, user].join(','),
				usergroup: group,
				token
			})
		}

		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	usergroup_remove: async (ctx) => {
		const user = await ctx.evaluate(ctx.params.USER as WorkflowStep)
		const group = await ctx.evaluate(ctx.params.GROUP as WorkflowStep)

		const token = await ctx.getToken()

		const usersResp = await slack.usergroups.users.list({ usergroup: group, token })
		const users = usersResp.users!
		const idx = users.indexOf(user)
		if (idx >= 0) {
			users.splice(idx, 1)
			await slack.usergroups.users.update({
				users: users.join(','),
				usergroup: group,
				token
			})
		}

		await progressWorkflow({
			executionId: ctx.executionId,
			continuationToken: ctx.data.continuationToken
		})
	},
	usergroup_get: async (ctx) => {
		const group = await ctx.evaluate(ctx.params.GROUP as WorkflowStep)

		const usersResp = await slack.usergroups.users.list({
			usergroup: group,
			token: await ctx.getToken()
		})
		const users = usersResp.users!

		return JSON.stringify(users)
	}
} satisfies Record<string, (context: StepExecutionContext) => Promise<unknown>>
