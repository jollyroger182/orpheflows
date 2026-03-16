<script lang="ts">
	import { blocks } from '$lib/blockly/blocks'
	import { generator } from '$lib/blockly/generator'
	import theme from '$lib/blockly/theme'
	import toolbox from '$lib/blockly/toolbox'
	import { onMount } from 'svelte'

	import 'blockly/blocks'
	import * as Blockly from 'blockly/core'
	import * as En from 'blockly/msg/en'

	let code = $state('')

	let blocklyContainer: HTMLDivElement
	let workspace: Blockly.WorkspaceSvg

	onMount(() => {
		Blockly.setLocale(En as unknown as Record<string, string>)
		Blockly.common.defineBlocks(blocks)

		workspace = Blockly.inject(blocklyContainer, { toolbox })
		workspace.setTheme(theme)
		workspace.addChangeListener(onWorkspaceChanged)
	})

	function onWorkspaceChanged() {
		code = generator.workspaceToCode(workspace)
	}
</script>

<div class="grid h-full grid-cols-2">
	<div bind:this={blocklyContainer} class="h-full"></div>
	<pre class="text-wrap">{code}</pre>
</div>
