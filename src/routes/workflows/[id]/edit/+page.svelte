<script lang="ts">
	import * as Blockly from 'blockly/core'
	import * as En from 'blockly/msg/en'
	import 'blockly/blocks'
	import { onMount } from 'svelte'
	import { generator } from '$lib/blockly/generator'
	import { blocks } from '$lib/blockly/blocks'

	let code = $state('')

	let blocklyContainer: HTMLDivElement
	let workspace: Blockly.WorkspaceSvg

	onMount(() => {
		Blockly.setLocale(En as unknown as Record<string, string>)
		Blockly.common.defineBlocks(blocks)

		workspace = Blockly.inject(blocklyContainer, {
			toolbox: {
				kind: 'flyoutToolbox',
				contents: [
					{ kind: 'block', type: 'logic_boolean' },
					{ kind: 'block', type: 'test_block' },
					{ kind: 'block', type: 'controls_if' }
				]
			}
		})

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
