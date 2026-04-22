import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	unique,
	foreignKey,
	index,
	varchar,
	real,
	boolean,
	pgEnum
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { WORKFLOW_LIMIT } from '../../consts'

// config tokens

export const configTokens = pgTable(
	'config_tokens',
	{
		id: serial('id').primaryKey(),
		token: text('token').notNull(),
		refreshToken: text('refresh_token').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index().on(table.createdAt)]
)

// workflows

export const workflows = pgTable(
	'workflows',
	{
		id: serial('id').primaryKey(),
		authorId: text('author_id')
			.references(() => users.id)
			.notNull(),
		name: varchar('name', { length: 36 }).notNull(),
		description: varchar('description', { length: 200 }).notNull().default('A brand new workflow'),
		appId: text('app_id').notNull(),
		clientId: text('client_id').notNull(),
		clientSecret: text('client_secret').notNull(),
		verificationToken: text('verification_token').notNull(),
		signingSecret: text('signing_secret').notNull(),
		blocks: text('blocks'),
		code: text('code').notNull().default(''),
		isPublic: boolean('is_public').notNull().default(false),
		blocksUpdatedAt: timestamp('blocks_updated_at', { withTimezone: true }).notNull().defaultNow(),
		codeUpdatedAt: timestamp('code_updated_at', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		rateLimitNotifiedAt: timestamp('rate_limit_notified_at', { withTimezone: true })
	},
	(table) => [
		index().on(table.clientId),
		index().on(table.verificationToken),
		index().on(table.authorId)
	]
)

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
	versions: many(versions),
	installation: one(installations),
	author: one(users, {
		fields: [workflows.authorId],
		references: [users.id]
	}),
	triggeringListener: one(listeners),
	variables: many(variables),
	whitelists: many(workflowWhitelists)
}))

// installations

export const installations = pgTable('workflow_installations', {
	id: serial('id').primaryKey(),
	workflowId: integer('workflow_id')
		.references(() => workflows.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),
	userId: text('user_id').notNull(),
	token: text('token').notNull()
})

export const installationsRelations = relations(installations, ({ one }) => ({
	workflow: one(workflows, {
		fields: [installations.workflowId],
		references: [workflows.id]
	})
}))

// versions

export const versions = pgTable(
	'workflow_versions',
	{
		id: serial('id').primaryKey(),
		workflowId: integer('workflow_id')
			.references(() => workflows.id, { onDelete: 'cascade' })
			.notNull(),
		blocks: text('blocks'),
		code: text('code').notNull().default(''),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		unique().on(table.id, table.workflowId),
		index().on(table.workflowId),
		index().on(table.workflowId, table.createdAt)
	]
)

export const versionsRelations = relations(versions, ({ one, many }) => ({
	workflow: one(workflows, {
		fields: [versions.workflowId],
		references: [workflows.id]
	}),
	executions: many(executions)
}))

// executions

