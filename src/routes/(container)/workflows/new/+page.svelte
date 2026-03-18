<script lang="ts">
	import WorkflowForm from '$lib/components/WorkflowForm.svelte'

	let { form } = $props()
</script>

<h1 class="mb-4 text-3xl font-semibold">Create workflow</h1>

{#if form?.error}
	<p class="mb-4 text-red-500">{form.error}</p>
{/if}

<p class="mb-4">You can always edit these details later.</p>

<WorkflowForm button="Create" />
