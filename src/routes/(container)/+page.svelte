<script lang="ts">
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { Button } from '$lib/components/ui/button'
	import * as ButtonGroup from '$lib/components/ui/button-group'
	import * as Empty from '$lib/components/ui/empty'
	import * as Tooltip from '$lib/components/ui/tooltip'
	import { signIn } from '@auth/sveltekit/client'
	import type { PageProps } from './$types'
	import {
		ChevronRightIcon,
		EarthIcon,
		Grid2x2Icon,
		ListIcon,
		LockIcon,
		LockOpenIcon,
		LogInIcon,
		TriangleAlertIcon,
		UnlockIcon,
		WorkflowIcon
	} from '@lucide/svelte'
	import { cn } from '$lib/utils'
	import * as Pagination from '$lib/components/ui/pagination'
	import * as Item from '$lib/components/ui/item'
	import { goto } from '$app/navigation'
	import { WORKFLOWS_PER_PAGE } from '$lib/consts'
	import { persistedState } from '$lib/persisted-state.svelte'

	let { data }: PageProps = $props()

	let user = $derived(page.data.session?.user)

	const display = persistedState(
		'workflows-display',
		'list',
		(value): value is 'list' | 'grid' => value === 'list' || value === 'grid'
	)
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
		<div class="mb-4 flex w-full flex-wrap items-center justify-between gap-y-2">
			<h1 class="text-3xl font-semibold">Your workflows</h1>
			<ButtonGroup.Root>
				<ButtonGroup.Root>
					<Button
						variant="outline"
						class={cn(display.value === 'list' ? 'bg-ctp-surface1!' : '')}
						onclick={() => (display.value = 'list')}
					>
						<span class="sr-only">Show as list</span>
						<ListIcon />
					</Button>
					<Button
						variant="outline"
						class={cn(display.value === 'grid' ? 'bg-ctp-surface1!' : '')}
						onclick={() => (display.value = 'grid')}
					>
						<span class="sr-only">Show as grid</span>
						<Grid2x2Icon />
					</Button>
				</ButtonGroup.Root>
				<ButtonGroup.Root>
					<Button href="/workflows/new">Create</Button>
				</ButtonGroup.Root>
			</ButtonGroup.Root>
		</div>

		<p class="mb-4">
			You have <strong class="bold">{data.total}</strong> workflow{data.total !== 1 ? 's' : ''}.
		</p>

		<Item.Group
			class={cn(
				'mb-4',
				display.value === 'grid'
					? 'grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
					: 'flex flex-col gap-2'
			)}
		>
			{#each data.workflows as workflow (workflow.id)}
				<Item.Root
					variant="outline"
					class={cn(
						'cursor-pointer hover:shadow-sm',
						display.value === 'grid' ? 'items-start p-4' : 'p-3'
					)}
				>
					{#snippet child({ props })}
						<a href={resolve(`/workflows/${workflow.id}`)} {...props}>
							<Item.Content>
								<Item.Title>{workflow.name}</Item.Title>
								<Item.Description>
									Created at <time datetime={workflow.createdAt.toISOString()}
										>{workflow.createdAt.toLocaleString()}</time
									>
								</Item.Description>
							</Item.Content>
							<Item.Actions class={cn(display.value === 'grid' ? 'self-start' : '')}>
								{#if workflow.isPublic}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<EarthIcon class="size-4 text-muted-foreground" />
										</Tooltip.Trigger>
										<Tooltip.Content>Public</Tooltip.Content>
									</Tooltip.Root>
								{/if}
								{#if !workflow.installation}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<TriangleAlertIcon class="size-4 text-ctp-yellow" />
										</Tooltip.Trigger>
										<Tooltip.Content>Not installed</Tooltip.Content>
									</Tooltip.Root>
								{/if}
							</Item.Actions>
						</a>
					{/snippet}
				</Item.Root>
			{/each}
		</Item.Group>

		<Pagination.Root
			count={data.total}
			perPage={WORKFLOWS_PER_PAGE}
			bind:page={
				() => data.page,
				(nextPage) => {
					const searchParams = new URLSearchParams(page.url.searchParams)
					searchParams.set('page', String(nextPage))

					goto(resolve(`/?${searchParams}`))
				}
			}
		>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.Previous />
					</Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link {page} isActive={currentPage === page.value}>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.Next />
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
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
