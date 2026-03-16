import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	unique,
	foreignKey,
	index
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

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
		name: text('name').notNull(),
		description: text('description').notNull().default('A brand new workflow'),
		appId: text('app_id').notNull(),
		clientId: text('client_id').notNull(),
		clientSecret: text('client_secret').notNull(),
		verificationToken: text('verification_token').notNull(),
		signingSecret: text('signing_secret').notNull(),
		blocks: text('blocks'),
		code: text('code').notNull().default(''),
		blocksUpdatedAt: timestamp('blocks_updated_at', { withTimezone: true }).notNull().defaultNow(),
		codeUpdatedAt: timestamp('code_updated_at', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index().on(table.clientId)]
)

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
	versions: many(versions),
	installation: one(installations),
	author: one(users, {
		fields: [workflows.authorId],
		references: [users.id]
	})
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
		data: text().notNull(),
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
		index().on(table.workflowId, table.createdAt)
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

// users

export const users = pgTable('users', {
	id: text().primaryKey(),
	name: text().notNull(),
	photo_url: text()
})

export const usersRelations = relations(users, ({ many }) => ({
	workflows: many(workflows)
}))
