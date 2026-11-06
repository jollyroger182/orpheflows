<script lang="ts">
	import { Button } from '$lib/components/ui/button'

	let {
		id,
		name,
		value,
		ondelete
	}: { id: number; name: string; value: string; ondelete: () => unknown } = $props()

	let savedValue = $state(value)
	let currentValue = $state(value)

	let saving = $state(false)

	let dirty = $derived(savedValue === currentValue)

	async function del() {
		if (!confirm('Are you sure you want to delete this variable? This action cannot be undone.')) {
			return
		}
		const resp = await fetch(`/api/variables/${id}`, { method: 'DELETE' })
		if (!resp.ok) {
			const text = await resp.text()
			console.error('Failed to delete variable', text)
			alert('Failed to delete variable. Please check the browser console for details.')
		} else {
			ondelete()
			alert('Deleted variable!')
		}
	}

	async function save() {
		saving = true
		try {
			const resp = await fetch(`/api/variables/${id}`, {
				method: 'PATCH',
				body: JSON.stringify({ value: currentValue }),
				headers: { 'Content-Type': 'application/json' }
			})
			if (!resp.ok) {
				const text = await resp.text()
				console.error('Failed to update variable', text)
				alert('Failed to save variable. Please check the browser console for details.')
			} else {
				const data = await resp.json()
				savedValue = data.value
			}
		} finally {
			saving = false
		}
	}
</script>

<div class="mb-6">
	<p class="mb-2"><span class="font-semibold">Name</span>: {name}</p>
	<p class="mb-4">
		<span class="font-semibold">Value</span>:
		<textarea class="rounded border px-2 py-1" bind:value={currentValue}></textarea>
	</p>
	<div>
		<Button onclick={del} variant="destructive">Delete</Button>
		{#if !dirty}
			<Button onclick={save} disabled={saving}>Save</Button>
		{/if}
	</div>
</div>
