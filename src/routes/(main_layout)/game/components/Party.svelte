<script>
  // Utility
  import { getContext } from 'svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import logger from '@utils/logger';
  
  // Create event dispatcher for character selection
  const dispatch = createEventDispatcher();
  
  // Make sure that data is loaded
  const store = getContext('store');  

  // Utility function to build the tree structure
  function buildLocationTree(treeData = []) {
    const locationMap = new Map(); // To track which locations we've added to the tree
    
    // Get all player characters (non-NPCs) and sort by primary status
    const playerCharacters = store.data.characters
      .filter(char => char.is_npc === false)
      .sort((a, b) => {
        // Sort primary characters first
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return 0;
      });
    
    // Group by location
    for (const character of playerCharacters) {
      // Determine if character is on a ship or planet
      let location, locationType;
      
      if (character.ship_id) {
        location = store.data.ships.find(s => s.id === character.ship_id);
        locationType = 'ship';
      } else if (character.planet_id) {
        location = store.data.planets.find(p => p.id === character.planet_id);
        locationType = 'planet';
      } else {
        // Character has no location, skip or add to special "unknown" group
        continue;
      }
      
      if (!location) continue; // Skip if location not found
      
      // Create locationKey to identify this location in our map
      const locationKey = `${locationType}-${location.id}`;
      
      // If this location isn't in our tree yet, add it
      if (!locationMap.has(locationKey)) {
        const locationNode = {
          item: location,
          type: locationType,
          children: [],
          expanded: true
        };
        treeData.push(locationNode);
        locationMap.set(locationKey, locationNode);
      }

      // Build the skill categories and expansion states
      const skillCategories = character.getSkillsByCategory();
      const skillsChipsExpanded = {};
      for (const cat of skillCategories) {
        skillsChipsExpanded[cat.name] = false; // or true for default expanded
      }
      
      // Add character to the appropriate location's children with separate expansion states
      locationMap.get(locationKey).children.push({
        item: character,
        expanded: false,
        // expanded: true,
        statsExpanded: false,
        skillsExpanded: false,
        // skillsExpanded: true,
        abilitiesExpanded: false,
        equipmentExpanded: false,
        skillsChipsExpanded: skillsChipsExpanded
      });
    }
    
    return treeData;
  }

  let data = $state([]);

  onMount(async () => {
    // Load necessary data
    try {
      await Promise.all([
        store.data.game.load_characters(),
        store.load_stats(),
        store.load_skills()
      ]);

      logger.debug('app', 'Data here', store.data.skills);

      // Build the location tree
      data = buildLocationTree(data);
      
    } catch (error) {
      logger.error('party', 'Error loading party data', error);
    }
  });
</script>

