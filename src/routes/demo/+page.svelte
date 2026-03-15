<script lang="ts">
	import * as Blockly from 'blockly/core'
	import 'blockly/blocks'
	import * as En from 'blockly/msg/en'
	import { onMount } from 'svelte'
	import { javascriptGenerator } from 'blockly/javascript'
	import { signIn, signOut } from '@auth/sveltekit/client'
	import { page } from '$app/state'

	let code = $state('')

	let blocklyContainer: HTMLDivElement
	let workspace: Blockly.WorkspaceSvg

	function serialize() {
		const json = Blockly.serialization.workspaces.save(workspace)
		localStorage.setItem('blocks', JSON.stringify(json))
	}

	function deserialize() {
		const data = localStorage.getItem('blocks')
		if (data) {
			Blockly.serialization.workspaces.load(JSON.parse(data), workspace)
		}
	}

	onMount(() => {
		Blockly.setLocale(En as unknown as Record<string, string>)

		const toolbox: Blockly.utils.toolbox.ToolboxInfo = {
			kind: 'flyoutToolbox',
			contents: [
				{ kind: 'block', type: 'controls_if' },
				{ kind: 'block', type: 'controls_whileUntil' }
			]
		}
		workspace = Blockly.inject(blocklyContainer, { toolbox })
		workspace.addChangeListener(refresh)
	})

	function refresh() {
		code = javascriptGenerator.workspaceToCode(workspace)
	}
</script>

<div class="grid h-screen w-screen grid-cols-2 grid-rows-[min-content_1fr]">
	<div class="col-span-2 flex items-center gap-2 p-2">
		<span>Hello World</span>
		<button onclick={serialize} class="btn btn-primary">Save</button>
		<button onclick={deserialize} class="btn btn-primary">Load</button>
		<span class="flex-1"></span>
		{#if page.data.session?.user}
			{#if page.data.session.user.image}
				<img src={page.data.session.user.image} alt="Profile" class="h-[2em] rounded-full" />
			{/if}
			<button onclick={() => signOut()} class="btn btn-primary">Log out</button>
		{:else}
			<button onclick={() => signIn('slack')} class="btn btn-primary">Log in</button>
		{/if}
	</div>
	<div bind:this={blocklyContainer}></div>
	<div>
		<pre>{code}</pre>
	</div>
</div>
