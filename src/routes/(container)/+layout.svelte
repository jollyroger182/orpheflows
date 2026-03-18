<script lang="ts">
	let { children } = $props()
</script>

<div class="container mx-auto my-4 px-2">
	{@render children()}
</div>
