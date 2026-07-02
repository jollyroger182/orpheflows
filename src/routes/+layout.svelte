<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import favicon from '$lib/assets/favicon.svg'
	import { signIn, signOut } from '@auth/sveltekit/client'

	import './layout.css'
	import { ModeWatcher } from 'mode-watcher'
	import { Button } from '$lib/components/ui/button'
	import * as Avatar from '$lib/components/ui/avatar'
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
	import * as Tooltip from '$lib/components/ui/tooltip'

	let { children } = $props()

	let user = $derived(page.data.session?.user)
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ModeWatcher lightClassNames={['latte']} darkClassNames={['dark', 'mocha']} />

<Tooltip.Provider>
	<header class="flex items-center gap-2 border-b bg-card px-4 py-2">
		<a href={resolve('/')}><span class="text-2xl">Orpheflows</span></a>

		<span class="flex-1"></span>

		{#if user}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Avatar.Root {...props}>
							<Avatar.Image src={user.image} />
							<Avatar.Fallback>{user.name?.charAt(0)}</Avatar.Fallback>
						</Avatar.Root>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content collisionPadding={8}>
					<DropdownMenu.Group>
						<DropdownMenu.Label>{user.name}</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							onclick={() => {
								goto(resolve('/profile'))
							}}>Profile</DropdownMenu.Item
						>
						<DropdownMenu.Item
							onclick={() => {
								signOut()
								goto(resolve('/'))
							}}>Log out</DropdownMenu.Item
						>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{:else}
			<Button onclick={() => signIn('slack')} variant="outline">Log in</Button>
		{/if}
	</header>

	{@render children()}
</Tooltip.Provider>
