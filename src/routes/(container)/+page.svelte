<script lang="ts">
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()

	let user = $derived(page.data.session?.user)
</script>

<div class="mb-4 flex flex-wrap items-center gap-x-20 gap-y-2">
	<h1 class="text-3xl font-semibold">Your workflows</h1>
	{#if user}
		<a href={resolve('/workflows/new')} class="btn btn-success">Create</a>
	{/if}
</div>

{#if user}
	{#if data.total}
		<p class="mb-4">
			You have {data.total} workflow{data.total > 1 ? 's' : ''}.
		</p>

		<ul class="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.workflows as workflow (workflow.id)}
				<li>
					<a href={resolve(`/workflows/${workflow.id}`)}>
						<div
							class="cursor-pointer rounded-xl border border-gray-500 p-8 transition-shadow hover:shadow-lg"
						>
							<h2 class="mb-4 text-xl font-semibold">{workflow.name}</h2>
							<p>
								Created at <time datetime={workflow.createdAt.toISOString()}
									>{workflow.createdAt.toLocaleString()}</time
								>
							</p>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<div class="mb-4 flex flex-wrap items-center gap-4">
			<form>
				<input type="hidden" name="page" value={data.page - 1} />
				<button type="submit" class="btn btn-secondary" disabled={data.page === 1}>&lt;</button>
			</form>
			<span>Page {data.page} of {data.totalPages}</span>
			<form>
				<input type="hidden" name="page" value={data.page + 1} />
				<button class="btn btn-secondary" disabled={data.page === data.totalPages}>&gt;</button>
			</form>
		</div>
	{:else}
		<p class="mb-4">You have no workflows.</p>
	{/if}
{:else}
	<p class="mb-4">You are not logged in. Log in to see your workflows.</p>
{/if}
