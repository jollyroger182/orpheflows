import { pgTable, serial, integer, text, timestamp, unique, foreignKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// workflows

export const workflows = pgTable('workflows', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	blocks: text('blocks'),
	code: text('code').notNull().default(''),
	blocksUpdatedAt: timestamp('blocks_updated_at', { withTimezone: true }).notNull().defaultNow(),
	codeUpdatedAt: timestamp('code_updated_at', { withTimezone: true }).notNull().defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const workflowsRelations = relations(workflows, ({ many }) => ({
	versions: many(versions)
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
