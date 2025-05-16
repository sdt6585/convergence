<script>
  // Utility
  import { getPath } from '@utils/navigation'
  import { getContext } from 'svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import logger from '@utils/logger';
  // Components
  // import { TreeView } from '@components/TreeView.svelte'

  let treeData = $state(null)

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
  
  // MeltUI Tree component
  import { createTreeView } from '@melt-ui/svelte';
  
  // Create event dispatcher for character selection
  const dispatch = createEventDispatcher();
  
  // Set up tree view
  const {
    elements: { tree, item, group },
    states: { expanded, selectedItem },
    helpers: { isExpanded, isSelected }
  } = createTreeView({
    defaultExpanded: ['ships', 'planets']
  });
  
  // Party data structure
  let partyData = $state({
    ships: [],
    planets: []
  });
  
  // Helper functions for the tree view
  function handleSelectCharacter(character) {
    dispatch('select-character', character);
    logger.debug('party', 'Character selected', character);
  }
  
  function expandInventory(entityId, entityType) {
    const currentExpanded = $expanded;
    const inventoryId = `${entityType}-${entityId}-inventory`;
    
    if (currentExpanded.includes(inventoryId)) {
      $expanded = currentExpanded.filter(id => id !== inventoryId);
    } else {
      $expanded = [...currentExpanded, inventoryId];
    }
  }
  
  function getCharacterTitle(character) {
    if (!character) return 'Unknown Character';
    
    let title = character.name || 'Unnamed Character';
    
    if (character.player && character.player.name) {
      title += ` (${character.player.name}`;
      
      if (character.hp) {
        title += ` - ${character.hp.current}/${character.hp.max} hp`;
      }
      
      title += ')';
    }
    
    return title;
  }
  
  onMount(async () => {
    // Load necessary data
    try {
      await Promise.all([
        store.data.game.load_characters((query) => {
          query.is('player_id', 'is', null);
        }),
        store.data.game.load_ships(),
        store.data.game.load_planets(),
        store.data.game.load_players()
      ]);
      
      // Structure the data for the tree view
      let ships = store.data.game.ships || [];
      let planets = store.data.game.planets || [];
      let characters = store.data.game.characters || [];
      let players = store.data.game.players || [];
      
      // Add mock hp data since it's not in the schema yet
      characters = characters.map(char => ({
        ...char,
        hp: { current: Math.floor(Math.random() * 90) + 10, max: 100 },
        player: players.find(p => p.id === char.player_id) || null
      }));
      
      // Group characters by their location
      ships = ships.map(ship => ({
        ...ship,
        characters: characters.filter(char => char.ship_id === ship.id) || [],
        inventory: [
          { id: `item-${Math.random()}`, name: 'Pulse Rifle', type: 'weapon' },
          { id: `item-${Math.random()}`, name: 'Shield Generator', type: 'defense' },
          { id: `item-${Math.random()}`, name: 'Medkit', type: 'utility' }
        ],
        hp: { current: 800, max: 1000 },
        shields: { current: 1500, max: 2000 },
        bays: [
          { id: 'bay-1', name: 'Cargo Bay', items: ['Trade Goods', 'Spare Parts'] },
          { id: 'bay-2', name: 'Medical Bay', items: ['Auto-Doc', 'Med Supplies'] },
          { id: 'bay-3', name: 'Engineering Bay', items: ['Repair Drones', 'Engine Parts'] }
        ]
      }));
      
      planets = planets.map(planet => ({
        ...planet,
        characters: characters.filter(char => char.planet_id === planet.id) || [],
        locations: [
          { id: 'loc-1', name: 'City Center', description: 'Urban hub with shops and services' },
          { id: 'loc-2', name: 'Outskirts', description: 'Sparse settlements on the city edge' }
        ]
      }));
      
      partyData = { ships, planets };
      
    } catch (error) {
      logger.error('party', 'Error loading party data', error);
    }

    // Unmount general listeners
    return () => {
      logger.log('party', 'Unmounting party');
    };
  });
</script>

