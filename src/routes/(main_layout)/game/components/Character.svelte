<script>
  // Utility
  import { getPath } from '@utils/navigation';
  import { getContext } from 'svelte';
  import { onMount } from 'svelte';
  import logger from '@utils/logger';
  
  /**
   * Props - selectedCharacter will be passed from the parent 
   * If not provided, it will default to the current player's character
   */
  let { selectedCharacter = null } = $props();
  
  // Access store for data
  const store = getContext('store');
  
  // Default to current player's character if not specified and player is logged in
  let currentPlayerCharacter = $state({
    expanded: false,
    item: {
      name: 'Helm: Alex',
      id: 101,
      hp: 85,
      hp_max: 100,
      role: 'Captain',
      class: 'Commander',
      subclass: 'Inspired Leader',
      race: 'Human',
      stats: {
        intelligence: 7,
        dexterity: 6,
        strength: 5,
        charisma: 8,
        intuition: 6,
        luck: 2,
        constitution: 6
      },
      skills: [
          { name: 'Leadership', value: 8, current_exp: 240, needed_exp: 480},
          { name: 'Vessel Piloting', value: 6, current_exp: 65, needed_exp: 120},
          { name: 'Persuasion', value: 7, current_exp: 200, needed_exp: 240},
          { name: 'Bartering', value: 5, current_exp: 45, needed_exp: 60},
          { name: 'Pistols', value: 4, current_exp: 24, needed_exp: 30}
      ],
      equipment: [
        { name: 'Command Officer Uniform', type: 'armor', protection: 2 },
        { name: 'Nova-class Pistol', type: 'weapon', damage: 3, range: 20 },
        { name: 'Standard Shield Generator', type: 'shield', capacity: 25, recharge: 5 },
        { name: 'Neural Interface', type: 'cybernetic', ability: 'Enhanced ship systems control' }
      ],
      abilities: [
        { 
          name: 'Inspired Leader', 
          description: 'Your commitment to your beliefs inspires your followers. Add +1 to skill checks to all party members while in the same vicinity.',
          tier: 1,
          expanded: false
        },
        { 
          name: 'Tier 2', 
          description: 'Advantage on 2 core skills of your choice',
          tier: 2,
          expanded: false,
          unlocked: false
        },
        { 
          name: 'Tier 3', 
          description: '+1 to a core skill of your choice',
          tier: 3,
          expanded: false,
          unlocked: false
        }
      ]
    }
  }); 
  
  let isLoading = $state(true);
  
  onMount(async () => {
    isLoading = true;
    // If no selected character and user is logged in, try to load their character
    if (!selectedCharacter && store.data.user) {
      try {
        // Get player based on user ID
        const playerId = store.data.user.id;
        // Load characters and find one belonging to current player
        await store.data.game.load_characters();
        const characters = store.data.game.characters;
        
        if (characters) {
          currentPlayerCharacter = characters.find(char => char.player_id === playerId);
        }
      } catch (error) {
        logger.error('character', 'Error loading player character', error);
      }
    }
    isLoading = false;
  });
  
  // Computed property for which character to display
  let displayCharacter = $derived(selectedCharacter || currentPlayerCharacter.item);
  
  // Temporary function to calculate HP percentage
  function getHpPercentage(character) {
    if (!character) return 0;
    return (character.hp / character.hp_max) * 100;
  }
</script>

