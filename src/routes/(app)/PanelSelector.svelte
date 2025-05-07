<script>
  // Props
  export let value = "player";
  export let onChange = () => {};
  
  // Default options
  const options = [
    { name: "Player", value: "player" },
    { name: "Player Ship", value: "player_ship" },
    { name: "NPC", value: "npc" },
    { name: "Chat/Log", value: "chat" },
    { name: "Radar", value: "radar" },
    { name: "Warp Map", value: "galaxy" }
  ];
  
  // Handle selection change
  function handleChange(event) {
    value = event.target.value;
    onChange(value);
  }
</script>

<div class="panel-selector">
  <select bind:value on:change={handleChange}>
    {#each options as option}
      <option value={option.value}>{option.name}</option>
    {/each}
  </select>
</div>

<style>
  .panel-selector {
    position: relative;
    display: inline-block;
    margin: 0;
    flex: 1;
  }
  
  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background: transparent;
    border: none;
    font-size: 1.5em;
    font-weight: bold;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    margin: 0;
    color: inherit;
    width: auto;
  }
  
  /* Focus styles */
  select:focus {
    outline: none;
  }
  
  /* Hide dropdown arrow in various browsers */
  select::-ms-expand {
    display: none;
  }
  
  /* Prevent text selection */
  select {
    user-select: none;
    width: 100%;
    text-align: center;
  }

  /* Color the text so it's not light on light */
  select option {
    color: black;
  }
</style>