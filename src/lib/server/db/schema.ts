import { pgTable, serial, integer, text, timestamp, unique, foreignKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// workflows

export const workflows = pgTable('workflows', {
	id: serial('id').primaryKey(),
	authorId: text('author_id')
		.references(() => users.id)
		.notNull(),
	name: text().notNull(),
	description: text().notNull().default('A brand new workflow'),
	blocks: text('blocks'),
	code: text('code').notNull().default(''),
	blocksUpdatedAt: timestamp('blocks_updated_at', { withTimezone: true }).notNull().defaultNow(),
	codeUpdatedAt: timestamp('code_updated_at', { withTimezone: true }).notNull().defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
	versions: many(versions),
	author: one(users, {
		fields: [workflows.authorId],
		references: [users.id]
	})
}))

// versions

export const versions = pgTable(
	'workflow_versions',
	{
		id: serial('id').primaryKey(),
		workflowId: integer('workflow_id')
			.references(() => workflows.id)
			.notNull(),
		blocks: text('blocks'),
		code: text('code').notNull().default(''),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [unique().on(table.id, table.workflowId)]
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
		versionId: integer('version_id'),
		workflowId: integer('workflow_id')
	},
	(table) => [
		foreignKey({
			name: 'workflow_executions_versions_id_workflow_id_fk',
			columns: [table.versionId, table.workflowId],
			foreignColumns: [versions.id, versions.workflowId]
		}).onDelete('cascade')
	]
)

export const executionsRelations = relations(executions, ({ one }) => ({
	version: one(versions, {
		fields: [executions.versionId, executions.workflowId],
		references: [versions.id, versions.workflowId]
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
