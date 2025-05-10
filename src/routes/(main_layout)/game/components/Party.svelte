<script>
  // Utility
  import { getPath } from '@utils/navigation'
  import { getContext } from 'svelte';
  import { onMount } from 'svelte';
  // Components
  // import { TreeView } from '@components/TreeView.svelte'

  let tree = $state(null)

  // Make sure that data is loaded
  onMount(async () => {
    // Load data
    // await store.load_players();
    await Promise.all([
      store.load_characters(),
      store.load_ships(),
      store.load_planets(),
      store.load_players(),
    ]);
    
    // Unmount general listeners
    return () => {
    };
  });
  const store = getContext('store');  

  //Format and group things into a tree structure
  // $effect(() => {
  //   //Find where all the player-characters are
  //   let locations = [];
  //   for (let player of store.data.players) {
  //     for (let pc of player.player_character) {
  //       let character = pc.character;
  //       console.log(character.name);
  //       if (character.ship_id) {
  //         let ship = this.data.ships.find(ship => ship.id === character.ship_id)
  //         if (ship) {
  //           ship.active = ship.active || 
  //           locations.push(ship);
  //         }
  //       }
  //     }
  //   }
    
  // });
</script>

<div>
  {#if store.data.players_loading}
    <h1 class="loading">Loading...</h1>
  {:else}
    <h2>Active Party</h2>
    <ul>
    {#each store.data.players as player}
      {#each player.player_character as pc}
        {#if pc.is_primary}
          <li>{pc.character.name}</li>
        {/if}
      {/each}
    {/each}
    </ul>
    <h2>Inactive Party</h2>
    <ul>
      {#each store.data.players as player}
        {#each player.player_character as pc}
          {#if !pc.is_primary}
            <li>{pc.character.name}</li>
          {/if}
        {/each}
      {/each}
      </ul>
  {/if}
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