import {
	convertUserToPublic,
	convertUserToSelf,
	convertVariableToSelf,
	convertVersionToPublic,
	convertVersionToSelf,
	convertWorkflowToPublic,
	convertWorkflowToSelf
} from '$lib/server/convert'
import { Users, Variables, Workflows } from '$lib/server/services'
import { RpcTarget } from 'capnweb'

export class RPCSession extends RpcTarget implements RPC.PublicAPI {
	async getWorkflow(id: number): Promise<BasicWorkflow | null> {
		const workflow = await Workflows.getWorkflow({ id })
		if (workflow) return new BasicWorkflow(workflow)
		return null
	}

	async getUser(id: string): Promise<BasicUser | null> {
		const user = await Users.get({ id })
		if (user) return new BasicUser(user)
		return null
	}

	async authorize(apiToken: string): Promise<AuthorizedAPI> {
		const token = await Users.getUserToken({ token: apiToken })
		if (!token) throw new Error('Token expired or invalid')
		return new AuthorizedAPI(token.user)
	}
}

class AuthorizedAPI extends RpcTarget implements RPC.AuthorizedAPI {
	constructor(private user: DB.User) {
		super()
	}

	async getMe(): Promise<User> {
		return new User(this.user)
	}
}

// workflows

class BasicWorkflow extends RpcTarget implements RPC.BasicWorkflow {
	constructor(protected workflow: DB.WorkflowWithAuthor) {
		super()
	}

	async refresh(): Promise<void> {
		const workflow = await Workflows.getWorkflow({ id: this.workflow.id })
		if (!workflow) throw new Error('Workflow has been deleted')
		this.workflow = workflow
	}

	async getDetails(): Promise<Schemas.PublicWorkflow> {
		return convertWorkflowToPublic(this.workflow)
	}

	async getVersions(): Promise<BasicVersion[]> {
		if (!this.workflow.isPublic) throw new Error('Workflow is not public')
		const versions = await Workflows.getVersions({ id: this.workflow.id })
		return versions.map((v) => new BasicVersion(this.workflow, v))
	}

	async getLatestVersion(): Promise<BasicVersion | null> {
		if (!this.workflow.isPublic) throw new Error('Workflow is not public')
		const version = await Workflows.getLatestVersion({ id: this.workflow.id })
		if (version) return new BasicVersion(this.workflow, version)
		return null
	}
}

class Workflow extends BasicWorkflow implements RPC.Workflow {
	constructor(
		workflow: DB.WorkflowWithAuthor,
		protected user: DB.User
	) {
		super(workflow)
	}

	async getFullDetails(): Promise<Schemas.SelfWorkflow> {
		return convertWorkflowToSelf(this.workflow)
	}

	async getFullVersions(): Promise<RPC.Version[]> {
		const versions = await Workflows.getVersions({ id: this.workflow.id })
		return versions.map((v) => new Version(this.workflow, v, this.user))
	}

	async getFullLatestVersion(): Promise<RPC.Version | null> {
		const version = await Workflows.getLatestVersion({ id: this.workflow.id })
		if (version) return new Version(this.workflow, version, this.user)
		return null
	}

	async getVariables(): Promise<RPC.Variable[]> {
		const workflow = await Variables.getAllByWorkflow(this.workflow.id)
		if (!workflow) return []
		return workflow.variables.map((v) => new Variable(this.workflow, v, this.user))
	}

	async updateDetails({ name, description }: { name: string; description: string }): Promise<void> {
		await Workflows.setDetails({ id: this.workflow.id, name, description, userId: this.user.id })
	}

	async updateCode({ code, blocks }: { code: string; blocks: string | null }): Promise<void> {
		Object.assign(
			this.workflow,
			await Workflows.setCode({
				id: this.workflow.id,
				code,
				blocks: blocks || undefined,
				userId: this.user.id
			})
		)
	}

	async setPublic(isPublic: boolean): Promise<void> {
		Object.assign(
			this.workflow,
			await Workflows.setPublic({ id: this.workflow.id, public: isPublic, userId: this.user.id })
		)
	}

	async publish(): Promise<RPC.Version> {
		const result = await Workflows.publishVersion({
			id: this.workflow.id,
			blocks: this.workflow.blocks || undefined,
			code: this.workflow.code,
			userId: this.user.id
		})
		if (!result) throw new Error('Publishing version failed')
		Object.assign(this.workflow, result.workflow)
		return new Version(this.workflow, result.version, this.user)
	}
}

// versions

class BasicVersion extends RpcTarget implements RPC.BasicVersion {
	constructor(
		protected workflow: DB.Workflow,
		protected version: DB.Version
	) {
		super()
	}

	async refresh(): Promise<void> {
		const version = await Workflows.getVersion({ id: this.version.id })
		if (!version) throw new Error('Version has been deleted')
		this.version = version
	}

	async getDetails(): Promise<Schemas.PublicVersion> {
		return convertVersionToPublic(this.version)
	}
}

class Version extends BasicVersion implements RPC.Version {
	constructor(
		workflow: DB.Workflow,
		version: DB.Version,
		protected user: DB.User
	) {
		super(workflow, version)
	}

	async getFullDetails(): Promise<Schemas.SelfVersion> {
		return convertVersionToSelf(this.version)
	}
}

// variables

class Variable extends RpcTarget implements RPC.Variable {
	constructor(
		protected workflow: DB.WorkflowWithAuthor,
		protected variable: DB.Variable,
		protected user: DB.User
	) {
		super()
	}

	async getDetails(): Promise<Schemas.Variable> {
		return convertVariableToSelf(this.variable)
	}

	async update(value: string): Promise<void> {
		Object.assign(
			this.variable,
			await Variables.setById({ id: this.variable.id, value, userId: this.user.id })
		)
	}

	async delete(): Promise<void> {
		await Variables.deleteById({ id: this.variable.id, userId: this.user.id })
	}
}

// users

class BasicUser extends RpcTarget implements RPC.BasicUser {
	constructor(protected user: DB.User) {
		super()
	}

	async refresh(): Promise<void> {
		const user = await Users.get({ id: this.user.id })
		if (!user) throw new Error('User has been deleted')
		this.user = user
	}

	async getDetails(): Promise<Schemas.PublicUser> {
		return convertUserToPublic(this.user)
	}

	async getWorkflows({
		offset = 0,
		limit = 10
	}: {
		offset?: number
		limit?: number
	} = {}): Promise<RPC.BasicWorkflow[]> {
		const workflows = await Workflows.getWorkflows({ offset, limit, authorId: this.user.id })
		return workflows.map((w) => new BasicWorkflow(w))
	}
}

class User extends BasicUser implements RPC.User {
	async getFullDetails(): Promise<Schemas.SelfUser> {
		return convertUserToSelf(this.user)
	}

	async getFullWorkflows({
		offset = 0,
		limit = 10
	}: {
		offset?: number
		limit?: number
	} = {}): Promise<Workflow[]> {
		const workflows = await Workflows.getWorkflows({ offset, limit, authorId: this.user.id })
		return workflows.map((w) => new Workflow(w, this.user))
	}
}
