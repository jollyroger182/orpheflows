<script lang="ts">
	import { resolve } from '$app/paths'
	import { PUBLIC_SLACK_DOMAIN } from '$env/static/public'
	import { WORKFLOW_APP_SCOPES } from '$lib/consts'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()

	const oauthUrl = $derived.by(() => {
		const url = new URL('https://slack.com/oauth/v2/authorize')
		url.searchParams.set('client_id', data.clientId || '')
		url.searchParams.set('scope', WORKFLOW_APP_SCOPES.join(','))
		url.searchParams.set('state', data.clientId || '')
		return url.toString()
	})
</script>

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
	<div class="mb-4 flex gap-2">
		{#if data.isOwner}
			<a href={resolve(`/workflows/${data.workflow.id}/edit`)} class="btn btn-primary">Edit workflow</a>
		{/if}
		<a
			href={`https://${PUBLIC_SLACK_DOMAIN}.slack.com/team/${data.workflow.installation.userId}`}
			class="btn btn-success">Open in Slack</a
		>
	</div>
{:else if data.isOwner}
	<p class="mb-4">
		<a href={oauthUrl} rel="external" class="btn btn-success">Install app</a>
		<span>Your workflow must be installed before you can edit it.</span>
	</p>
{:else}
	<p class="mb-4">The workflow creator hasn't installed the workflow yet.</p>
{/if}
