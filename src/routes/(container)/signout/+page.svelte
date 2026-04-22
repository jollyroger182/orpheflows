<script lang="ts">
	import { resolve } from '$app/paths'
	import { signOut } from '@auth/sveltekit/client'
	import { onMount } from 'svelte'

	onMount(async () => {
		await signOut({ redirectTo: resolve('/') })
	})
</script>