<div class="party-panel">
  <div class="party-header">
    <h2>Party Management</h2>
  </div>
  
  <div class="tree-container">
    <div use:treeData>
      <!-- Ships Section -->
      <div use:item={{ id: 'ships' }}>
        <div class="tree-row">
          <span class="expand-icon">{$isExpanded('ships') ? '▼' : '►'}</span>
          <span class="tree-icon">🚀</span>
          <span class="tree-label">Ships</span>
        </div>
      </div>
      
      <div use:group={{ id: 'ships' }}>
        {#each partyData.ships as ship}
          <div use:item={{ id: `ship-${ship.id}` }}>
            <div class="tree-row">
              <span class="expand-icon">{$isExpanded(`ship-${ship.id}`) ? '▼' : '►'}</span>
              <span class="tree-icon">🚀</span>
              <span class="tree-label">{ship.name}</span>
              <span class="tree-status">HP: {ship.hp.current}/{ship.hp.max}</span>
            </div>
          </div>
          
          <div use:group={{ id: `ship-${ship.id}` }}>
            <!-- Ship attributes section -->
            <div use:item={{ id: `ship-${ship.id}-stats` }}>
              <div class="tree-row sub-item attribute-item">
                <span class="tree-icon">📊</span>
                <span class="tree-label">Stats</span>
              </div>
            </div>
            
            <!-- Ship shields section -->
            <div use:item={{ id: `ship-${ship.id}-shields` }}>
              <div class="tree-row sub-item attribute-item">
                <span class="tree-icon">🛡️</span>
                <span class="tree-label">Shields: {ship.shields.current}/{ship.shields.max}</span>
              </div>
            </div>
            
            <!-- Ship bays section -->
            <div use:item={{ id: `ship-${ship.id}-bays` }}>
              <div class="tree-row">
                <span class="expand-icon">{$isExpanded(`ship-${ship.id}-bays`) ? '▼' : '►'}</span>
                <span class="tree-icon">📦</span>
                <span class="tree-label">Bays</span>
              </div>
            </div>
            
            <div use:group={{ id: `ship-${ship.id}-bays` }}>
              {#each ship.bays as bay}
                <div use:item={{ id: `bay-${bay.id}` }}>
                  <div class="tree-row sub-item">
                    <span class="expand-icon">{$isExpanded(`bay-${bay.id}`) ? '▼' : '►'}</span>
                    <span class="tree-icon">📦</span>
                    <span class="tree-label">{bay.name}</span>
                  </div>
                </div>
                
                <div use:group={{ id: `bay-${bay.id}` }}>
                  {#each bay.items as item, i}
                    <div use:item={{ id: `bay-item-${bay.id}-${i}` }}>
                      <div class="tree-row sub-item ml-2">
                        <span class="tree-icon">📎</span>
                        <span class="tree-label">{item}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/each}
            </div>
            
            <!-- Ship inventory section -->
            <div use:item={{ id: `ship-${ship.id}-inventory` }}>
              <div class="tree-row">
                <span class="expand-icon">{$isExpanded(`ship-${ship.id}-inventory`) ? '▼' : '►'}</span>
                <span class="tree-icon">🧰</span>
                <span class="tree-label">Inventory</span>
              </div>
            </div>
            
            <div use:group={{ id: `ship-${ship.id}-inventory` }}>
              {#each ship.inventory as item}
                <div use:item={{ id: item.id }}>
                  <div class="tree-row sub-item">
                    <span class="tree-icon">
                      {#if item.type === 'weapon'}🔫
                      {:else if item.type === 'defense'}🛡️
                      {:else}🧪{/if}
                    </span>
                    <span class="tree-label">{item.name}</span>
                  </div>
                </div>
              {/each}
            </div>
            
            <!-- Ship crew section -->
            <div use:item={{ id: `ship-${ship.id}-crew` }}>
              <div class="tree-row">
                <span class="expand-icon">{$isExpanded(`ship-${ship.id}-crew`) ? '▼' : '►'}</span>
                <span class="tree-icon">👥</span>
                <span class="tree-label">Crew</span>
              </div>
            </div>
            
            <div use:group={{ id: `ship-${ship.id}-crew` }}>
              {#each ship.characters as character}
                <div use:item={{ id: `character-${character.id}` }}
                     on:click={() => handleSelectCharacter(character)}
                     class:selected={$selectedItem === `character-${character.id}`}>
                  <div class="tree-row sub-item character-item">
                    <span class="expand-icon">{$isExpanded(`character-${character.id}`) ? '▼' : '►'}</span>
                    <span class="tree-icon">👤</span>
                    <span class="tree-label">{getCharacterTitle(character)}</span>
                  </div>
                </div>
                
                <div use:group={{ id: `character-${character.id}` }}>
                  <!-- Character name -->
                  <div use:item={{ id: `character-${character.id}-name` }}>
                    <div class="tree-row sub-item ml-2 attribute-item">
                      <span class="tree-icon">📝</span>
                      <span class="tree-label">Name: {character.name}</span>
                    </div>
                  </div>
                  
                  <!-- Character HP -->
                  <div use:item={{ id: `character-${character.id}-hp` }}>
                    <div class="tree-row sub-item ml-2 attribute-item">
                      <span class="tree-icon">❤️</span>
                      <span class="tree-label">HP: {character.hp.current}/{character.hp.max}</span>
                    </div>
                  </div>
                  
                  <!-- Character inventory -->
                  <div use:item={{ id: `character-${character.id}-inventory` }}>
                    <div class="tree-row sub-item ml-2">
                      <span class="expand-icon">{$isExpanded(`character-${character.id}-inventory`) ? '▼' : '►'}</span>
                      <span class="tree-icon">🎒</span>
                      <span class="tree-label">Inventory</span>
                    </div>
                  </div>
                  
                  <div use:group={{ id: `character-${character.id}-inventory` }}>
                    <!-- We'll show equipped items when expanded -->
                    {#if character.equipment}
                      {#each Object.entries(character.equipment) as [slot, item]}
                        <div use:item={{ id: `character-${character.id}-equip-${slot}` }}>
                          <div class="tree-row sub-item ml-3">
                            <span class="tree-icon">
                              {#if slot === 'weapon'}🔫
                              {:else if slot === 'armor'}🛡️
                              {:else}🧪{/if}
                            </span>
                            <span class="tree-label">{slot}: {item}</span>
                          </div>
                        </div>
                      {/each}
                    {:else}
                      <div use:item={{ id: `character-${character.id}-empty-inventory` }}>
                        <div class="tree-row sub-item ml-3">
                          <span class="tree-label">No equipment</span>
                        </div>
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Character actions -->
                  <div use:item={{ id: `character-${character.id}-actions` }}>
                    <div class="tree-row sub-item ml-2">
                      <div class="action-buttons">
                        <button class="action-btn" on:click={() => handleSelectCharacter(character)}>Details</button>
                        <button class="action-btn">Transfer</button>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Planets Section -->
      <div use:item={{ id: 'planets' }}>
        <div class="tree-row">
          <span class="expand-icon">{$isExpanded('planets') ? '▼' : '►'}</span>
          <span class="tree-icon">🌍</span>
          <span class="tree-label">Planets</span>
        </div>
      </div>
      
      <div use:group={{ id: 'planets' }}>
        {#each partyData.planets as planet}
          <div use:item={{ id: `planet-${planet.id}` }}>
            <div class="tree-row">
              <span class="expand-icon">{$isExpanded(`planet-${planet.id}`) ? '▼' : '►'}</span>
              <span class="tree-icon">🌍</span>
              <span class="tree-label">{planet.name}</span>
            </div>
          </div>
          
          <div use:group={{ id: `planet-${planet.id}` }}>
            <!-- Planet locations section -->
            <div use:item={{ id: `planet-${planet.id}-locations` }}>
              <div class="tree-row">
                <span class="expand-icon">{$isExpanded(`planet-${planet.id}-locations`) ? '▼' : '►'}</span>
                <span class="tree-icon">📍</span>
                <span class="tree-label">Locations</span>
              </div>
            </div>
            
            <div use:group={{ id: `planet-${planet.id}-locations` }}>
              {#each planet.locations as location}
                <div use:item={{ id: `location-${location.id}` }}>
                  <div class="tree-row sub-item">
                    <span class="tree-icon">📍</span>
                    <span class="tree-label">{location.name}</span>
                  </div>
                </div>
              {/each}
            </div>
            
            <!-- Planet characters section -->
            <div use:item={{ id: `planet-${planet.id}-characters` }}>
              <div class="tree-row">
                <span class="expand-icon">{$isExpanded(`planet-${planet.id}-characters`) ? '▼' : '►'}</span>
                <span class="tree-icon">👥</span>
                <span class="tree-label">Characters</span>
              </div>
            </div>
            
            <div use:group={{ id: `planet-${planet.id}-characters` }}>
              {#each planet.characters as character}
                <div use:item={{ id: `character-${character.id}` }}
                     on:click={() => handleSelectCharacter(character)}
                     class:selected={$selectedItem === `character-${character.id}`}>
                  <div class="tree-row sub-item character-item">
                    <span class="expand-icon">{$isExpanded(`character-${character.id}`) ? '▼' : '►'}</span>
                    <span class="tree-icon">👤</span>
                    <span class="tree-label">{getCharacterTitle(character)}</span>
                  </div>
                </div>
                
                <div use:group={{ id: `character-${character.id}` }}>
                  <!-- Character name -->
                  <div use:item={{ id: `character-${character.id}-name` }}>
                    <div class="tree-row sub-item ml-2 attribute-item">
                      <span class="tree-icon">📝</span>
                      <span class="tree-label">Name: {character.name}</span>
                    </div>
                  </div>
                  
                  <!-- Character HP -->
                  <div use:item={{ id: `character-${character.id}-hp` }}>
                    <div class="tree-row sub-item ml-2 attribute-item">
                      <span class="tree-icon">❤️</span>
                      <span class="tree-label">HP: {character.hp.current}/{character.hp.max}</span>
                    </div>
                  </div>
                  
                  <!-- Character inventory -->
                  <div use:item={{ id: `character-${character.id}-inventory` }}>
                    <div class="tree-row sub-item ml-2">
                      <span class="expand-icon">{$isExpanded(`character-${character.id}-inventory`) ? '▼' : '►'}</span>
                      <span class="tree-icon">🎒</span>
                      <span class="tree-label">Inventory</span>
                    </div>
                  </div>
                  
                  <div use:group={{ id: `character-${character.id}-inventory` }}>
                    <!-- We'll show equipped items when expanded -->
                    {#if character.equipment}
                      {#each Object.entries(character.equipment) as [slot, item]}
                        <div use:item={{ id: `character-${character.id}-equip-${slot}` }}>
                          <div class="tree-row sub-item ml-3">
                            <span class="tree-icon">
                              {#if slot === 'weapon'}🔫
                              {:else if slot === 'armor'}🛡️
                              {:else}🧪{/if}
                            </span>
                            <span class="tree-label">{slot}: {item}</span>
                          </div>
                        </div>
                      {/each}
                    {:else}
                      <div use:item={{ id: `character-${character.id}-empty-inventory` }}>
                        <div class="tree-row sub-item ml-3">
                          <span class="tree-label">No equipment</span>
                        </div>
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Character actions -->
                  <div use:item={{ id: `character-${character.id}-actions` }}>
                    <div class="tree-row sub-item ml-2">
                      <div class="action-buttons">
                        <button class="action-btn" on:click={() => handleSelectCharacter(character)}>Details</button>
                        <button class="action-btn">Transfer</button>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .party-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px;
    overflow-y: auto;
    color: #e0e0e0;
  }
  
  .party-header {
    border-bottom: 1px solid #444;
    margin-bottom: 15px;
  }
  
  .party-header h2 {
    margin: 0 0 10px 0;
  }
  
  .tree-container {
    flex: 1;
    overflow-y: auto;
  }
  
  .tree-row {
    display: flex;
    align-items: center;
    padding: 5px 8px;
    border-radius: 4px;
    margin: 2px 0;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .tree-row:hover {
    background-color: rgba(80, 80, 80, 0.3);
  }
  
  .expand-icon {
    width: 16px;
    height: 16px;
    margin-right: 4px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .tree-icon {
    margin-right: 8px;
  }
  
  .tree-label {
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  
  .tree-status {
    font-size: 0.85em;
    opacity: 0.8;
    margin-left: 8px;
  }
  
  .sub-item {
    padding-left: 24px;
  }
  
  .ml-2 {
    margin-left: 16px;
  }
  
  .ml-3 {
    margin-left: 24px;
  }
  
  .attribute-item {
    opacity: 0.9;
    font-size: 0.95em;
  }
  
  .character-item {
    border-radius: 4px;
  }
  
  .character-item:hover,
  .character-item.selected {
    background-color: rgba(80, 80, 80, 0.5);
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    padding: 4px 8px;
    font-size: 0.8em;
    background-color: rgba(60, 60, 60, 0.8);
    border: 1px solid #555;
    border-radius: 3px;
    cursor: pointer;
    color: #e0e0e0;
  }
  
  .action-btn:hover {
    background-color: rgba(80, 80, 80, 0.9);
  }
  
  .selected {
    background-color: rgba(60, 80, 100, 0.6);
  }
</style>