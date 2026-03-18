<script lang="ts">
	let {
		action,
		button,
		name = $bindable(),
		description = $bindable()
	}: { action?: string; button: string; name?: string; description?: string } = $props()
</script>

<form method="POST" {action}>
	<div class="mb-4 grid max-w-96 grid-cols-[min-content_1fr] items-center gap-4">
		<label for="new-workflow-name" class="font-semibold">Name</label>
		<input
			bind:value={name}
			id="new-workflow-name"
			name="name"
			placeholder="Channel joiner"
			class="rounded border px-2 py-1"
			required
		/>

		<label for="new-workflow-desc" class="font-semibold">Description</label>
		<input
			bind:value={description}
			id="new-workflow-desc"
			name="description"
			placeholder="A brand new workflow"
			class="rounded border px-2 py-1"
			required
		/>
	</div>

	<button class="btn btn-success" type="submit">{button}</button>
</form>
