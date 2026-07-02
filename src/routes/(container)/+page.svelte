<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { Button } from '$lib/components/ui/button'
	import * as Empty from '$lib/components/ui/empty'
	import { signIn } from '@auth/sveltekit/client'
	import type { PageProps } from './$types'
	import { LogInIcon, WorkflowIcon } from '@lucide/svelte'

	let { data }: PageProps = $props()

	let user = $derived(page.data.session?.user)
</script>

{#if user}
	{#if data.workflows.length === 0}
		<Empty.Root class="py-20">
			<Empty.Header>
				<Empty.Media variant="icon">
					<WorkflowIcon />
				</Empty.Media>
				<Empty.Title>No Workflows</Empty.Title>
				<Empty.Description>You haven't created any workflows yet.</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button href="/workflows/new">Create</Button>
			</Empty.Content>
		</Empty.Root>
	{:else}
		<div class="mb-4 flex flex-wrap items-center gap-x-20 gap-y-2">
			<h1 class="text-3xl font-semibold">Your workflows</h1>
			<Button onclick={() => goto(resolve('/workflows/new'))}>Create</Button>
		</div>

		<p class="mb-4">
			You have <strong class="bold">{data.total}</strong> workflow{data.total !== 1 ? 's' : ''}.
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
				<Button type="submit" variant="outline" disabled={data.page <= 1}>&lt;</Button>
			</form>
			<span>Page {data.page} of {data.totalPages}</span>
			<form>
				<input type="hidden" name="page" value={data.page + 1} />
				<Button variant="outline" disabled={data.page >= data.totalPages}>&gt;</Button>
			</form>
		</div>
	{/if}
{:else}
	<Empty.Root class="py-20">
		<Empty.Header>
			<Empty.Media variant="icon">
				<LogInIcon />
			</Empty.Media>
			<Empty.Title>You are not logged in</Empty.Title>
			<Empty.Description>Log in to see and create workflows.</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button onclick={() => signIn('slack')}>Login</Button>
		</Empty.Content>
	</Empty.Root>
{/if}
