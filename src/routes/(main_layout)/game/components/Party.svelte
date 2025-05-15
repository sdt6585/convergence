<script>
  // Utility
  import { getPath } from '@utils/navigation'
  import { getContext } from 'svelte';
  import { onMount } from 'svelte';
  // Components
  // import { TreeView } from '@components/TreeView.svelte'

  let tree = $state(null)

  // Make sure that data is loaded
  const store = getContext('store');  

  //Get all the player_characters
  const player_characters = $derived(() => {
    return store.data.characters.filter(character => character.player_id);
  });

  // Group the characters
  let primary = $state([]);
  let primaryShips = $state([])
  let secondary = $state({ships: [], planets: []});

  // Artificial mockup - figure it out later
  let data = {
    primary: {
      ships: [
        {
          id: 1,
          name: 'Rocinante',
          characters: [
            {
              id: 1, 
              name: 'Saitama', 
              is_primary: true, 
              player_id: 1, 
              player: {id: 1, name: 'Stephen'}
            },
            {
              id: 2, 
              name: 'Luffy D. Monkey', 
              is_primary: true, 
              player_id: 2, 
              player: {id: 2, name: 'Scott'}
            },
            {
              id: 3, 
              name: 'Saitama', 
              is_primary: true, 
              player_id: 3, 
              player: {id: 3, name: 'Willow'}
            }
          ]
        }
      ],
      planets: [
        {
          id: 1,
          name: 'Earth',
          characters: [
            {
              id: 4, 
              name: 'Saitama', 
              is_primary: true, 
              player_id: 4, 
              player: {id: 4, name: 'Nicole'}
            }
          ]
        }
      ]
    },
    secondary: {
      ships: [],
      planets: [
        {
          id: 1,
          name: 'Earth',
          characters: [
            {
              id: 4, 
              name: 'Saitama', 
              is_primary: true, 
              player_id: 4, 
              player: {id: 4, name: 'Nicole'}
            }
          ]
        }
      ]
    }
  }
    
  // });
  $effect(() => {
    // for (let character of store.data.characters) {
    //   if (character.is_primary) {
    //     let exists = primary.find(c => c.id = character.id);
    //     if (!exists) {
    //       primary.push()
    //     }
    //   }
    // }
    // primary = store.data.characters.filter((character => character.is_primary));
    // primaryShips = primary.map(character => store.data.ships.find(ship => ship.id === character.ship_id));
    console.log('ships', $state.snapshot(store.data.ships));
    // for (let character of store.data.characters) {
    //   if (character.is_primary) {
    //     let ship = store.data.ships.find(ship => ship.id === character.ship_id);
    //     debugger;
    //     if (!primary.ships.includes(ship)) {
    //       primary.ships.push(ship);
    //     }
    //     let planet = store.data.ships.find(ship => ship.id === character.planet_id);
    //   } else {
    //     let ship = store.data.ships.find(ship => ship.id === character.ship_id);
    //     if (!secondary.ships.includes(ship)) {
    //       primary.ships.push(ship);
    //     }
    //   }
    // }
  });
  
  onMount(async () => {
    // Load data
    // await store.load_players();
    await Promise.all([
      store.data.game.load_characters((query) => {
        query.not('player_id', 'is', null)
      }),
      store.data.game.load_ships(),
      store.data.game.load_planets(),
      store.data.game.load_players()
    ]);
    
    // Unmount general listeners
    return () => {
    };
  });
</script>

<div>
  {#if store.data.players_loading || store.data.characters_loading || store.data.ships_loading || store.data.planets_loading }
    <h1 class="loading">Loading...</h1>
  {:else}
    <h2>Primary:</h2>
    {#each data.primary.ships as ship}
      <div class="location-group">
        <h3>* {ship.name}</h3>
        <ul>
          {#each ship.characters as character}
            <li>* {character.name} ({character.player.name})</li>
          {/each}
        </ul>
      </div>
    {/each}
    
    {#each data.primary.planets as planet}
      <div class="location-group">
        <h3>* {planet.name}</h3>
        <ul>
          {#each planet.characters as character}
            <li>* {character.name} ({character.player.name})</li>
          {/each}
        </ul>
      </div>
    {/each}
    
    {#if data.secondary.ships.length > 0 || data.secondary.planets.length > 0}
      <h2>Secondary:</h2>
      {#if data.secondary.ships.length}{#each data.secondary.ships as ship}
        <div class="location-group">
          <h3>* {ship.name}</h3>
          <ul>
            {#each ship.characters as character}
              <li>* {character.name} ({character.player.name})</li>
            {/each}
          </ul>
        </div>
      {/each}{/if}
      
      {#if data.secondary.planets.length > 0}{#each data.secondary.planets as planet}
        <div class="location-group">
          <h3>* {planet.name}</h3>
          <ul>
            <ul>
              {#each planet.characters as character}
                <li>* {character.name} ({character.player.name})</li>
              {/each}
            </ul>
          </ul>
        </div>
      {/each}{/if}
    {/if}
  {/if}
</div>

<style>
  ul {
    display: list;
  }

  li {
    display: list-item;
  }
  
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