<script lang="ts">
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()

	let isOwner = $derived(data.isOwner)
	let workflow = $derived(data.workflow)
</script>

<h1 class="text-3xl font-semibold mb-4">{workflow.name}</h1>

<p class="mb-4">{workflow.description}</p>

<p class="mb-4">{isOwner}</p>

<button class="btn btn-primary">Open in Slack</button>
