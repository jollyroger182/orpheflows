<script lang="ts">
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()

	let user = $derived(page.data.session?.user)
</script>

<div class="mb-4 flex items-center gap-20">
	<h1 class="text-3xl font-semibold">Your workflows</h1>
	<a href={resolve('/workflows/new')} class="btn btn-success">Create</a>
</div>
{#if user}
	{#if data.workflows.length}
		you have {data.workflows.length} workflows
	{:else}
		you have no workflows
	{/if}
{:else}
	you are not logged in
{/if}
