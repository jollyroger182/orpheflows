<script lang="ts">
	import { onMount } from 'svelte'
	import swagger from '$lib/assets/swagger.yaml'
	import 'swagger-ui-dist/swagger-ui.css'
	import { SwaggerUIBundle } from 'swagger-ui-dist'

	let swaggerDiv: HTMLDivElement

	onMount(() => {
		console.log(swagger)
		SwaggerUIBundle({
			domNode: swaggerDiv,
			spec: swagger
		})
	})
</script>

<div bind:this={swaggerDiv}></div>
