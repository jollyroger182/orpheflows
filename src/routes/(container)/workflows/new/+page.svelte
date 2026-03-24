<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import WorkflowForm from '$lib/components/WorkflowForm.svelte'
	import { onMount } from 'svelte'

	let { data, form } = $props()

	onMount(async () => {
		if (data.reachedLimit) {
			alert(
				'You have reached the maximum number of workflows. Please check your profile page for how to increase this limit.'
			)
			await goto(resolve('/'))
		}
	})
</script>

<h1 class="mb-4 text-3xl font-semibold">Create workflow</h1>

{#if form?.error}
	<p class="mb-4 text-red-500">{form.error}</p>
{/if}

<p class="mb-4">You can always edit these details later.</p>

<WorkflowForm button="Create" />
