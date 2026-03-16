<h1 class="mb-4 text-3xl font-semibold">Create workflow</h1>

<p class="mb-4">You can always edit these details later.</p>

<form method="POST">
	<div class="mb-4 grid max-w-96 grid-cols-[min-content_1fr] items-center gap-4">
		<label for="new-workflow-name" class="font-semibold">Name</label>
		<input
			id="new-workflow-name"
			name="name"
			placeholder="Channel joiner"
			class="rounded border px-2 py-1"
			required
		/>

		<label for="new-workflow-desc" class="font-semibold">Description</label>
		<input
			id="new-workflow-desc"
			name="description"
			placeholder="A brand new workflow"
			class="rounded border px-2 py-1"
			required
		/>
	</div>

	<button class="btn btn-success" type="submit">Create</button>
</form>