<div class="party-panel">
  <div class="tree-container">
    {#each data as locationNode}
      <div class="tree-item">
        <button class="tree-row" onclick={() => locationNode.expanded = !locationNode.expanded}>
          <span class="expandable-name {locationNode.expanded ? 'expanded-name' : ''}">{locationNode.item.name}</span>
          {#if locationNode.type === 'ship'}
            <span class="stats">
              HP: {locationNode.item.current_hp}/{locationNode.item.max_hp}
              Shields: {locationNode.item.current_shields}/{locationNode.item.max_shields}
            </span>
          {/if}
        </button>

        {#if locationNode.expanded}
          <div class="children">
            {#if locationNode.children && locationNode.children.length > 0}
              {#each locationNode.children as characterNode}
                <div class="character-item">
                  <button 
                    class="tree-row"
                    onclick={() => characterNode.expanded = !characterNode.expanded}
                  >
                    <span class="expandable-name {characterNode.expanded ? 'expanded-name' : ''}">
                      {characterNode.item.name} - ({characterNode.item.race.name})
                      <span class="stats">
                        HP: {characterNode.item.current_hp}/{characterNode.item.max_hp}
                      </span>
                    </span>
                  </button>
                  
                  <div class="children">
                    {#if characterNode.expanded}
                        <button class="tree-row" onclick={() => characterNode.statsExpanded = !characterNode.statsExpanded}>
                          <span class="expandable-name {characterNode.statsExpanded ? 'expanded-name' : ''}">
                            <span class="section-header">Stats</span>
                          </span>
                        </button>
                        {#if characterNode.statsExpanded}
                          <ul class="character-attributes children">
                            <li class="stat">INT: {characterNode.item.intelligence}</li>
                            <li class="stat">DEX: {characterNode.item.dexterity}</li>
                            <li class="stat">STR: {characterNode.item.strength}</li>
                            <li class="stat">CHA: {characterNode.item.charisma}</li>
                            <li class="stat">INT: {characterNode.item.intuition}</li>
                            <li class="stat">LCK: {characterNode.item.luck}</li>
                            <li class="stat">CON: {characterNode.item.constitution}</li>
                          </ul>
                        {/if}
                        
                        <button class="tree-row" onclick={() => characterNode.skillsExpanded = !characterNode.skillsExpanded}>
                          <span class="expandable-name {characterNode.skillsExpanded ? 'expanded-name' : ''}">
                            <span class="section-header">Skills</span>
                          </span>
                        </button>
                        {#if characterNode.skillsExpanded}
                          <!-- Skill Chips Section (Grouped by Category, Collapsible) -->
                          <ul class="character-attributes children">
                            <!-- Get skills by category with core skills first -->
                            {#each characterNode.item.getSkillsByCategory({ useArrayFormat: true, separateCoreSkills: true }) as category}
                              <li class="skill-category">
                                <span class="category-name">{category.name}</span>
                                <ul class="children">
                                  {#each category.skills as skill}
                                    <li class="skill {category.name === 'Core' ? 'core-skill' : ''}">
                                      <div class="skill-header">
                                        <span class="skill-name">{skill.name}: {skill.level}</span>
                                        <span class="skill-progress-text">
                                          {#if skill.level < 10}
                                            {skill.rolls_to_next_level} more to level {skill.level + 1}
                                          {:else}
                                            Max level
                                          {/if}
                                        </span>
                                      </div>
                                      <div class="skill-progress-bar">
                                        <div class="skill-progress" style="width: {100 * (skill.progress_this_level / skill.next_level_rolls_required)}%"></div>
                                      </div>                                      
                                    </li>
                                  {/each}
                                </ul>
                              </li>
                            {/each}
                          </ul>
                        {/if}
                        <button class="tree-row" onclick={() => characterNode.abilitiesExpanded = !characterNode.abilitiesExpanded}>
                          <span class="expandable-name {characterNode.abilitiesExpanded ? 'expanded-name' : ''}">
                            <span class="section-header">Abilities</span>
                          </span>
                        </button>
                        {#if characterNode.abilitiesExpanded}
                          <ul class="character-attributes children">
                            {#each characterNode.item.abilities.children as ability}
                              <li class="skill">{ability.name}: {ability.description}</li>
                            {/each}
                          </ul>
                        {/if}

                        <button class="tree-row" onclick={() => characterNode.equipmentExpanded = !characterNode.equipmentExpanded}>
                          <span class="expandable-name {characterNode.equipmentExpanded ? 'expanded-name' : ''}">
                            <span class="section-header">Equipment</span>
                          </span>
                        </button>
                        {#if characterNode.equipmentExpanded}
                          <ul class="character-attributes children">
                            {#each characterNode.item.equipment.children as item}
                              <li class="equipment-item">
                                <span class="equipment-name">{item.name}</span>
                                <span class="equipment-type">({item.type})</span>
                                {#if item.type === 'weapon'}
                                  <span class="equipment-stat">DMG: {item.damage}, Range: {item.range}</span>
                                {:else if item.type === 'armor'}
                                  <span class="equipment-stat">Protection: {item.protection}</span>
                                {:else if item.type === 'shield'}
                                  <span class="equipment-stat">Capacity: {item.capacity}, Recharge: {item.recharge}</span>
                                {:else if item.type === 'tool'}
                                  <span class="equipment-stat">{item.functionality}</span>
                                {:else if item.type === 'cybernetic'}
                                  <span class="equipment-stat">{item.ability}</span>
                                {:else if item.type === 'drone'}
                                  <span class="equipment-stat">{item.utility}</span>
                                {/if}
                              </li>
                            {/each}
                          </ul>
                        {/if}
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

  <style>
    .expandable-name {
      width: 100%;
    }

    .expandable-name::before {
      content: "▶";
      transform: rotate(0deg);
      display: inline-block;
      margin-right: 4px;
      transition: transform 0.2s;
      font-size: .9rem;
    }
    
    .expanded-name:before {
      transform: rotate(90deg);
    }
    
    .character-name {
      margin-left: 8px;
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
    
    .children {
      margin-left: 20px;
    }
    
    .section-header {
      font-weight: bold;
      margin: 8px 0 4px 0;
      color: #999;
    }

    .character-attributes {
      margin-left: 16px;
    }

    .stats {
      margin-left: 12px;
      font-size: 0.9em;
      color: #999;
    }
    
    .character-attributes {
      padding: 2px 8px;
      color: #999;
      list-style-type: none;
    }

    .character-attributes li {
       padding-left:10px;
   }

    .character-attributes li::marker {
       content: "-";
   }

   .skill-header {
    display: flex;
    justify-content: space-between;
    width: 100%;
   }

   .core-skill {
      font-weight: bold;
   }
    
  .skill-progress-bar {
    height: 4px;
    width: 100%;
    background-color: rgba(80, 80, 80, 0.3);
    border-radius: 2px;
    margin-top: 2px;
  }
  
  .skill-progress {
    height: 100%;
    background-color: #4a9;
    border-radius: 2px;
  }
  
  .equipment-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .equipment-item {
    padding: 2px 8px;
    color: #999;
  }
  
  .equipment-name {
    font-weight: bold;
  }
  
  .equipment-type {
    font-style: italic;
    margin-left: 4px;
  }
  
  .equipment-stat {
    display: block;
    margin-left: 12px;
    font-size: 0.9em;
  }

  .party-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0;
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
  
  .sub-item {
    padding-left: 24px;
  }
  
  .selected {
    background-color: rgba(60, 80, 100, 0.6);
  }

  .skill-category {
    font-weight: bold;
    color: #aaa;
    margin-top: 8px;
  }
  
  .category-name {
    display: block;
    margin-bottom: 4px;
    color: #bbb;
    text-transform: uppercase;
    font-size: 0.9em;
    letter-spacing: 0.5px;
  }

  .skill-progress-text {
    display: block;
    font-size: 0.8em;
    color: #777;
    margin-top: 2px;
    margin-left: 8px;
  }
  
  .core-skill {
    font-weight: bold;
    color: #ddd;
  }
  
  .skill-progress-bar {
    height: 4px;
    width: 100%;
    background-color: rgba(80, 80, 80, 0.3);
    border-radius: 2px;
    margin-top: 2px;
    margin-bottom: 4px;
  }
</style> 