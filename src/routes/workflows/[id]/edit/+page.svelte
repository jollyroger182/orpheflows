<script lang="ts">
	import { blocks } from '$lib/blockly/blocks'
	import { generator } from '$lib/blockly/generator'
	import theme from '$lib/blockly/theme'
	import toolbox from '$lib/blockly/toolbox'
	import { onMount } from 'svelte'

	import { beforeNavigate } from '$app/navigation'
	import { register as registerExtensions } from '$lib/blockly/extensions.js'
	import 'blockly/blocks'
	import * as Blockly from 'blockly/core'
	import * as En from 'blockly/msg/en'

	const { data } = $props()

	let code = $state('')

	let blocklyContainer: HTMLDivElement
	let workspace: Blockly.WorkspaceSvg
	let dirty = false

	onMount(() => {
		Blockly.setLocale(En as unknown as Record<string, string>)
		Blockly.common.defineBlocks(blocks)
		registerExtensions()

		workspace = Blockly.inject(blocklyContainer, { toolbox, maxInstances: { trigger: 1 } })
		workspace.setTheme(theme)
		if (data.workflow.blocks) {
			Blockly.serialization.workspaces.load(JSON.parse(data.workflow.blocks), workspace)
		}
		ensureTrigger()
		disableDisconnected()
		workspace.addChangeListener(checkDisconnectBlock)
		workspace.addChangeListener(generateCode)
		setTimeout(() => workspace.addChangeListener(checkSetDirty), 1)
		generateCode()
	})

	function generateCode() {
		code = generator.workspaceToCode(workspace)
	}

	function ensureTrigger() {
		const triggers = workspace.getBlocksByType('trigger', false)
		if (!triggers.length) {
			const trigger = workspace.newBlock('trigger')
			trigger.initSvg()
			trigger.render()
			trigger.moveBy(20, 20)
		}
	}

	// disable disconnected blocks

	function checkDisconnectBlock(event: Blockly.Events.Abstract) {
		if (!(event instanceof Blockly.Events.BlockMove) || !event.blockId) return

		const block = workspace.getBlockById(event.blockId)
		if (!block) return

		const disabled = block.getRootBlock().type !== 'trigger'
		setStackDisabled(block, disabled)
	}

	function disableDisconnected() {
		for (const block of workspace.getTopBlocks(false)) {
			setStackDisabled(block, block.type !== 'trigger')
		}
	}

	function setStackDisabled(block: Blockly.Block, disabled: boolean) {
		block.setDisabledReason(disabled, 'connected to trigger')
		const next = block.nextConnection?.targetBlock()
		if (next) setStackDisabled(next, disabled)
	}

	// dirty check

	function checkSetDirty(event: Blockly.Events.Abstract) {
		if (
			[
				Blockly.Events.BLOCK_MOVE as string,
				Blockly.Events.BLOCK_CHANGE,
				Blockly.Events.BLOCK_CREATE,
				Blockly.Events.BLOCK_DELETE,
				Blockly.Events.BLOCK_DRAG
			].includes(event.type)
		) {
			console.log(event)
			dirty = true
		}
	}

	async function checkDirty(event: BeforeUnloadEvent) {
		if (!dirty) return
		event.preventDefault()
		event.returnValue = 'Your workflow is not saved. Are you sure you want to leave?'
		return 'Your workflow is not saved. Are you sure you want to leave?'
	}

	beforeNavigate(({ cancel }) => {
		if (!dirty) return
		if (!confirm('Your workflow is not saved. Are you sure you want to leave?')) cancel()
	})

	// button actions

	async function onSave() {
		const blocks = JSON.stringify(Blockly.serialization.workspaces.save(workspace))
		const code = generator.workspaceToCode(workspace)

		const resp = await fetch('/priv-api/save', {
			method: 'POST',
			body: JSON.stringify({ id: data.workflow.id, blocks, code }),
			headers: { 'Content-Type': 'application/json' }
		})
		if (!resp.ok) {
			console.error('Failed to save workflow', await resp.text())
			alert('Failed to save workflow. See console for more details.')
		} else {
			alert('Workflow saved!')
		}
	}

	async function onPublish() {
		if (
			!confirm(
				'Are you sure you want to publish this workflow? This will save the current code and cause all future workflow runs to use this version.'
			)
		)
			return

		const blocks = JSON.stringify(Blockly.serialization.workspaces.save(workspace))
		const code = generator.workspaceToCode(workspace)

		const resp = await fetch('/priv-api/publish', {
			method: 'POST',
			body: JSON.stringify({ id: data.workflow.id, blocks, code }),
			headers: { 'Content-Type': 'application/json' }
		})
		if (!resp.ok) {
			console.error('Failed to publish workflow', await resp.text())
			alert('Failed to publish workflow. See console for more details.')
		} else {
			alert('Workflow successfully published!')
		}
	}
</script>

<svelte:window onbeforeunload={checkDirty} />

<div class="grid h-full grid-cols-2 grid-rows-[auto_1fr]">
	<div class="col-span-2 flex items-center gap-2 px-4 py-2">
		<span class="text-lg">{data.workflow.name}</span>
		<button onclick={onSave} class="btn btn-sm btn-secondary">Save</button>
		<button onclick={onPublish} class="btn btn-sm btn-success">Publish</button>
	</div>

	<div bind:this={blocklyContainer} class="h-full"></div>
	<pre class="text-wrap">{code}</pre>
</div>
