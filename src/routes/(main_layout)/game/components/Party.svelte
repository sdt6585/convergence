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
        // expanded: false,
        expanded: true,
        statsExpanded: false,
        // skillsExpanded: false,
        skillsExpanded: true,
        abilitiesExpanded: false,
        equipmentExpanded: false,
        skillsChipsExpanded: skillsChipsExpanded
      });
    }
    
    return treeData;
  }

  // const data = $state([
  //   {
  //     expanded: true,
  //     item: {
  //       name: 'Nebula Voyager',
  //       star_system: {id: 1, name: 'Sol'},
  //       id: 1,
  //       hp: 75,
  //       hp_max: 100,
  //       shields: 80,
  //       shieldsMax: 100,
  //       type: 'ship',
  //       bays: [

  //       ]
  //     },
  //     children: [
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Helm: Alex',
  //           id: 101,
  //           hp: 85,
  //           hp_max: 100,
  //           role: 'Captain',
  //           class: 'Commander',
  //           subclass: 'Inspired Leader',
  //           race: 'Human',
  //           stats: {
  //             intelligence: 7,
  //             dexterity: 6,
  //             strength: 5,
  //             charisma: 8,
  //             intuition: 6,
  //             luck: 2,
  //             constitution: 6,
  //             expanded: false
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'Leadership', value: 8, current_exp: 240, needed_exp: 480},
  //               { name: 'Vessel Piloting', value: 6, current_exp: 65, needed_exp: 120},
  //               { name: 'Persuasion', value: 7, current_exp: 200, needed_exp: 240},
  //               { name: 'Bartering', value: 5, current_exp: 45, needed_exp: 60},
  //               { name: 'Pistols', value: 4, current_exp: 24, needed_exp: 30}
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Command Officer Uniform', type: 'armor', protection: 2 },
  //               { name: 'Nova-class Pistol', type: 'weapon', damage: 3, range: 20 },
  //               { name: 'Standard Shield Generator', type: 'shield', capacity: 25, recharge: 5 },
  //               { name: 'Neural Interface', type: 'cybernetic', ability: 'Enhanced ship systems control' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Inspired Leader', 
  //                 description: 'Your commitment to your beliefs inspires your followers. Add +1 to skill checks to all party members while in the same vicinity.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Advantage on 2 core skills of your choice',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: '+1 to a core skill of your choice',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Engineering: Sora',
  //           id: 102,
  //           hp: 65,
  //           hp_max: 90,
  //           role: 'Engineer',
  //           class: 'Engineer',
  //           race: 'C\'Than',
  //           stats: {
  //             intelligence: 9,
  //             dexterity: 7,
  //             strength: 4,
  //             charisma: 5,
  //             intuition: 7,
  //             luck: 1,
  //             constitution: 4
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'Hardware Maintenance', value: 9, current_exp: 320, needed_exp: 480 },
  //               { name: 'Computer Engineering', value: 8, current_exp: 280, needed_exp: 360 },
  //               { name: 'Drone Piloting', value: 6, current_exp: 80, needed_exp: 120 },
  //               { name: 'Hacking', value: 7, current_exp: 160, needed_exp: 240 },
  //               { name: 'First Aid', value: 3, current_exp: 12, needed_exp: 15 }
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Tech Jumpsuit', type: 'armor', protection: 1 },
  //               { name: 'Multi-Tool', type: 'tool', functionality: 'Repair +2' },
  //               { name: 'Engineering Drone', type: 'drone', utility: 'Repairs in hazardous areas' },
  //               { name: 'Optic Enhancement', type: 'cybernetic', ability: 'Technical schematics overlay' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Technical Genius', 
  //                 description: 'You have an intuitive understanding of technology. Gain +2 to all repair and technical checks.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Can repair equipment in half the normal time',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: 'Crafted items gain +1 quality level',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Navigation: Quinn',
  //           id: 103,
  //           hp: 70,
  //           hp_max: 85,
  //           role: 'Navigator',
  //           class: 'Pilot',
  //           race: 'Human',
  //           stats: {
  //             intelligence: 8,
  //             dexterity: 7,
  //             strength: 4,
  //             charisma: 5,
  //             intuition: 8,
  //             luck: 2,
  //             constitution: 5
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'Vessel Piloting', value: 8, current_exp: 280, needed_exp: 360 },
  //               { name: 'Astrogation', value: 9, current_exp: 320, needed_exp: 480 },
  //               { name: 'Hardware Maintenance', value: 4, current_exp: 24, needed_exp: 30 },
  //               { name: 'Education', value: 6, current_exp: 80, needed_exp: 120 },
  //               { name: 'Evasion', value: 7, current_exp: 160, needed_exp: 240 }
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Navigator\'s Suit', type: 'armor', protection: 2 },
  //               { name: 'Star Charts', type: 'tool', functionality: 'Navigation +2' },
  //               { name: 'Regenerative Shield', type: 'shield', capacity: 20, recharge: 4 },
  //               { name: 'Neural Navigator', type: 'cybernetic', ability: 'Instantaneous astrogation calculations' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Spatial Awareness', 
  //                 description: 'Your innate sense of direction is unmatched. +2 to all navigation and piloting checks.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Can plot jump routes in half the normal time',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: 'Ship evasion maneuvers gain +25% effectiveness',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Weapons:Zara',
  //           id: 104,
  //           hp: 90,
  //           hp_max: 100,
  //           role: 'Security',
  //           class: 'Drop Trooper',
  //           race: 'Troydian',
  //           stats: {
  //             intelligence: 6,
  //             dexterity: 5,
  //             strength: 9,
  //             charisma: 4,
  //             intuition: 7,
  //             luck: 1,
  //             constitution: 8
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'Heavy Weapons', value: 8, current_exp: 280, needed_exp: 360 },
  //               { name: 'Brawling', value: 7, current_exp: 160, needed_exp: 240 },
  //               { name: 'Intimidation', value: 6, current_exp: 80, needed_exp: 120 },
  //               { name: 'Perception', value: 5, current_exp: 45, needed_exp: 60 },
  //               { name: 'Evasion', value: 4, current_exp: 24, needed_exp: 30 }
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Troydian Battle Armor', type: 'armor', protection: 5 },
  //               { name: 'Pulse Rifle', type: 'weapon', damage: 6, range: 40 },
  //               { name: 'Military Shield', type: 'shield', capacity: 40, recharge: 8 },
  //               { name: 'Combat Stimulator', type: 'cybernetic', ability: 'Enhanced reaction times in combat' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Combat Specialist', 
  //                 description: 'You are a master of battlefield tactics. +2 damage with all weapons.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Can perform an extra attack once per combat',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: 'Gain damage resistance of 2 against all attacks',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Medical Bay: Chen',
  //           id: 105,
  //           hp: 75,
  //           hp_max: 85,
  //           role: 'Medic',
  //           class: 'Engineer',
  //           race: 'Human',
  //           stats: {
  //             intelligence: 8,
  //             dexterity: 7,
  //             strength: 4,
  //             charisma: 6,
  //             intuition: 7,
  //             luck: 2,
  //             constitution: 5
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'First Aid', value: 9, current_exp: 320, needed_exp: 480 },
  //               { name: 'Education', value: 8, current_exp: 280, needed_exp: 360 },
  //               { name: 'Hardware Maintenance', value: 5, current_exp: 45, needed_exp: 60 },
  //               { name: 'Pistols', value: 3, current_exp: 12, needed_exp: 15 },
  //               { name: 'Persuasion', value: 6, current_exp: 80, needed_exp: 120 }
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Medical Jumpsuit', type: 'armor', protection: 1 },
  //               { name: 'Advanced Med Kit', type: 'tool', functionality: 'Healing +3' },
  //               { name: 'Auto-Med Drone', type: 'drone', utility: 'Automated healing support' },
  //               { name: 'Medical Implant', type: 'cybernetic', ability: 'Real-time vitals monitoring' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Battlefield Medic', 
  //                 description: 'Your medical training is unmatched. Healing abilities restore +50% more health.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Can stabilize critical patients in half the normal time',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: 'Once per day, can bring a character back from the brink of death',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       }
  //     ]
  //   },
  //   {
  //     expanded: true,
  //     item: {
  //       name: 'Earth',
  //       id: 2,
  //       star_system: {id: 1, name: 'Sol'},
  //       type: 'planet'
  //     },
  //     children: [
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Governor Reeves',
  //           id: 106,
  //           hp: 80,
  //           hp_max: 80,
  //           role: 'Administrator',
  //           class: 'Commander',
  //           race: 'Human',
  //           stats: {
  //             intelligence: 8,
  //             dexterity: 5,
  //             strength: 4,
  //             charisma: 9,
  //             intuition: 7,
  //             luck: 2,
  //             constitution: 5
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'Leadership', value: 9, current_exp: 320, needed_exp: 480 },
  //               { name: 'Bartering', value: 8, current_exp: 280, needed_exp: 360 },
  //               { name: 'Persuasion', value: 8, current_exp: 280, needed_exp: 360 },
  //               { name: 'Education', value: 7, current_exp: 160, needed_exp: 240 },
  //               { name: 'Performance', value: 6, current_exp: 80, needed_exp: 120 }
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Diplomat\'s Attire', type: 'armor', protection: 1 },
  //               { name: 'Personal Shield', type: 'shield', capacity: 15, recharge: 3 },
  //               { name: 'Communicator', type: 'tool', functionality: 'Cross-planetary communications' },
  //               { name: 'Diplomatic Implant', type: 'cybernetic', ability: 'Language and cultural database' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Diplomatic Immunity', 
  //                 description: 'Your status grants you special privileges. +3 to negotiation checks with officials.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Can call in a political favor once per day',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: 'Command respect: NPCs start with favorable disposition',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Chief Scientist Dr. Zhang',
  //           id: 107,
  //           hp: 70,
  //           hp_max: 70,
  //           role: 'Researcher',
  //           class: 'Explorer',
  //           race: 'C\'Than',
  //           stats: {
  //             intelligence: 10,
  //             dexterity: 6,
  //             strength: 3,
  //             charisma: 5,
  //             intuition: 8,
  //             luck: 1,
  //             constitution: 4
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'Education', value: 10, current_exp: 480, needed_exp: 600 },
  //               { name: 'Computer Engineering', value: 9, current_exp: 320, needed_exp: 480 },
  //               { name: 'Perception', value: 7, current_exp: 160, needed_exp: 240 },
  //               { name: 'Hardware Maintenance', value: 6, current_exp: 80, needed_exp: 120 },
  //               { name: 'Foraging', value: 5, current_exp: 45, needed_exp: 60 }
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Research Suit', type: 'armor', protection: 1 },
  //               { name: 'Analysis Device', type: 'tool', functionality: 'Scientific analysis +3' },
  //               { name: 'Research Drone', type: 'drone', utility: 'Sample collection and analysis' },
  //               { name: 'Memory Enhancement', type: 'cybernetic', ability: 'Expanded knowledge storage' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Scientific Method', 
  //                 description: 'Your analytical approach yields insights others miss. +3 to all research checks.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Can identify unknown substances in half the normal time',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: 'Once per day, gain a crucial insight about any scientific problem',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Defense Commander Patel',
  //           id: 108,
  //           hp: 95,
  //           hp_max: 95,
  //           role: 'Military',
  //           class: 'Drop Trooper',
  //           race: 'Troydian',
  //           stats: {
  //             intelligence: 7,
  //             dexterity: 6,
  //             strength: 8,
  //             charisma: 5,
  //             intuition: 7,
  //             luck: 1,
  //             constitution: 9
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'Heavy Weapons', value: 9, current_exp: 320, needed_exp: 480 },
  //               { name: 'Leadership', value: 8, current_exp: 280, needed_exp: 360 },
  //               { name: 'Intimidation', value: 7, current_exp: 160, needed_exp: 240 },
  //               { name: 'Perception', value: 6, current_exp: 80, needed_exp: 120 },
  //               { name: 'Demolitions', value: 5, current_exp: 45, needed_exp: 60 }
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Military Command Armor', type: 'armor', protection: 4 },
  //               { name: 'Heavy Pulse Cannon', type: 'weapon', damage: 8, range: 50 },
  //               { name: 'Tactical Shield', type: 'shield', capacity: 45, recharge: 9 },
  //               { name: 'Combat Interface', type: 'cybernetic', ability: 'Real-time battlefield analysis' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Tactical Genius', 
  //                 description: 'Your battlefield awareness is unmatched. Allies gain +1 to attack rolls under your command.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Can coordinate synchronized attacks with allies once per combat',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: 'Defensive formations under your command reduce damage by 25%',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         expanded: false,
  //         item: {
  //           name: 'Trade Minister Santos',
  //           id: 109,
  //           hp: 75,
  //           hp_max: 75,
  //           role: 'Commerce',
  //           class: 'Scoundrel',
  //           race: 'Human',
  //           stats: {
  //             intelligence: 7,
  //             dexterity: 6,
  //             strength: 4,
  //             charisma: 9,
  //             intuition: 7,
  //             luck: 3,
  //             constitution: 4
  //           },
  //           skills: {
  //             expanded: false,
  //             children: [
  //               { name: 'Bartering', value: 10, current_exp: 480, needed_exp: 600 },
  //               { name: 'Persuasion', value: 8, current_exp: 280, needed_exp: 360 },
  //               { name: 'Deception', value: 7, current_exp: 160, needed_exp: 240 },
  //               { name: 'Education', value: 6, current_exp: 80, needed_exp: 120 },
  //               { name: 'Performance', value: 5, current_exp: 45, needed_exp: 60 }
  //             ]
  //           },
  //           equipment: {
  //             expanded: false,
  //             children: [
  //               { name: 'Merchant\'s Garb', type: 'armor', protection: 1 },
  //               { name: 'Concealed Pistol', type: 'weapon', damage: 2, range: 15 },
  //               { name: 'Market Analyzer', type: 'tool', functionality: 'Economic forecasting +3' },
  //               { name: 'Trade Chip', type: 'cybernetic', ability: 'Real-time market data integration' }
  //             ]
  //           },
  //           abilities: {
  //             expanded: false,
  //             children: [
  //               { 
  //                 name: 'Master Negotiator', 
  //                 description: 'Your business acumen is legendary. Buy items at 20% discount and sell at 20% premium.',
  //                 tier: 1,
  //                 expanded: false
  //               },
  //               { 
  //                 name: 'Tier 2', 
  //                 description: 'Can access black market goods unavailable to others',
  //                 tier: 2,
  //                 expanded: false,
  //                 unlocked: false
  //               },
  //               { 
  //                 name: 'Tier 3', 
  //                 description: 'Once per week, can acquire any non-unique item regardless of availability',
  //                 tier: 3,
  //                 expanded: false,
  //                 unlocked: false
  //               }
  //             ]
  //           }
  //         }
  //       }
  //     ]
  //   }
  // ]);

  let data = $state(buildLocationTree());

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
                          <div class="children">
                            <!-- Skill Chips Section (Grouped by Category, Collapsible) -->
                            {#each characterNode.item.getSkillsByCategory() as category, i}
                              <button
                                class="tree-row"
                                onclick={() => characterNode.skillsChipsExpanded[category.name] = !characterNode.skillsChipsExpanded[category.name]}>
                                <span class="expandable-name {characterNode.skillsChipsExpanded[category.name] ? 'expanded-name' : ''}">
                                  <span class="section-header">{category.name} (Tiles)</span>
                                </span>
                              </button>
                              {#if characterNode.skillsChipsExpanded[category.name]}
                                <div class="chip-row children">
                                  {#each category.skills as skill}
                                    <div class="skill-chip {category.name === 'Core' ? 'core-skill-chip' : ''}">
                                      <div class="chip-skill-name">{skill.name}</div>
                                      <div class="chip-skill-level">{skill.level}</div>
                                      <div class="chip-skill-progress-bar">
                                        <div class="chip-skill-progress"
                                          style="width: {skill.next_level_rolls_required ? 100 * (skill.success_checks - skill.next_level_rolls_required + skill.rolls_to_next_level) / skill.next_level_rolls_required : 100}%"></div>
                                      </div>
                                    </div>
                                  {/each}
                                </div>
                              {/if}
                            {/each}
                          </div>
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
                                      </div>
                                      <div class="skill-progress-bar">
                                        <div class="skill-progress" style="width: {100 * (skill.success_checks - skill.next_level_rolls_required + skill.rolls_to_next_level) / skill.next_level_rolls_required}%"></div>
                                      </div>                                      
                                      
                                      <span class="skill-progress-text">
                                        {#if skill.level < 10}
                                          {skill.rolls_to_next_level} more to level {skill.level + 1}
                                        {:else}
                                          Max level
                                        {/if}
                                      </span>
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
  }

  .skill-chips-category {
    margin-top: 10px;
  }
  .chip-category-header {
    background: none;
    border: none;
    color: #bbb;
    font-weight: bold;
    font-size: 1em;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-bottom: 4px;
  }
  .chip-expand-icon {
    margin-left: 8px;
    font-size: 0.9em;
  }
  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }
  .skill-chip {
    background: #222;
    border-radius: 8px;
    min-width: 100px;
    max-width: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 1px 2px #0004;
    position: relative;
    text-transform: uppercase;
    overflow: hidden;
  }

  .chip-skill-name {
    font-size: 0.85em;
    padding: 4px 8px;
    color: var(--text-muted);
    opacity: 0.8;
    margin-bottom: 2px;
    text-align: center;
  }
  .chip-skill-level {
    font-size: 1.5em;
    opacity: 0.8;
    font-weight: bold;
    color: #fff;
    margin-bottom: 2px;
  }
  .chip-skill-progress-bar {
    width: 100%;
    height: 8px;
    background: #333;
    margin-top: auto;
    overflow: hidden;
    position: relative;
  }
  .chip-skill-progress {
    height: 100%;
    background: #4a9;
    border-radius: 0 0 0px 8px;
    transition: width 0.3s;
  }
</style> 