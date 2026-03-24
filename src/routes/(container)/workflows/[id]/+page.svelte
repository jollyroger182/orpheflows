<script lang="ts">
	import { resolve } from '$app/paths'
	import { PUBLIC_SLACK_DOMAIN } from '$env/static/public'
	import WorkflowForm from '$lib/components/WorkflowForm.svelte'
	import { WORKFLOW_APP_SCOPES } from '$lib/consts'
	import type { PageProps } from './$types'

	let { data, form }: PageProps = $props()

	let showDetailsForm = $state(false)

	let deleteForm: HTMLFormElement | undefined = $state()
	let publicForm: HTMLFormElement | undefined = $state()
	let publicMode = $state('public')

	const oauthUrl = $derived.by(() => {
		const url = new URL('https://slack.com/oauth/v2/authorize')
		url.searchParams.set('client_id', data.clientId || '')
		url.searchParams.set('scope', WORKFLOW_APP_SCOPES.join(','))
		url.searchParams.set('state', data.clientId || '')
		return url.toString()
	})

	function confirmDelete() {
		if (
			confirm(
				'This action cannot be undone and will delete and uninstall the workflow. Are you sure you want to delete it?'
			)
		) {
			deleteForm?.submit()
		}
	}

	function onMakePrivate() {
		if (
			confirm(
				'Are you sure you want to make this workflow private? Other people cannot view this workflow then.'
			)
		) {
			publicMode = 'private'
			setTimeout(() => publicForm?.submit(), 0)
		}
	}

	function onMakePublic() {
		if (
			confirm(
				'Are you sure you want to make this workflow public? Anyone can view the blocks and code of public workflows.'
			)
		) {
			publicMode = 'public'
			setTimeout(() => publicForm?.submit(), 0)
		}
	}
</script>

{#if form?.message}
	<p class="alert alert-success">{form.message}</p>
{/if}

{#if form?.error}
	<p class="alert alert-danger">{form.error}</p>
{/if}

<h1 class="mb-4 text-3xl font-semibold">{data.workflow.name}</h1>

<p class="mb-4 flex items-center gap-2">
	{#if data.workflow.author.photo_url}
		<img
			src={data.workflow.author.photo_url}
			alt="Profile of author"
			class="inline h-[1.5em] rounded-full"
		/>
	{/if}
	<a
		href={`https://${PUBLIC_SLACK_DOMAIN}.slack.com/team/${data.workflow.author.id}`}
		target="_blank"
		rel="external"
		class="font-bold">{data.workflow.author.name}</a
	>
	<span>·</span>
	<span
		>Created at <time datetime={data.workflow.createdAt.toISOString()}
			>{data.workflow.createdAt.toLocaleString()}</time
		></span
	>
</p>

<p class="mb-4">{data.workflow.description}</p>

{#if data.workflow.installation}
	<div class="mb-4 flex flex-wrap gap-2">
		{#if data.isOwner}
			<button onclick={() => (showDetailsForm = !showDetailsForm)} class="btn btn-secondary"
				>Edit details</button
			>
			<a href={resolve(`/workflows/${data.workflow.id}/edit`)} class="btn btn-primary"
				>Edit workflow</a
			>
		{:else if data.workflow.isPublic}
			<a href={resolve(`/workflows/${data.workflow.id}/edit`)} class="btn btn-primary"
				>View workflow</a
			>
		{/if}
		<a
			href={`https://${PUBLIC_SLACK_DOMAIN}.slack.com/team/${data.workflow.installation.userId}`}
			class="btn btn-success">Open in Slack</a
		>
		{#if data.canRun}
			<form method="POST" action="?/run">
				<button type="submit" class="btn btn-success">Run workflow</button>
			</form>
		{/if}
		{#if data.isOwner}
			<button onclick={confirmDelete} class="btn btn-danger">Delete workflow</button>
		{/if}
	</div>
{:else if data.isOwner}
	<p class="mb-4 flex flex-wrap items-center gap-2">
		<button onclick={confirmDelete} class="btn btn-danger">Delete workflow</button>
		<a href={oauthUrl} rel="external" class="btn btn-success">Install workflow</a>
		<span>Your workflow must be installed before you can edit it.</span>
	</p>
{:else}
	<p class="mb-4">The workflow creator hasn't installed the workflow yet.</p>
{/if}

{#if showDetailsForm}
	<div class="mb-4">
		<WorkflowForm
			action="?/edit"
			button="Save"
			name={data.workflow.name}
			description={data.workflow.description}
		/>
	</div>
	{#if data.workflow.isPublic}
		<button onclick={onMakePrivate} class="btn btn-secondary">Make private</button>
	{:else}
		<button onclick={onMakePublic} class="btn btn-secondary">Make public</button>
	{/if}
	<form method="POST" action="?/public" bind:this={publicForm}>
		<input type="hidden" bind:value={publicMode} name="mode" />
	</form>
{/if}

{#if data.isOwner}
	<form method="POST" action="?/delete" bind:this={deleteForm}></form>
{/if}