<div class="character-sheet">
  {#if isLoading}
    <div class="loading">Loading character data...</div>
  {:else if displayCharacter}
    <div class="character-header">
      <h2>{displayCharacter.name}</h2>
      {#if displayCharacter.player}
        <div class="character-player">Player: {displayCharacter.player.name}</div>
      {/if}
      
      <div class="character-vitals">
        <div class="hp-container">
          <div class="hp-label">HP: {displayCharacter.hp || 0}/{displayCharacter.hp_max || 0}</div>
          <div class="hp-bar">
            <div class="hp-bar-fill" style="width: {getHpPercentage(displayCharacter)}%"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="character-content">
      <!-- Stats Section -->
      <div class="section">
        <h3>Stats</h3>
        <div class="stats-grid">
          {#if displayCharacter.stats}
            {#each Object.entries(displayCharacter.stats) as [stat, value]}
              <div class="stat-item">
                <div class="stat-label">{stat}</div>
                <div class="stat-value">{value}</div>
              </div>
            {/each}
          {:else}
            <div class="empty-state">No stats available</div>
          {/if}
        </div>
      </div>
      
      <!-- Skills Section -->
      <div class="section">
        <h3>Skills</h3>
        <div class="skills-grid">
          {#if displayCharacter.skills && displayCharacter.skills.length > 0}
            {#each displayCharacter.skills as skill}
              <div class="skill-item">
                <div class="skill-label">{skill.name}</div>
                <div class="skill-value">{skill.value}</div>
              </div>
            {/each}
          {:else}
            <div class="empty-state">No skills available</div>
          {/if}
        </div>
      </div>
      
      <!-- Equipment Section -->
      <div class="section">
        <h3>Equipment</h3>
        <div class="equipment-list">
          {#if displayCharacter.equipment && displayCharacter.equipment.length > 0}
            {#each displayCharacter.equipment as item}
              <div class="equipment-item">
                <div class="equipment-slot">{item.type}:</div>
                <div class="equipment-value">{item.name}</div>
              </div>
            {/each}
          {:else}
            <div class="empty-state">No equipment available</div>
          {/if}
        </div>
      </div>
      
      <!-- Class & Abilities Section -->
      <div class="section">
        <h3>Class & Abilities</h3>
        {#if displayCharacter.class}
          <div class="class-name">{displayCharacter.class}</div>
          {#if displayCharacter.abilities && displayCharacter.abilities.length > 0}
            <div class="abilities-list">
              {#each displayCharacter.abilities as ability}
                <div class="ability-item">
                  <div class="ability-name">{ability.name}</div>
                  <div class="ability-description">{ability.description}</div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state">No abilities available</div>
          {/if}
        {:else}
          <div class="empty-state">No class information available</div>
        {/if}
      </div>
      
      <!-- Character Actions -->
      <div class="character-actions">
        <button class="action-btn">Heal</button>
        <button class="action-btn">Transfer</button>
        <button class="action-btn">Inventory</button>
        <button class="action-btn">Skills</button>
      </div>
    </div>
  {:else}
    <div class="no-character">
      <p>No character selected</p>
      <p>Select a character from the Party panel or create a new one</p>
    </div>
  {/if}
</div>

<style>
  .character-sheet {
    height: 100%;
    padding: 15px;
    overflow-y: auto;
    color: #e0e0e0;
  }
  
  .loading, .no-character {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-style: italic;
    opacity: 0.7;
    text-align: center;
  }
  
  .character-header {
    border-bottom: 1px solid #444;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }
  
  .character-header h2 {
    margin: 0 0 5px 0;
    font-size: 1.8em;
  }
  
  .character-player {
    font-size: 0.9em;
    opacity: 0.8;
    margin-bottom: 10px;
  }
  
  .hp-container {
    margin-top: 10px;
  }
  
  .hp-label {
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .hp-bar {
    width: 100%;
    height: 15px;
    background-color: rgba(50, 50, 50, 0.5);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .hp-bar-fill {
    height: 100%;
    background-color: #3a9d3a;
    transition: width 0.3s ease;
  }
  
  .character-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .section {
    background-color: rgba(40, 40, 40, 0.6);
    border: 1px solid #333;
    border-radius: 5px;
    padding: 12px;
  }
  
  .section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #444;
    font-size: 1.2em;
  }
  
  .stats-grid, .skills-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }
  
  .stat-item, .skill-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    background-color: rgba(60, 60, 60, 0.5);
    border-radius: 4px;
  }
  
  .stat-label, .skill-label {
    font-size: 0.9em;
    opacity: 0.9;
    text-transform: uppercase;
  }
  
  .stat-value, .skill-value {
    font-size: 1.6em;
    font-weight: bold;
    margin-top: 5px;
  }
  
  .equipment-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .equipment-item {
    display: flex;
    padding: 8px;
    background-color: rgba(60, 60, 60, 0.5);
    border-radius: 4px;
  }
  
  .equipment-slot {
    font-weight: bold;
    margin-right: 8px;
    text-transform: capitalize;
    min-width: 80px;
  }
  
  .abilities-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }
  
  .ability-item {
    padding: 10px;
    background-color: rgba(60, 60, 60, 0.5);
    border-radius: 4px;
  }
  
  .ability-name {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .ability-description {
    font-size: 0.9em;
    opacity: 0.9;
  }
  
  .empty-state {
    font-style: italic;
    opacity: 0.7;
    text-align: center;
    padding: 10px;
  }
  
  .character-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin-top: 10px;
  }
  
  .action-btn {
    padding: 8px 15px;
    background-color: rgba(60, 60, 60, 0.8);
    border: 1px solid #555;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .action-btn:hover {
    background-color: rgba(80, 80, 80, 0.9);
  }
  
  @media (max-width: 600px) {
    .stats-grid, .skills-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style> 