<script lang="ts">
	import { slide } from 'svelte/transition'
	import PersistentVariable from './PersistentVariable.svelte'

	let { open = $bindable(false), id }: { open: boolean; id: number } = $props()

	let variables = $state<{ id: number; name: string; value: string }[]>([])

	$effect(() => {
		if (open) refresh()
	})

	async function refresh() {
		const resp = await fetch(`/api/workflows/${id}/variables`)
		if (!resp.ok) {
			const text = await resp.text()
			console.error('Failed to fetch variables', text)
			alert('Failed to fetch variables for your workflow. See the browser console for details.')
			variables = []
		} else {
			variables = await resp.json()
		}
	}
</script>

{#if open}
	<div
		class="absolute top-0 right-0 bottom-0 w-80 bg-gray-500/25 p-4"
		transition:slide={{ axis: 'x' }}
	>
		<h2 class="mb-4 text-3xl font-semibold">Variables</h2>
		<div class="mb-4">
			<button onclick={refresh} class="btn btn-sm btn-secondary">Refresh</button>
		</div>

		{#if variables.length}
			{#each variables as variable (variable.id)}
				<PersistentVariable {...variable} ondelete={refresh} />
			{/each}
		{/if}
	</div>
{/if}
