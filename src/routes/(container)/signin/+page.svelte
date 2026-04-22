<script lang="ts">
	import { resolve } from '$app/paths'
	import { signIn } from '@auth/sveltekit/client'
	import { onMount } from 'svelte'

	onMount(async () => {
		await signIn('slack', { redirectTo: resolve('/') })
	})
</script>

<p>Please wait as we sign you in...</p>
