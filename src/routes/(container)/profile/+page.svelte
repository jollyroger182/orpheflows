<script lang="ts">
	import { WORKFLOW_LIMIT_VERIFIED } from '$lib/consts'
	import type { PageProps } from './$types'

	let { data, form }: PageProps = $props()

	let state = $state({ name: '', expiry: '30' })

	function confirmDelete(event: SubmitEvent) {
		if (!confirm('Are you sure you want to delete this token?')) {
			event.preventDefault()
		}
	}
</script>

<h1 class="mb-4 text-3xl font-semibold">Profile</h1>

<div class="mb-4 grid max-w-96 grid-cols-[min-content_1fr] items-baseline gap-4">
	<label for="name" class="font-semibold">Name</label>
	<input
		value={data.session?.user.name}
		id="name"
		placeholder="Your name"
		class="rounded border px-2 py-1 opacity-70"
		disabled
	/>

	<label for="email" class="font-semibold">Email</label>
	<input
		value={data.session?.user.email}
		id="email"
		placeholder="Your email"
		class="rounded border px-2 py-1 opacity-70"
		disabled
	/>
</div>

<p class="mb-4">
	Your name and email are automatically updated whenever you log in to the website.
</p>

<hr class="mb-4" />

<h2 class="mb-4 text-2xl font-semibold">Workflow Limits</h2>

{#if form?.limitMessage}
	<p class="alert alert-success mb-4">{form.limitMessage}</p>
{/if}

{#if form?.limitError}
	<p class="alert alert-danger mb-4">{form.limitError}</p>
{/if}

<p class="mb-4">
	You have a limit of <strong class="font-bold">{data.workflowLimit}</strong> workflows.
</p>

{#if data.limitIncreases.length}
	<p class="mb-4">You can take the following actions to increase your workflow limit:</p>

	<ul class="ms-8 mb-4 list-disc">
		{#each data.limitIncreases as increase (increase)}
			<li class="mb-4">
				{#if increase === 'IDV'}
					<a href="https://auth.hackclub.com" class="underline">Verify your identity on HCA</a> and
					click the button. ID verified users get a limit of
					<strong class="font-bold">{WORKFLOW_LIMIT_VERIFIED}</strong> workflows.
					<form action="?/idv" method="POST" class="inline">
						<button type="submit" class="btn btn-sm btn-secondary">Check IDV status</button>
					</form>
				{:else if increase === 'REQUEST'}
					Message <a href="https://hackclub.enterprise.slack.com/team/U08CJCZ2Z9S" class="underline"
						>@Jolly</a
					> on the Hack Club Slack for an increase. Please make sure you explain why you need the increase
					and how much you want it increased to.
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<hr class="mb-4" />

<h2 class="mb-4 text-2xl font-semibold">API Tokens</h2>

{#if form?.deleteError}
	<p class="alert alert-danger mb-4">{form.deleteError}</p>
{/if}

{#if form?.token}
	<div class="alert alert-success mb-4">
		<p class="mb-4">Your token is: <strong class="font-semibold">{form.token}</strong></p>
		<p>Please save it now. You will never see it again.</p>
	</div>
{/if}

{#if data.tokens.length}
	<ul class="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each data.tokens as token (token.id)}
			<li class=" rounded-xl border border-gray-500 p-8">
				<h4 class="mb-4 text-xl font-semibold">{token.name}</h4>
				<p class="mb-2">
					Created at <time class="font-semibold" datetime={token.createdAt.toISOString()}
						>{token.createdAt.toLocaleString()}</time
					>
				</p>
				<p class="mb-2">
					Last used
					{#if token.lastUsed}
						<time class="font-semibold" datetime={token.lastUsed.toISOString()}
							>{token.lastUsed.toLocaleString()}</time
						>
					{:else}
						<span class="font-semibold">never</span>
					{/if}
				</p>
				<p class="mb-4">
					Expires
					{#if token.expiresAt}
						<time class="font-semibold" datetime={token.expiresAt.toISOString()}
							>{token.expiresAt.toLocaleString()}</time
						>
					{:else}
						<span class="font-semibold">never</span>
					{/if}
				</p>
				<form onsubmit={confirmDelete} action="?/deleteToken" method="POST">
					<input type="hidden" name="id" value={token.id} />
					<button type="submit" class="btn btn-danger">Delete</button>
				</form>
			</li>
		{/each}
	</ul>
{:else}
	<p class="mb-4">You don't have any API tokens.</p>
{/if}

<h3 class="mb-4 text-xl font-semibold">Create a token</h3>

{#if form?.tokenError}
	<p class="alert alert-danger mb-4">{form.tokenError}</p>
{/if}

<form action="?/token" method="POST">
	<div class="mb-4 grid max-w-96 grid-cols-[auto_1fr] items-center gap-4">
		<label for="token-name" class="font-semibold">Name</label>
		<input
			bind:value={state.name}
			id="token-name"
			name="name"
			placeholder="My development token"
			class="rounded border px-2 py-1"
			required
		/>

		<label for="token-expiry" class="font-semibold">Expires in</label>
		<select
			bind:value={state.expiry}
			id="token-expiry"
			name="expiry"
			class="rounded border px-2 py-1.5"
			required
		>
			<option value="30">30 days</option>
			<option value="60">60 days</option>
			<option value="90">90 days</option>
			<option value="0">Never</option>
		</select>
	</div>

	<button class="btn btn-success">Create</button>
</form>
