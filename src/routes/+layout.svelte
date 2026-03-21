<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import favicon from '$lib/assets/favicon.svg'
	import { signIn, signOut } from '@auth/sveltekit/client'

	import './layout.css'
	import { ModeWatcher } from 'mode-watcher'

	let { children } = $props()

	let user = $derived(page.data.session?.user)
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ModeWatcher />

<header class="flex items-center gap-2 bg-blue-100 px-4 py-2 dark:bg-blue-950">
	<a href={resolve('/')}><span class="text-2xl">Orpheflows</span></a>

	<span class="flex-1"></span>

	{#if user}
		<a href={resolve('/profile')}>
			{#if user.image}
				<img
					src={user.image}
					alt={user.name}
					title={`Logged in as: ${user.name}`}
					class="inline h-[2em] rounded-full"
				/>
			{:else}
				<span>{user.name}</span>
			{/if}
		</a>
		<button
			onclick={() => {
				signOut()
				goto(resolve('/'))
			}}
			class="btn btn-secondary">Log out</button
		>
	{:else}
		<button onclick={() => signIn('slack')} class="btn btn-secondary">Log in</button>
	{/if}
</header>

{@render children()}
