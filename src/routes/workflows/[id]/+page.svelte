<script lang="ts">
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

<p class="mb-4">{data.workflow.description}</p>

<p class="mb-4">{data.isOwner}, {data.isInstalled}</p>

{#if data.isInstalled}
	<div class="mb-4">
		<button class="btn btn-primary">Open in Slack</button>
	</div>
{:else if data.isOwner}
	<div class="mb-2">
		<a href={oauthUrl} rel="external" class="btn btn-success">Install app</a>
	</div>
	<p class="mb-4">Your workflow must be installed before you can edit it.</p>
{/if}
