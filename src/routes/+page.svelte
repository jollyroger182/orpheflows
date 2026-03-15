<script lang="ts">
	import { page } from '$app/state'
	import { signIn, signOut } from '@auth/sveltekit/client'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()

	let user = $derived(page.data.session?.user)
</script>

<header class="flex items-center gap-2 bg-blue-100 px-8 py-2">
	<span class="text-2xl">Orpheflows</span>

	<span class="flex-1"></span>

	{#if user}
		<img
			src={user.image}
			alt="Profile"
			title={`Logged in as: ${user.name}`}
			class="inline h-[2em] rounded-full"
		/>
		<button onclick={() => signOut()} class="btn btn-secondary">Log out</button>
	{:else}
		<button onclick={() => signIn('slack')} class="btn btn-secondary">Log in</button>
	{/if}
</header>

<div class="container mx-auto my-4">
	<h1 class="mb-4 text-3xl font-semibold">Your workflows</h1>
	{#if user}
		{#if data.workflows.length}
			you have {data.workflows.length} workflows
		{:else}
			you have no workflows
		{/if}
	{:else}
		you are not logged in
	{/if}
</div>
