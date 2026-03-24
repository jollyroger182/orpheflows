<script lang="ts">
	import { blocks } from '$lib/blockly/blocks'
	import { register as registerExtensions } from '$lib/blockly/extensions'
	import { generator } from '$lib/blockly/generator'
	import theme, * as themes from '$lib/blockly/theme'
	import toolbox from '$lib/blockly/toolbox'

	import { beforeNavigate } from '$app/navigation'
	import 'blockly/blocks'
	import * as Blockly from 'blockly/core'
	import * as En from 'blockly/msg/en'
	import { mode } from 'mode-watcher'
	import { onMount } from 'svelte'
	import { resolve } from '$app/paths'

	const { data } = $props()

	let code = $state('')
	let hasEditorTrigger = $state(data.hasEditorTrigger)

	let blocklyContainer: HTMLDivElement
	let workspace: Blockly.WorkspaceSvg
	let dirty = false

	onMount(() => {
		Blockly.setLocale(En as unknown as Record<string, string>)
		Blockly.common.defineBlocks(blocks)
		registerExtensions()

		workspace = Blockly.inject(blocklyContainer, { toolbox })
		if (!data.isOwner) workspace.setIsReadOnly(true)
		workspace.setTheme(theme)
		if (data.workflow.blocks) {
			Blockly.serialization.workspaces.load(JSON.parse(data.workflow.blocks), workspace)
		}
		ensureTrigger()
		disableDisconnected()
		workspace.addChangeListener(checkDisconnectBlock)
		workspace.addChangeListener(generateCode)
		setTimeout(() => workspace.addChangeListener(checkSetDirty), 100)
		generateCode()
	})

	$effect(() => {
		workspace.setTheme(themes[mode.current || 'light'])
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
		if (
			!(event instanceof Blockly.Events.BlockMove || event instanceof Blockly.Events.BlockCreate) ||
			!event.blockId
		)
			return

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
				Blockly.Events.BLOCK_DELETE
			].includes(event.type)
		) {
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
			dirty = false
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
			dirty = false
			alert('Workflow successfully published!')
			const data = await resp.json()
			hasEditorTrigger = data.hasEditorTrigger
		}
	}

	async function onRun() {
		const resp = await fetch('/priv-api/editor-trigger', {
			method: 'POST',
			body: JSON.stringify({ id: data.workflow.id }),
			headers: { 'Content-Type': 'application/json' }
		})
		if (!resp.ok) {
			const text = await resp.text()
			console.error('Failed to run workflow', text)
			try {
				const result = JSON.parse(text)
				if ('message' in result) {
					alert(result.message)
				} else {
					throw ''
				}
			} catch {
				alert('Failed to run workflow. See console for more details.')
			}
		} else {
			alert('Workflow successfully executed!')
		}
	}
</script>

<svelte:window onbeforeunload={checkDirty} />

<div class="grid h-full grid-cols-2 grid-rows-[auto_1fr]">
	<div class="col-span-2 flex items-center gap-2 px-4 py-2">
		<a href={resolve(`/workflows/${data.workflow.id}`)} class="text-lg">{data.workflow.name}</a>
		{#if data.isOwner}
			<button onclick={onSave} class="btn btn-sm btn-secondary">Save</button>
			<button onclick={onPublish} class="btn btn-sm btn-success">Publish</button>
		{/if}
		<span class="flex-1"></span>
		{#if data.isOwner && hasEditorTrigger}
			<button onclick={onRun} class="btn btn-sm btn-success">Run</button>
		{/if}
	</div>

	<div bind:this={blocklyContainer} class={`h-full ${data.dev ? '' : 'col-span-2'}`}></div>
	{#if data.dev}
		<pre class="text-wrap">{code}</pre>
	{/if}
</div>
