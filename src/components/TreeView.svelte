<script>
  // Add an exported function to make it a valid component
  export function toggleTree() {
    expanded = !expanded;
  }

  let {
    tree,
    expanded  = false
  } = $props();

  tree.children = tree.children || [];

	const toggleExpansion = () => {
		expanded = !expanded;
	}
</script>

<ul>
	<li>
		{#if tree.children}
			<span on:click={toggleExpansion}>
				<span class="arrow, arrowDown={expanded}">&#x25b6</span>
				{tree.label}
			</span>
			{#if expanded}
				{#each tree.children as child}
					<svelte:self tree={child} />
				{/each}
			{/if}
		{:else}
			<span>
				<span class="no-arrow"/>
				{tree.label}
			</span>
		{/if}
	</li>
</ul>

<style>
	ul {
		margin: 0;
		list-style: none;
		padding-left: 1.2rem; 
		user-select: none;
	}
	.no-arrow { padding-left: 1.0rem; }
	.arrow {
		cursor: pointer;
		display: inline-block;
		/* transition: transform 200ms; */
	}
	.arrowDown { transform: rotate(90deg); }
</style>
