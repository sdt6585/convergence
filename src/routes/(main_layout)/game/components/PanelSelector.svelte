<script>
  // Props
  let {
    value = 'player',
    name = 'Player',
    onChange = () => {}
  } = $props();
  
  // Default options
  const options = [
    { name: "Player", value: "player" },
    { name: "Party", value: "party" },
    { name: "NPC", value: "npc" },
    { name: "Chat/Log", value: "chat" },
    { name: "Radar", value: "radar" },
    { name: "Warp Map", value: "galaxy" }
  ];
  
  // Handle selection change
  function handleChange(event) {
    debugger;
    value = event.target.value;
    name = event.target.selectedOptions[0].innerText;
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
    border-bottom: 1px solid #333;
    background-color: rgba(100, 100, 100, .2)
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
    padding: 5px;
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