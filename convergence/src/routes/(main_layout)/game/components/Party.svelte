<script>
  // Utility
  import { getPath } from '@utils/navigation'
  import { getContext } from 'svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import logger from '@utils/logger';
  
  // Import the new Melt UI Tree builder
  import { Tree } from 'melt/builders';
  
  // Create event dispatcher for character selection
  const dispatch = createEventDispatcher();
  
  // Make sure that data is loaded
  const store = getContext('store');  

  // Party data structure
  let partyData = $state({
    ships: [],
    planets: []
  });
  
  // Convert data to tree items structure
  function buildTreeItems() {
    const items = [];
    
    // Ships parent item
    const shipsItem = {
      id: 'ships',
      value: 'Ships',
      icon: '🚀',
      children: []
    };
    
    // Add each ship as a child
    partyData.ships.forEach(ship => {
      const shipItem = {
        id: `ship-${ship.id}`,
        value: ship.name,
        icon: '🚀',
        metadata: { type: 'ship', data: ship },
        children: []
      };
      
      // Add ship stats
      shipItem.children.push({
        id: `ship-${ship.id}-stats`,
        value: `Stats (HP: ${ship.hp?.current || 0}/${ship.hp?.max || 0})`,
        icon: '📊',
        metadata: { type: 'ship-stats' }
      });
      
      // Add ship shields
      if (ship.shields) {
        shipItem.children.push({
          id: `ship-${ship.id}-shields`,
          value: `Shields: ${ship.shields.current || 0}/${ship.shields.max || 0}`,
          icon: '🛡️',
          metadata: { type: 'ship-shields' }
        });
      }
      
      // Add ship bays
      if (ship.bays && ship.bays.length > 0) {
        const baysItem = {
          id: `ship-${ship.id}-bays`,
          value: 'Bays',
          icon: '📦',
          children: []
        };
        
        ship.bays.forEach(bay => {
          const bayItem = {
            id: `bay-${bay.id}`,
            value: bay.name,
            icon: '📦',
            children: []
          };
          
          if (bay.items && bay.items.length > 0) {
            bay.items.forEach((item, i) => {
              bayItem.children.push({
                id: `bay-item-${bay.id}-${i}`,
                value: item,
                icon: '📎'
              });
            });
          }
          
          baysItem.children.push(bayItem);
        });
        
        shipItem.children.push(baysItem);
      }
      
      // Add ship inventory
      if (ship.inventory && ship.inventory.length > 0) {
        const inventoryItem = {
          id: `ship-${ship.id}-inventory`,
          value: 'Inventory',
          icon: '🧰',
          children: []
        };
        
        ship.inventory.forEach(item => {
          let itemIcon = '🧪';
          if (item.type === 'weapon') itemIcon = '🔫';
          else if (item.type === 'defense') itemIcon = '🛡️';
          
          inventoryItem.children.push({
            id: item.id,
            value: item.name,
            icon: itemIcon
          });
        });
        
        shipItem.children.push(inventoryItem);
      }
      
      // Add ship crew
      if (ship.characters && ship.characters.length > 0) {
        const crewItem = {
          id: `ship-${ship.id}-crew`,
          value: 'Crew',
          icon: '👥',
          children: []
        };
        
        ship.characters.forEach(character => {
          const charItem = {
            id: `character-${character.id}`,
            value: getCharacterTitle(character),
            icon: '👤',
            metadata: { type: 'character', data: character },
            children: []
          };
          
          // Character details
          charItem.children.push({
            id: `character-${character.id}-name`,
            value: `Name: ${character.name}`,
            icon: '📝'
          });
          
          if (character.hp) {
            charItem.children.push({
              id: `character-${character.id}-hp`,
              value: `HP: ${character.hp.current}/${character.hp.max}`,
              icon: '❤️'
            });
          }
          
          // Character inventory
          if (character.equipment) {
            const inventoryItem = {
              id: `character-${character.id}-inventory`,
              value: 'Inventory',
              icon: '🎒',
              children: []
            };
            
            Object.entries(character.equipment).forEach(([slot, item]) => {
              let itemIcon = '🧪';
              if (slot === 'weapon') itemIcon = '🔫';
              else if (slot === 'armor') itemIcon = '🛡️';
              
              inventoryItem.children.push({
                id: `character-${character.id}-equip-${slot}`,
                value: `${slot}: ${item}`,
                icon: itemIcon
              });
            });
            
            charItem.children.push(inventoryItem);
          }
          
          crewItem.children.push(charItem);
        });
        
        shipItem.children.push(crewItem);
      }
      
      shipsItem.children.push(shipItem);
    });
    
    items.push(shipsItem);
    
    // Planets parent item
    const planetsItem = {
      id: 'planets',
      value: 'Planets',
      icon: '🌍',
      children: []
    };
    
    // Add each planet as a child
    partyData.planets.forEach(planet => {
      const planetItem = {
        id: `planet-${planet.id}`,
        value: planet.name,
        icon: '🌍',
        metadata: { type: 'planet', data: planet },
        children: []
      };
      
      // Add planet locations
      if (planet.locations && planet.locations.length > 0) {
        const locationsItem = {
          id: `planet-${planet.id}-locations`,
          value: 'Locations',
          icon: '📍',
          children: []
        };
        
        planet.locations.forEach(location => {
          locationsItem.children.push({
            id: `location-${location.id}`,
            value: location.name,
            icon: '📍',
            metadata: { type: 'location', data: location }
          });
        });
        
        planetItem.children.push(locationsItem);
      }
      
      // Add planet characters
      if (planet.characters && planet.characters.length > 0) {
        const charactersItem = {
          id: `planet-${planet.id}-characters`,
          value: 'Characters',
          icon: '👥',
          children: []
        };
        
        planet.characters.forEach(character => {
          const charItem = {
            id: `character-${character.id}`,
            value: getCharacterTitle(character),
            icon: '👤',
            metadata: { type: 'character', data: character },
            children: []
          };
          
          // Character details
          charItem.children.push({
            id: `character-${character.id}-name`,
            value: `Name: ${character.name}`,
            icon: '📝'
          });
          
          if (character.hp) {
            charItem.children.push({
              id: `character-${character.id}-hp`,
              value: `HP: ${character.hp.current}/${character.hp.max}`,
              icon: '❤️'
            });
          }
          
          // Character inventory
          if (character.equipment) {
            const inventoryItem = {
              id: `character-${character.id}-inventory`,
              value: 'Inventory',
              icon: '🎒',
              children: []
            };
            
            Object.entries(character.equipment).forEach(([slot, item]) => {
              let itemIcon = '🧪';
              if (slot === 'weapon') itemIcon = '🔫';
              else if (slot === 'armor') itemIcon = '🛡️';
              
              inventoryItem.children.push({
                id: `character-${character.id}-equip-${slot}`,
                value: `${slot}: ${item}`,
                icon: itemIcon
              });
            });
            
            charItem.children.push(inventoryItem);
          }
          
          charactersItem.children.push(charItem);
        });
        
        planetItem.children.push(charactersItem);
      }
      
      planetsItem.children.push(planetItem);
    });
    
    items.push(planetsItem);
    
    return items;
  }
  
  // Helper function for character titles
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
  
  // Handle item selection
  function handleItemSelect(id) {
    const allItems = tree.items.flatMap(item => {
      return [item, ...(item.children || []).flatMap(child => {
        return [child, ...(child.children || []).flatMap(grandchild => {
          return [grandchild, ...(grandchild.children || [])];
        })];
      })];
    });
    
    const item = allItems.find(i => i.id === id);
    
    if (item?.metadata?.type === 'character') {
      dispatch('select-character', item.metadata.data);
      logger.debug('party', 'Character selected', item.metadata.data);
    }
  }
  
  // Create the tree
  let treeItems = $state([]);
  
  const tree = new Tree({
    items: () => treeItems,
    expandOnClick: true,
    expanded: ['ships', 'planets']
  });
  
  $effect(() => {
    if (partyData.ships.length || partyData.planets.length) {
      treeItems = buildTreeItems();
    }
  });
  
  onMount(async () => {
    // Load necessary data
    try {
      await Promise.all([
        store.data.game.load_characters(),
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
  });
</script>

<div class="party-panel">
  <div class="party-header">
    <h2>Party Management</h2>
  </div>
  
  <div class="tree-container">
    <div {...tree.root}>
      {#each tree.children as item}
        <div class="tree-item" {...item.root}>
          <button
            {...item.trigger}
            class="tree-row"
            on:click={() => item.trigger.onClick()}
            on:keydown={(e) => item.trigger.onKeyDown(e)}
            class:selected={tree.isSelected(item.id)}
          >
            <span class="expand-icon">
              {#if item.children?.length}
                {tree.isExpanded(item.id) ? '▼' : '►'}
              {/if}
            </span>
            <span class="tree-icon">{item.value.icon}</span>
            <span class="tree-label">{item.value.value}</span>
          </button>
          
          {#if item.children?.length}
            <div class="tree-group" {...item.content}>
              {#each item.children as child}
                <div class="tree-item" {...child.root}>
                  <button
                    {...child.trigger}
                    class="tree-row"
                    on:click={() => {
                      child.trigger.onClick();
                      handleItemSelect(child.id);
                    }}
                    on:keydown={(e) => child.trigger.onKeyDown(e)}
                    class:selected={tree.isSelected(child.id)}
                  >
                    <span class="expand-icon">
                      {#if child.children?.length}
                        {tree.isExpanded(child.id) ? '▼' : '►'}
                      {/if}
                    </span>
                    <span class="tree-icon">{child.value.icon}</span>
                    <span class="tree-label">{child.value.value}</span>
                    {#if child.value.metadata?.type === 'ship' && child.value.metadata.data.hp}
                      <span class="tree-status">
                        HP: {child.value.metadata.data.hp.current}/{child.value.metadata.data.hp.max}
                      </span>
                    {/if}
                  </button>
                  
                  {#if child.children?.length}
                    <div class="tree-group" {...child.content}>
                      {#each child.children as grandchild}
                        <div class="tree-item sub-item" {...grandchild.root}>
                          <button
                            {...grandchild.trigger}
                            class="tree-row"
                            on:click={() => {
                              grandchild.trigger.onClick();
                              handleItemSelect(grandchild.id);
                            }}
                            on:keydown={(e) => grandchild.trigger.onKeyDown(e)}
                            class:selected={tree.isSelected(grandchild.id)}
                          >
                            <span class="expand-icon">
                              {#if grandchild.children?.length}
                                {tree.isExpanded(grandchild.id) ? '▼' : '►'}
                              {/if}
                            </span>
                            <span class="tree-icon">{grandchild.value.icon}</span>
                            <span class="tree-label">{grandchild.value.value}</span>
                          </button>
                          
                          {#if grandchild.children?.length}
                            <div class="tree-group" {...grandchild.content}>
                              {#each grandchild.children as item4}
                                <div class="tree-item sub-item ml-2" {...item4.root}>
                                  <button
                                    {...item4.trigger}
                                    class="tree-row"
                                    on:click={() => {
                                      item4.trigger.onClick();
                                      handleItemSelect(item4.id);
                                    }}
                                    on:keydown={(e) => item4.trigger.onKeyDown(e)}
                                    class:selected={tree.isSelected(item4.id)}
                                  >
                                    <span class="tree-icon">{item4.value.icon}</span>
                                    <span class="tree-label">{item4.value.value}</span>
                                  </button>
                                  
                                  {#if item4.id.includes('-actions')}
                                    <div class="action-buttons">
                                      <button class="action-btn" on:click={() => handleItemSelect(item4.id.replace('-actions', ''))}>
                                        Details
                                      </button>
                                      <button class="action-btn">Transfer</button>
                                    </div>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          {/if}
                          
                          {#if grandchild.id.includes('-actions')}
                            <div class="action-buttons">
                              <button class="action-btn" on:click={() => handleItemSelect(grandchild.id.replace('-actions', ''))}>
                                Details
                              </button>
                              <button class="action-btn">Transfer</button>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
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
  
  .tree-item {
    margin: 2px 0;
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
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
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
  
  .selected {
    background-color: rgba(60, 80, 100, 0.6);
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
    padding: 0 5px 5px 30px;
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
</style> 