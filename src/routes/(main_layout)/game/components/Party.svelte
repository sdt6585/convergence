<script>
  // Utility
  import { getContext } from 'svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import logger from '@utils/logger';
  
  // Create event dispatcher for character selection
  const dispatch = createEventDispatcher();
  
  // Make sure that data is loaded
  const store = getContext('store');  

  // Selected character
  let selectedCharacterId = $state(null);
  



  const data = $state([
    {
      expanded: true,
      item: {
        name: 'Nebula Voyager',
        star_system: {id: 1, name: 'Sol'},
        id: 1,
        hp: 75,
        hp_max: 100,
        shields: 80,
        shieldsMax: 100,
        type: 'ship',
        bays: [

        ]
      },
      children: [
        {
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
              constitution: 6,
              expanded: false
            },
            skills: {
              expanded: false,
              children: [
                { name: 'Leadership', value: 8, current_exp: 240, needed_exp: 480},
                { name: 'Vessel Piloting', value: 6, current_exp: 65, needed_exp: 120},
                { name: 'Persuasion', value: 7, current_exp: 200, needed_exp: 240},
                { name: 'Bartering', value: 5, current_exp: 45, needed_exp: 60},
                { name: 'Pistols', value: 4, current_exp: 24, needed_exp: 30}
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Command Officer Uniform', type: 'armor', protection: 2 },
                { name: 'Nova-class Pistol', type: 'weapon', damage: 3, range: 20 },
                { name: 'Standard Shield Generator', type: 'shield', capacity: 25, recharge: 5 },
                { name: 'Neural Interface', type: 'cybernetic', ability: 'Enhanced ship systems control' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
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
          }
        },
        {
          expanded: false,
          item: {
            name: 'Engineering: Sora',
            id: 102,
            hp: 65,
            hp_max: 90,
            role: 'Engineer',
            class: 'Engineer',
            race: 'C\'Than',
            stats: {
              intelligence: 9,
              dexterity: 7,
              strength: 4,
              charisma: 5,
              intuition: 7,
              luck: 1,
              constitution: 4
            },
            skills: {
              expanded: false,
              children: [
                { name: 'Hardware Maintenance', value: 9, current_exp: 320, needed_exp: 480 },
                { name: 'Computer Engineering', value: 8, current_exp: 280, needed_exp: 360 },
                { name: 'Drone Piloting', value: 6, current_exp: 80, needed_exp: 120 },
                { name: 'Hacking', value: 7, current_exp: 160, needed_exp: 240 },
                { name: 'First Aid', value: 3, current_exp: 12, needed_exp: 15 }
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Tech Jumpsuit', type: 'armor', protection: 1 },
                { name: 'Multi-Tool', type: 'tool', functionality: 'Repair +2' },
                { name: 'Engineering Drone', type: 'drone', utility: 'Repairs in hazardous areas' },
                { name: 'Optic Enhancement', type: 'cybernetic', ability: 'Technical schematics overlay' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
                { 
                  name: 'Technical Genius', 
                  description: 'You have an intuitive understanding of technology. Gain +2 to all repair and technical checks.',
                  tier: 1,
                  expanded: false
                },
                { 
                  name: 'Tier 2', 
                  description: 'Can repair equipment in half the normal time',
                  tier: 2,
                  expanded: false,
                  unlocked: false
                },
                { 
                  name: 'Tier 3', 
                  description: 'Crafted items gain +1 quality level',
                  tier: 3,
                  expanded: false,
                  unlocked: false
                }
              ]
            }
          }
        },
        {
          expanded: false,
          item: {
            name: 'Navigation: Quinn',
            id: 103,
            hp: 70,
            hp_max: 85,
            role: 'Navigator',
            class: 'Pilot',
            race: 'Human',
            stats: {
              intelligence: 8,
              dexterity: 7,
              strength: 4,
              charisma: 5,
              intuition: 8,
              luck: 2,
              constitution: 5
            },
            skills: {
              expanded: false,
              children: [
                { name: 'Vessel Piloting', value: 8, current_exp: 280, needed_exp: 360 },
                { name: 'Astrogation', value: 9, current_exp: 320, needed_exp: 480 },
                { name: 'Hardware Maintenance', value: 4, current_exp: 24, needed_exp: 30 },
                { name: 'Education', value: 6, current_exp: 80, needed_exp: 120 },
                { name: 'Evasion', value: 7, current_exp: 160, needed_exp: 240 }
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Navigator\'s Suit', type: 'armor', protection: 2 },
                { name: 'Star Charts', type: 'tool', functionality: 'Navigation +2' },
                { name: 'Regenerative Shield', type: 'shield', capacity: 20, recharge: 4 },
                { name: 'Neural Navigator', type: 'cybernetic', ability: 'Instantaneous astrogation calculations' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
                { 
                  name: 'Spatial Awareness', 
                  description: 'Your innate sense of direction is unmatched. +2 to all navigation and piloting checks.',
                  tier: 1,
                  expanded: false
                },
                { 
                  name: 'Tier 2', 
                  description: 'Can plot jump routes in half the normal time',
                  tier: 2,
                  expanded: false,
                  unlocked: false
                },
                { 
                  name: 'Tier 3', 
                  description: 'Ship evasion maneuvers gain +25% effectiveness',
                  tier: 3,
                  expanded: false,
                  unlocked: false
                }
              ]
            }
          }
        },
        {
          expanded: false,
          item: {
            name: 'Weapons:Zara',
            id: 104,
            hp: 90,
            hp_max: 100,
            role: 'Security',
            class: 'Drop Trooper',
            race: 'Troydian',
            stats: {
              intelligence: 6,
              dexterity: 5,
              strength: 9,
              charisma: 4,
              intuition: 7,
              luck: 1,
              constitution: 8
            },
            skills: {
              expanded: false,
              children: [
                { name: 'Heavy Weapons', value: 8, current_exp: 280, needed_exp: 360 },
                { name: 'Brawling', value: 7, current_exp: 160, needed_exp: 240 },
                { name: 'Intimidation', value: 6, current_exp: 80, needed_exp: 120 },
                { name: 'Perception', value: 5, current_exp: 45, needed_exp: 60 },
                { name: 'Evasion', value: 4, current_exp: 24, needed_exp: 30 }
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Troydian Battle Armor', type: 'armor', protection: 5 },
                { name: 'Pulse Rifle', type: 'weapon', damage: 6, range: 40 },
                { name: 'Military Shield', type: 'shield', capacity: 40, recharge: 8 },
                { name: 'Combat Stimulator', type: 'cybernetic', ability: 'Enhanced reaction times in combat' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
                { 
                  name: 'Combat Specialist', 
                  description: 'You are a master of battlefield tactics. +2 damage with all weapons.',
                  tier: 1,
                  expanded: false
                },
                { 
                  name: 'Tier 2', 
                  description: 'Can perform an extra attack once per combat',
                  tier: 2,
                  expanded: false,
                  unlocked: false
                },
                { 
                  name: 'Tier 3', 
                  description: 'Gain damage resistance of 2 against all attacks',
                  tier: 3,
                  expanded: false,
                  unlocked: false
                }
              ]
            }
          }
        },
        {
          expanded: false,
          item: {
            name: 'Medical Bay: Chen',
            id: 105,
            hp: 75,
            hp_max: 85,
            role: 'Medic',
            class: 'Engineer',
            race: 'Human',
            stats: {
              intelligence: 8,
              dexterity: 7,
              strength: 4,
              charisma: 6,
              intuition: 7,
              luck: 2,
              constitution: 5
            },
            skills: {
              expanded: false,
              children: [
                { name: 'First Aid', value: 9, current_exp: 320, needed_exp: 480 },
                { name: 'Education', value: 8, current_exp: 280, needed_exp: 360 },
                { name: 'Hardware Maintenance', value: 5, current_exp: 45, needed_exp: 60 },
                { name: 'Pistols', value: 3, current_exp: 12, needed_exp: 15 },
                { name: 'Persuasion', value: 6, current_exp: 80, needed_exp: 120 }
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Medical Jumpsuit', type: 'armor', protection: 1 },
                { name: 'Advanced Med Kit', type: 'tool', functionality: 'Healing +3' },
                { name: 'Auto-Med Drone', type: 'drone', utility: 'Automated healing support' },
                { name: 'Medical Implant', type: 'cybernetic', ability: 'Real-time vitals monitoring' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
                { 
                  name: 'Battlefield Medic', 
                  description: 'Your medical training is unmatched. Healing abilities restore +50% more health.',
                  tier: 1,
                  expanded: false
                },
                { 
                  name: 'Tier 2', 
                  description: 'Can stabilize critical patients in half the normal time',
                  tier: 2,
                  expanded: false,
                  unlocked: false
                },
                { 
                  name: 'Tier 3', 
                  description: 'Once per day, can bring a character back from the brink of death',
                  tier: 3,
                  expanded: false,
                  unlocked: false
                }
              ]
            }
          }
        }
      ]
    },
    {
      expanded: true,
      item: {
        name: 'Earth',
        id: 2,
        star_system: {id: 1, name: 'Sol'},
        type: 'planet'
      },
      children: [
        {
          expanded: false,
          item: {
            name: 'Governor Reeves',
            id: 106,
            hp: 80,
            hp_max: 80,
            role: 'Administrator',
            class: 'Commander',
            race: 'Human',
            stats: {
              intelligence: 8,
              dexterity: 5,
              strength: 4,
              charisma: 9,
              intuition: 7,
              luck: 2,
              constitution: 5
            },
            skills: {
              expanded: false,
              children: [
                { name: 'Leadership', value: 9, current_exp: 320, needed_exp: 480 },
                { name: 'Bartering', value: 8, current_exp: 280, needed_exp: 360 },
                { name: 'Persuasion', value: 8, current_exp: 280, needed_exp: 360 },
                { name: 'Education', value: 7, current_exp: 160, needed_exp: 240 },
                { name: 'Performance', value: 6, current_exp: 80, needed_exp: 120 }
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Diplomat\'s Attire', type: 'armor', protection: 1 },
                { name: 'Personal Shield', type: 'shield', capacity: 15, recharge: 3 },
                { name: 'Communicator', type: 'tool', functionality: 'Cross-planetary communications' },
                { name: 'Diplomatic Implant', type: 'cybernetic', ability: 'Language and cultural database' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
                { 
                  name: 'Diplomatic Immunity', 
                  description: 'Your status grants you special privileges. +3 to negotiation checks with officials.',
                  tier: 1,
                  expanded: false
                },
                { 
                  name: 'Tier 2', 
                  description: 'Can call in a political favor once per day',
                  tier: 2,
                  expanded: false,
                  unlocked: false
                },
                { 
                  name: 'Tier 3', 
                  description: 'Command respect: NPCs start with favorable disposition',
                  tier: 3,
                  expanded: false,
                  unlocked: false
                }
              ]
            }
          }
        },
        {
          expanded: false,
          item: {
            name: 'Chief Scientist Dr. Zhang',
            id: 107,
            hp: 70,
            hp_max: 70,
            role: 'Researcher',
            class: 'Explorer',
            race: 'C\'Than',
            stats: {
              intelligence: 10,
              dexterity: 6,
              strength: 3,
              charisma: 5,
              intuition: 8,
              luck: 1,
              constitution: 4
            },
            skills: {
              expanded: false,
              children: [
                { name: 'Education', value: 10, current_exp: 480, needed_exp: 600 },
                { name: 'Computer Engineering', value: 9, current_exp: 320, needed_exp: 480 },
                { name: 'Perception', value: 7, current_exp: 160, needed_exp: 240 },
                { name: 'Hardware Maintenance', value: 6, current_exp: 80, needed_exp: 120 },
                { name: 'Foraging', value: 5, current_exp: 45, needed_exp: 60 }
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Research Suit', type: 'armor', protection: 1 },
                { name: 'Analysis Device', type: 'tool', functionality: 'Scientific analysis +3' },
                { name: 'Research Drone', type: 'drone', utility: 'Sample collection and analysis' },
                { name: 'Memory Enhancement', type: 'cybernetic', ability: 'Expanded knowledge storage' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
                { 
                  name: 'Scientific Method', 
                  description: 'Your analytical approach yields insights others miss. +3 to all research checks.',
                  tier: 1,
                  expanded: false
                },
                { 
                  name: 'Tier 2', 
                  description: 'Can identify unknown substances in half the normal time',
                  tier: 2,
                  expanded: false,
                  unlocked: false
                },
                { 
                  name: 'Tier 3', 
                  description: 'Once per day, gain a crucial insight about any scientific problem',
                  tier: 3,
                  expanded: false,
                  unlocked: false
                }
              ]
            }
          }
        },
        {
          expanded: false,
          item: {
            name: 'Defense Commander Patel',
            id: 108,
            hp: 95,
            hp_max: 95,
            role: 'Military',
            class: 'Drop Trooper',
            race: 'Troydian',
            stats: {
              intelligence: 7,
              dexterity: 6,
              strength: 8,
              charisma: 5,
              intuition: 7,
              luck: 1,
              constitution: 9
            },
            skills: {
              expanded: false,
              children: [
                { name: 'Heavy Weapons', value: 9, current_exp: 320, needed_exp: 480 },
                { name: 'Leadership', value: 8, current_exp: 280, needed_exp: 360 },
                { name: 'Intimidation', value: 7, current_exp: 160, needed_exp: 240 },
                { name: 'Perception', value: 6, current_exp: 80, needed_exp: 120 },
                { name: 'Demolitions', value: 5, current_exp: 45, needed_exp: 60 }
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Military Command Armor', type: 'armor', protection: 4 },
                { name: 'Heavy Pulse Cannon', type: 'weapon', damage: 8, range: 50 },
                { name: 'Tactical Shield', type: 'shield', capacity: 45, recharge: 9 },
                { name: 'Combat Interface', type: 'cybernetic', ability: 'Real-time battlefield analysis' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
                { 
                  name: 'Tactical Genius', 
                  description: 'Your battlefield awareness is unmatched. Allies gain +1 to attack rolls under your command.',
                  tier: 1,
                  expanded: false
                },
                { 
                  name: 'Tier 2', 
                  description: 'Can coordinate synchronized attacks with allies once per combat',
                  tier: 2,
                  expanded: false,
                  unlocked: false
                },
                { 
                  name: 'Tier 3', 
                  description: 'Defensive formations under your command reduce damage by 25%',
                  tier: 3,
                  expanded: false,
                  unlocked: false
                }
              ]
            }
          }
        },
        {
          expanded: false,
          item: {
            name: 'Trade Minister Santos',
            id: 109,
            hp: 75,
            hp_max: 75,
            role: 'Commerce',
            class: 'Scoundrel',
            race: 'Human',
            stats: {
              intelligence: 7,
              dexterity: 6,
              strength: 4,
              charisma: 9,
              intuition: 7,
              luck: 3,
              constitution: 4
            },
            skills: {
              expanded: false,
              children: [
                { name: 'Bartering', value: 10, current_exp: 480, needed_exp: 600 },
                { name: 'Persuasion', value: 8, current_exp: 280, needed_exp: 360 },
                { name: 'Deception', value: 7, current_exp: 160, needed_exp: 240 },
                { name: 'Education', value: 6, current_exp: 80, needed_exp: 120 },
                { name: 'Performance', value: 5, current_exp: 45, needed_exp: 60 }
              ]
            },
            equipment: {
              expanded: false,
              children: [
                { name: 'Merchant\'s Garb', type: 'armor', protection: 1 },
                { name: 'Concealed Pistol', type: 'weapon', damage: 2, range: 15 },
                { name: 'Market Analyzer', type: 'tool', functionality: 'Economic forecasting +3' },
                { name: 'Trade Chip', type: 'cybernetic', ability: 'Real-time market data integration' }
              ]
            },
            abilities: {
              expanded: false,
              children: [
                { 
                  name: 'Master Negotiator', 
                  description: 'Your business acumen is legendary. Buy items at 20% discount and sell at 20% premium.',
                  tier: 1,
                  expanded: false
                },
                { 
                  name: 'Tier 2', 
                  description: 'Can access black market goods unavailable to others',
                  tier: 2,
                  expanded: false,
                  unlocked: false
                },
                { 
                  name: 'Tier 3', 
                  description: 'Once per week, can acquire any non-unique item regardless of availability',
                  tier: 3,
                  expanded: false,
                  unlocked: false
                }
              ]
            }
          }
        }
      ]
    }
  ]);

  
  onMount(async () => {
    // Load necessary data
    try {
      await Promise.all([
        store.data.game.load_characters(),
        store.data.game.load_ships(),
        store.data.game.load_planets(),
        store.data.game.load_players()
      ]);
      
      // Get data from store
      // const characters = store.data.game.characters || [];
      // const shipsData = store.data.game.ships || [];
      // const planetsData = store.data.game.planets || [];
      // const players = store.data.game.players || [];
      
      // // Add player info and basic health stats to characters
      // const enhancedCharacters = characters.map(char => ({
      //   ...char,
      //   hp: { current: Math.floor(Math.random() * 90) + 10, max: 100 },
      //   player: players.find(p => p.id === char.player_id) || null
      // }));
      
      // // Group characters by location
      // ships = shipsData.map(ship => ({
      //   ...ship,
      //   characters: enhancedCharacters.filter(char => char.ship_id === ship.id) || []
      // }));
      
      // planets = planetsData.map(planet => ({
      //   ...planet,
      //   characters: enhancedCharacters.filter(char => char.planet_id === planet.id) || []
      // }));
      
    } catch (error) {
      logger.error('party', 'Error loading party data', error);
    }
  });
</script>

<div class="party-panel">
  <div class="tree-container">
    {#each data as node}
      <div class="tree-item">
        <button class="tree-row" onclick={() => node.expanded = !node.expanded}>
          <span class="expandable-name {node.expanded ? 'expanded-name' : ''}">{node.item.name}</span>
          {#if node.item.type === 'ship'}
            <span class="stats">
              HP: {node.item.hp}/{node.item.hp_max}
              Shields: {node.item.shields}/{node.item.shieldsMax}
            </span>
          {/if}
        </button>

        {#if node.expanded}
          <div class="children">
            {#if node.children && node.children.length > 0}
              {#each node.children as child}
                <div class="character-item">
                  <button 
                    class="tree-row"
                    onclick={() => child.expanded = !child.expanded}
                  >
                    <span class="expandable-name {child.expanded ? 'expanded-name' : ''}">
                      {child.item.name} - {child.item.role} ({child.item.race})
                      <span class="stats">
                        HP: {child.item.hp}/{child.item.hp_max}
                      </span>
                    </span>
                  </button>
                  
                  <div class="children">
                    {#if child.expanded}
                        <button class="tree-row" onclick={() => child.item.stats.expanded = !child.item.stats.expanded}>
                          <span class="expandable-name {child.item.stats.expanded ? 'expanded-name' : ''}">
                            <span class="section-header">Stats</span>
                          </span>
                        </button>
                        {#if child.item.stats.expanded}
                          <ul class="character-attributes children">
                            <li class="stat">INT: {child.item.stats.intelligence}</li>
                            <li class="stat">DEX: {child.item.stats.dexterity}</li>
                            <li class="stat">STR: {child.item.stats.strength}</li>
                            <li class="stat">CHA: {child.item.stats.charisma}</li>
                            <li class="stat">INT: {child.item.stats.intuition}</li>
                            <li class="stat">LCK: {child.item.stats.luck}</li>
                            <li class="stat">CON: {child.item.stats.constitution}</li>
                          </ul>
                        {/if}
                        
                        <button class="tree-row" onclick={() => child.item.skills.expanded = !child.item.skills.expanded}>
                          <span class="expandable-name {child.item.skills.expanded ? 'expanded-name' : ''}">
                            <span class="section-header">Skills</span>
                          </span>
                        </button>
                        {#if child.item.skills.expanded}
                          <ul class="character-attributes children">
                            {#each child.item.skills.children as skill}
                              <li class="skill">{skill.name}: {skill.value}</li>
                            {/each}
                          </ul>
                        {/if}
                        <button class="tree-row" onclick={() => child.item.abilities.expanded = !child.item.abilities.expanded}>
                          <span class="expandable-name {child.item.abilities.expanded ? 'expanded-name' : ''}">
                            <span class="section-header">Abilities</span>
                          </span>
                        </button>
                        {#if child.item.abilities.expanded}
                          <ul class="character-attributes children">
                            {#each child.item.abilities.children as ability}
                              <li class="skill">{ability.name}: {ability.description}</li>
                            {/each}
                          </ul>
                        {/if}

                        <button class="tree-row" onclick={() => child.item.equipment.expanded = !child.item.equipment.expanded}>
                          <span class="expandable-name {child.item.equipment.expanded ? 'expanded-name' : ''}">
                            <span class="section-header">Equipment</span>
                          </span>
                        </button>
                        {#if child.item.equipment.expanded}
                          <ul class="character-attributes children">
                            {#each child.item.equipment.children as item}
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
</style> 