export const executions = pgTable(
	'workflow_executions',
	{
		id: serial('id').primaryKey(),
		versionId: integer('version_id').notNull(),
		workflowId: integer('workflow_id')
			.references(() => workflows.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id'),
		data: text('data').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		foreignKey({
			name: 'workflow_executions_versions_id_workflow_id_fk',
			columns: [table.versionId, table.workflowId],
			foreignColumns: [versions.id, versions.workflowId]
		}).onDelete('cascade'),
		index().on(table.workflowId),
		index().on(table.versionId),
		index().on(table.createdAt),
		index().on(table.workflowId, table.createdAt),
		index().on(table.workflowId, table.createdAt, table.userId)
	]
)

export const executionsRelations = relations(executions, ({ one }) => ({
	version: one(versions, {
		fields: [executions.versionId, executions.workflowId],
		references: [versions.id, versions.workflowId]
	}),
	workflow: one(workflows, {
		fields: [executions.workflowId],
		references: [workflows.id]
	})
}))

// workflow persistence

export const variables = pgTable(
	'workflow_variables',
	{
		id: serial('id').primaryKey(),
		workflowId: integer('workflow_id')
			.references(() => workflows.id, { onDelete: 'cascade' })
			.notNull(),
		name: text().notNull(),
		value: text().notNull()
	},
	(table) => [unique().on(table.workflowId, table.name), index().on(table.workflowId)]
)

export const variablesRelations = relations(variables, ({ one }) => ({
	workflow: one(workflows, {
		fields: [variables.workflowId],
		references: [workflows.id]
	})
}))

// workflow domain whitelists

export const whitelistType = pgEnum('whitelist_type', ['domain'])

export const workflowWhitelists = pgTable(
	'workflow_whitelists',
	{
		id: serial('id').primaryKey(),
		workflowId: integer('workflow_id')
			.references(() => workflows.id, { onDelete: 'cascade' })
			.notNull(),
		type: whitelistType('type').notNull(),
		value: text('value').notNull(),
		createdBy: text('created_by')
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index().on(table.workflowId, table.type, table.value)]
)

export const workflowWhitelistsRelations = relations(workflowWhitelists, ({ one }) => ({
	creator: one(users, {
		fields: [workflowWhitelists.createdBy],
		references: [users.id]
	}),
	workflow: one(workflows, {
		fields: [workflowWhitelists.workflowId],
		references: [workflows.id]
	})
}))

// user rate limit notifications

export const workflowUserNotifs = pgTable(
	'workflow_user_notifs',
	{
		id: serial('id').primaryKey(),
		workflowId: integer('workflow_id')
			.references(() => workflows.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id').notNull(),
		notifiedAt: timestamp('notified_at', { withTimezone: true }).notNull()
	},
	(table) => [index('idx_workflow_user_notifs_workflow_user').on(table.userId, table.workflowId)]
)

export const workflowUserNotifsRelations = relations(workflowUserNotifs, ({ one }) => ({
	workflow: one(workflows, {
		fields: [workflowUserNotifs.workflowId],
		references: [workflows.id]
	})
}))

// listeners

export const listeners = pgTable(
	'listeners',
	{
		id: serial('id').primaryKey(),
		triggersWorkflowId: integer('triggers_workflow_id').references(() => workflows.id, {
			onDelete: 'cascade'
		}),
		event: text('event').notNull(),
		param: text('param'),
		paramNum: real('param_num'),
		handler: text('handler').notNull(),
		data: text('data')
	},
	(table) => [index().on(table.event, table.param), index().on(table.event, table.paramNum)]
)

export const listenersRelations = relations(listeners, ({ one }) => ({
	triggersWorkflow: one(workflows, {
		fields: [listeners.triggersWorkflowId],
		references: [workflows.id]
	})
}))

// users

export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	photo_url: text('photo_url'),
	role: userRoleEnum('role').notNull().default('user'),
	workflowLimit: integer('workflow_limit').notNull().default(WORKFLOW_LIMIT)
})

export const usersRelations = relations(users, ({ many }) => ({
	workflows: many(workflows),
	tokens: many(tokens),
	workflowWhitelists: many(workflowWhitelists)
}))

// tokens

export const tokens = pgTable(
	'user_tokens',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		tokenHash: text('token_hash').notNull().unique(),
		name: text('name').notNull().default('Unnamed token'),
		lastUsed: timestamp('last_used', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true })
	},
	(table) => [index().on(table.tokenHash), index().on(table.userId)]
)

export const tokensRelations = relations(tokens, ({ one }) => ({
	user: one(users, {
		fields: [tokens.userId],
		references: [users.id]
	})
}))

// user domain whitelists

export const userWhitelists = pgTable(
	'user_whitelists',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		type: whitelistType('type').notNull(),
		value: text('value').notNull(),
		createdBy: text('created_by')
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index().on(table.userId, table.type, table.value)]
)

// audit logs

export const auditLogs = pgTable(
	'audit_logs',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id'),
		action: text('action').notNull(),
		resourceType: text('resource_type').notNull(),
		resourceId: text('resource_id').notNull(),
		source: text('source'),
		metadata: text('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index().on(table.userId),
		index().on(table.action, table.userId),
		index().on(table.resourceType, table.resourceId),
		index().on(table.createdAt)
	]
)
