// Supabase
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
// Utility
import logger from '@utils/logger';
// Model classes
import * as Models from '@lib/data';


export default class DataStore {
  user = $state(null);
  user_loading = $state(true);
  user_loading_promise = null;
  data = $state({});
  /**
   * List of tables - turns into data.table_loading, data.tables, this.create_tables(), this.create_table(), this.load_tables(), etc below
   * singleton - if true, allow selection of a single element and a this.table/this.table_loading object, and changes the this.load_table to find the right id and save the instance
   * plural - defaults to just add an s, use it for non normative plurals like die/dice, mouse/mice, deer/deer
   * key - either user_id or a singleton reference, defaults to game_id
   * select - the query sent to supabase - defaults to *
   */
  tables = [
    {name: 'game', singleton: {foreignKey: 'user_id', parent: 'user'}, relationships: [
      {table: 'player', type: 'has-many'},
      {table: 'ship', type: 'has-many'},
      {table: 'character', type: 'has-many'},
      {table: 'planet', type: 'has-many'},
      {table: 'star_system', type: 'has-many'},
    ], realtime: {
      filter: (gameId) => `id=eq.${gameId}`
    }},
    {name: 'player', singleton: {parent: 'game'}, relationships: [
      {table: 'character', type: 'has-many'}
    ], realtime: {
      filter: (gameId) => `game_id=eq.${gameId}`
    }},
    {
      name: 'ship',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'description', type: 'text', displayType: 'string' },
        { name: 'current_shields', type: 'smallint', displayType: 'number' },
        { name: 'max_shields', type: 'smallint', displayType: 'number' },
        { name: 'current_hp', type: 'smallint', displayType: 'number' },
        { name: 'max_hp', type: 'smallint', displayType: 'number' }
      ],
      relationships: [
        {table: 'character', type: 'has-many'}
      ]
    },
    {name: 'planet', relationships: [
      {table: 'character', type: 'has-many'}
    ], realtime: {
      filter: (gameId) => `game_id=eq.${gameId}`
    }},
    {name: 'star_system', singleton: {parent: 'game'},relationships: ['star_system_object'], realtime: {
      filter: (gameId) => `game_id=eq.${gameId}`
    }},
    {name: 'star_system_object', refTable: 'star_system', realtime: {
      // TODO: Define appropriate filter for star_system_object table if needed
      filter: (gameId) => ''
    }},
    {
      name: 'stat',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'description', type: 'text', displayType: 'string' },
        { name: 'ordinal_position', type: 'integer', displayType: 'number' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ]
    },
    {
      name: 'race',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'description', type: 'text', displayType: 'string' },
        { name: 'base_intelligence', type: 'smallint', displayType: 'number' },
        { name: 'base_dexterity', type: 'smallint', displayType: 'number' },
        { name: 'base_strength', type: 'smallint', displayType: 'number' },
        { name: 'base_charisma', type: 'smallint', displayType: 'number' },
        { name: 'base_intuition', type: 'smallint', displayType: 'number' },
        { name: 'base_luck', type: 'smallint', displayType: 'number' },
        { name: 'base_constitution', type: 'smallint', displayType: 'number' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ]
    },
    {
      name: 'class',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'description', type: 'text', displayType: 'string' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ],
      relationships: [
        { type: 'has-many', table: 'subclass' },
        { type: 'junction', table: 'skill', junctionTable: 'class_skill' }
      ]
    },
    {
      name: 'subclass',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'class_id', type: 'bigint', displayType: 'number' },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'description', type: 'text', displayType: 'string' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ],
      relationships: [
        'class',
        { type: 'junction', table: 'skill', junctionTable: 'subclass_skill' }
      ]
    },
    {
      name: 'skill',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'description', type: 'text', displayType: 'string' },
        { name: 'field_name', type: 'text', displayType: 'string' },
        { name: 'stat_id', type: 'bigint', displayType: 'number' },
        { name: 'ordinal_position', type: 'integer', displayType: 'number' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ],
      relationships: [
        'stat'
      ]
    },
    {
      name: 'ability',
      plural: 'abilities',
      select: '*, character_ability(*)', //needed for the character_ability junction table load
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'subclass_id', type: 'bigint', displayType: 'number' },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'description', type: 'text', displayType: 'string' },
        { name: 'tier', type: 'integer', displayType: 'number' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ],
      relationships: [
        'subclass'
      ]
    },
    {
      name: 'subclass_skill',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'subclass_id', type: 'bigint', displayType: 'number' },
        { name: 'skill_id', type: 'bigint', displayType: 'number' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ]
    },
    {
      name: 'character',
      modelClass: 'Character',
      singleton: {parent: 'player', parent_id: 'player_id'},
      realtime: {
        filter: (gameId) => `game_id=eq.${gameId}`
      },
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'game_id', type: 'bigint', displayType: 'number' },
        { name: 'player_id', type: 'bigint', displayType: 'number' },
        { name: 'ship_id', type: 'bigint', displayType: 'number' },
        { name: 'planet_id', type: 'bigint', displayType: 'number' },
        { name: 'race_id', type: 'bigint', displayType: 'number' },
        { name: 'subclass_id', type: 'bigint', displayType: 'number' },
        { name: 'background', type: 'varchar', displayType: 'string' },
        { name: 'is_npc', type: 'boolean', displayType: 'boolean' },
        { name: 'is_alive', type: 'boolean', displayType: 'boolean' },
        { name: 'is_primary', type: 'boolean', displayType: 'boolean' },
        { name: 'intelligence', type: 'smallint', displayType: 'number' },
        { name: 'dexterity', type: 'smallint', displayType: 'number' },
        { name: 'strength', type: 'smallint', displayType: 'number' },
        { name: 'charisma', type: 'smallint', displayType: 'number' },
        { name: 'intuition', type: 'smallint', displayType: 'number' },
        { name: 'luck', type: 'smallint', displayType: 'number' },
        { name: 'constitution', type: 'smallint', displayType: 'number' },
        { name: 'current_hp', type: 'smallint', displayType: 'number' },
        { name: 'max_hp', type: 'smallint', displayType: 'number' },
        { name: 'core_skill_1_id', type: 'bigint', displayType: 'number' },
        { name: 'core_skill_2_id', type: 'bigint', displayType: 'number' },
        { name: 'core_skill_3_id', type: 'bigint', displayType: 'number' },
        { name: 'core_skill_4_id', type: 'bigint', displayType: 'number' },
        { name: 'core_skill_5_id', type: 'bigint', displayType: 'number' },
        { name: 'vessel_piloting_success_checks', type: 'integer', displayType: 'number' },
        { name: 'drone_piloting_success_checks', type: 'integer', displayType: 'number' },
        { name: 'hardware_maintenance_success_checks', type: 'integer', displayType: 'number' },
        { name: 'computer_engineering_success_checks', type: 'integer', displayType: 'number' },
        { name: 'demolitions_success_checks', type: 'integer', displayType: 'number' },
        { name: 'persuasion_success_checks', type: 'integer', displayType: 'number' },
        { name: 'intimidation_success_checks', type: 'integer', displayType: 'number' },
        { name: 'deception_success_checks', type: 'integer', displayType: 'number' },
        { name: 'bartering_success_checks', type: 'integer', displayType: 'number' },
        { name: 'intuition_success_checks', type: 'integer', displayType: 'number' },
        { name: 'pistols_success_checks', type: 'integer', displayType: 'number' },
        { name: 'rifles_success_checks', type: 'integer', displayType: 'number' },
        { name: 'heavy_weapons_success_checks', type: 'integer', displayType: 'number' },
        { name: 'melee_weapons_success_checks', type: 'integer', displayType: 'number' },
        { name: 'brawling_success_checks', type: 'integer', displayType: 'number' },
        { name: 'foraging_success_checks', type: 'integer', displayType: 'number' },
        { name: 'perception_success_checks', type: 'integer', displayType: 'number' },
        { name: 'animal_handling_success_checks', type: 'integer', displayType: 'number' },
        { name: 'theft_success_checks', type: 'integer', displayType: 'number' },
        { name: 'hacking_success_checks', type: 'integer', displayType: 'number' },
        { name: 'performance_success_checks', type: 'integer', displayType: 'number' },
        { name: 'stealth_success_checks', type: 'integer', displayType: 'number' },
        { name: 'first_aid_success_checks', type: 'integer', displayType: 'number' },
        { name: 'evasion_success_checks', type: 'integer', displayType: 'number' },
        { name: 'education_success_checks', type: 'integer', displayType: 'number' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ],
      relationships: [
        'game',
        { type: 'has-one', table: 'player', includeByDefault: true },
        { type: 'has-one', table: 'ship', includeByDefault: true },
        { type: 'has-one', table: 'planet', includeByDefault: true },
        { type: 'has-one', table: 'race', includeByDefault: true },
        { type: 'has-one', table: 'subclass', includeByDefault: true },
        { type: 'has-one', table: 'skill', foreignKey: 'core_skill_1_id', name: 'core_skill_1', includeByDefault: true },
        { type: 'has-one', table: 'skill', foreignKey: 'core_skill_2_id', name: 'core_skill_2', includeByDefault: true },
        { type: 'has-one', table: 'skill', foreignKey: 'core_skill_3_id', name: 'core_skill_3', includeByDefault: true },
        { type: 'has-one', table: 'skill', foreignKey: 'core_skill_4_id', name: 'core_skill_4', includeByDefault: true },
        { type: 'has-one', table: 'skill', foreignKey: 'core_skill_5_id', name: 'core_skill_5', includeByDefault: true },
        { type: 'junction', table: 'ability', name: 'abilities', junctionTable: 'character_ability', includeByDefault: true }
      ]
    },
    {
      name: 'character_ability',
      plural: 'character_abilities',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'character_id', type: 'bigint', displayType: 'number' },
        { name: 'ability_id', type: 'bigint', displayType: 'number' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ]
    },
    {
      name: 'class_skill',
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'class_id', type: 'bigint', displayType: 'number' },
        { name: 'skill_id', type: 'bigint', displayType: 'number' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ]
    },
    {
      name: 'role',
      realtime: {
        // TODO: Define appropriate filter for role table if needed
        filter: (gameId) => ''
      },
      fields: [
        { name: 'id', type: 'bigint', displayType: 'number', isPrimary: true },
        { name: 'name', type: 'varchar', displayType: 'string' },
        { name: 'description', type: 'text', displayType: 'string' },
        { name: 'created_at', type: 'timestamp with time zone', displayType: 'date' }
      ]
    }
  ]
  
  constructor (options) {
    logger.debug('store', 'DataStore constructor start');
    //Supabase
    this.supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

    /**
     * Create functions for tables
     * over-ride by crating a new function that references it, ie:
     *  let createGames = this.createGames;
     *  this.createGames = (function (gamesData) {
     *    ...implementation
     *    createGames(gamesData) -- this part is optional
     *    ...more implementation
     *  }).bind(this);
     */
    for (let table of this.tables) {
      //ID Default
      table.id = table.id || 'id';
      //Plural Default
      table.plural = table.plural || table.name + 's';
      //Refernce defaults
      table.refTable = table.refTable || 'game';
      table.refKey = table.refKey || table.refTable + '_id';
      //Select default
      table.select = table.select || '*';
      //Singleton defaults - user => {parent: 'user', parent_id: 'id', foreign_key: 'user_id'}
      if (table.singleton) {
        if (typeof table.singleton === 'string') {
          table.singleton = {parent: table.singleton};
        }
        table.singleton.foreignKey = table.singleton.foreignKey || table.singleton.parent + '_id';
        table.singleton.parent_id = table.singleton.parent_id || 'id';
      }
      //Relationship defaults
      table.relationships = table.relationships || [];
      for (let [i, relationship] of table.relationships.entries()) {
        if (typeof relationship === 'string') {
          table.relationships[i] = {table: relationship};
          relationship = table.relationships[i];
        }
        relationship.type = relationship.type || 'has-one'; //could be one-many, has-one, or junction
        relationship.includeByDefault = relationship.includeByDefault || false; // Default to not including in queries
        
        if (relationship.type === 'has-one') {
          relationship.foreignKey = relationship.foreignKey || relationship.table + '_id';
          relationship.name = relationship.name || relationship.table;
          
          // Only add to select if includeByDefault is true
          if (relationship.includeByDefault) {
            // If this is a custom named relationship (like core_skill_1), use both alias AND constraint
            if (relationship.name !== relationship.table) {
              const constraintName = `${table.name}_${relationship.foreignKey}_fkey`;
              table.select += `, ${relationship.name}:${relationship.table}!${constraintName}(*)`;
            } else {
              table.select += `, ${relationship.table}(*)`;
            }
          }
        } else if (relationship.type === 'has-many') {
          relationship.refKey = relationship.refKey || table.name + '_id';
          relationship.id = relationship.id || table.id;
          relationship.name = relationship.name || relationship.table + 's';
          
          // Only add to select if includeByDefault is true
          if (relationship.includeByDefault) {
            table.select += `, ${relationship.table}(*)`;
          }
        } else if (relationship.type === 'junction') {
          // Must provide junctionTable explicitly 
          if (!relationship.junctionTable) {
            throw new Error(`Junction relationship from ${table.name} to ${relationship.table} requires junctionTable name`);
          }

          // Default keys in junction table
          relationship.sourceKey = relationship.sourceKey || `${table.name}_id`;
          relationship.targetKey = relationship.targetKey || `${relationship.table}_id`;
          relationship.foreignKey = relationship.foreignKey || table.id;
          relationship.refKey = relationship.refKey || 'id';
          relationship.name = relationship.name || relationship.table + 's';

          // Only add to select if includeByDefault is true
          if (relationship.includeByDefault) {
            // Update the select statement to include junction and target data
            if (!table.select.includes(relationship.junctionTable)) {
              table.select = `${table.select}, ${relationship.junctionTable}(*, ${relationship.table}(*))`;
            }
          }
        } else {
          throw new error('Unknown relationship type: ' + relationship.type);
        }
      }
      //Defaults for data and loading indicators - starts as true always until loaded
      this.data[table.plural] = [];
      this.data[table.plural + '_loading'] = true;

      
      //Create Many: This creates a function like create_games for each relevant table
      this['create_' + table.plural] = async function (insertData) {
        return this.createMany(table, data);
      }

      //Create One: This creates a helper function like create_game as a shorthand to create a single item
      this['create_' + table.name] = async function (data) {
        return this.createOne(table, data);
      }

      //Load/read helper function
      this['load_' + table.plural] = async function (queryModifier) {
        this.data[table.plural + '_loading'] = true;
        return this.loadMany(table, queryModifier)
      }

      // If there is a singleton - it's a different function and some extra data elements for the singleton load (ie. this.data.game, this.data.game_loading)
      //Placeholders/Defaults for data and loading indicators
      if (table.singleton) {
        this.data[table.name] = null;
        this.data[table.name + '_loading'] = true;
      }

      // Add a generic get single item function, pass singleton true if loading a special item to set it as the singleton
      this['load_' + table.name] = async function (id, isSingleton = false) {
        return this.loadOne(table, id, isSingleton);
      }
    }

    //Fix binding/this issues
    for (let property of Object.getOwnPropertyNames(DataStore.prototype)) {
      try {this[property] = DataStore.prototype[property].bind(this);} catch (e) {}
    }
    logger.debug('store', 'DataStore constructor complete');
  }

  //Used to udpate the data for a single element or array
  updateData (table, item, isSingleton = false) {
    logger.debug('store', 'Updating data for table:', table.name, 'item:', item);
    if (typeof table === 'string') {
      table = this.tables.find((t) => {t.name === table});
    }
    logger.debug('store', 'Updating data for table:', table.name, 'item:', item);
    
    //Try and find if it exists already
    let existingItem = this.data[table.plural].find((el) => el[table.id] === item[table.id]);

    if (existingItem) {
      logger.debug('store', 'Updating existing item in', table.plural);
      //Copy properties
      for (let prop of Object.getOwnPropertyNames(item)) {
        existingItem[prop] = item[prop]
      }

      // Update relationships
      this.updateRelationships(table, existingItem);  

      return existingItem; //use this to update the reference on the calling function's end to include all the pre-existing functions
    } else {
      // Set it as the singleton if it is - has to be here or the loading indicators are useless!
      if (isSingleton) {
        logger.debug('store', 'Setting singleton data for', table.name);
        this.data[table.name] = item;
      }

      // Apply model class if specified for this table
      if (table.modelClass && Models[table.modelClass]) {
        logger.debug('store', `Applying ${table.modelClass} model to item`);
        item = new Models[table.modelClass](item, this);
      }

      //Push it into the array if it doesn't already exist
      logger.debug('store', 'Adding new item to', table.plural);
      this.data[table.plural].push(item);

      // Add helper function for parent item if it can be a singleton
      if (table.singleton) {
        item['get_' + table.singleton.parent] = function() {
          if (table.singleton.parent === 'user' && item[table.singleton.foreignKey] === this.user[table.singleton.parent_id]) {
            //Return the user if the parent is user
            return this.user;
          } else {
            // Try to return the related table's singleton if it's not the user
            try {
              let parentTable = this.tables.find(t => t.name === table.singleton.parent);
              return this.data[parentTable.plural].find(el => el[parentTable.id] === item[table.singleton.foreignKey]);
            } catch (e) {
              return null;
            }
          }
        }.bind(this);
      }
      
      //Add helper functions to allow getting or loading related data for relationships and cache relationship items
      for (const [i, relationship] of table.relationships.entries()) {
        if (relationship.type === 'has-one') {
          /**
           * Has one relationship
           */
          // Add singular load function like get_ship(queryModifier)
          // debugger; //untested code
          const relatedTable = this.tables.find(t => t.name === relationship.table);

          item['load_' + relationship.name] = async function() {
            if (item[relationship.foreignKey]) {
              // Check if already loaded
              const existing = this.data[relatedTable.plural].find(
                el => el[relatedTable.id] === item[relationship.foreignKey]
              );
              
              if (existing) return existing;
              
              // Load if not found
              return this.loadOne(relatedTable, item[relationship.foreignKey]);
            }
            return null;
          }.bind(this);

        } else if (relationship.type === 'has-many') {
          /**
           * Has many relationship
           */
          // Add plural getter like item.getCharacters()
          //First get the related table
          let relatedTable = this.tables.find((t) => relationship.table === t.name);
          item['load_' + relationship.name] = async function(queryModifier) {
            // Start with basic relation query
            const baseModifier = (query) => {
              query.eq(relationship.refKey, item[table.id]);
            };
            
            // Combine with user's query modifier if provided or just pass our own
            const combinedModifier = queryModifier 
              ? (query) => { baseModifier(query); queryModifier(query); }
              : baseModifier;
              
            return this.loadMany(relatedTable, combinedModifier);
          }.bind(this);

          //Add a reference to loaded/cached related items
          item[relationship.name] = this.data[relatedTable.plural].filter((i) => i[relationship.refKey] === item[relationship.id]) || [];

        } else if (relationship.type === 'junction') {
          /**
           * Junction relationship
           */
          const junctionTable = this.tables.find(t => t.name === relationship.junctionTable);
          const targetTable = this.tables.find(t => t.name === relationship.table);
          // debugger; //untested code
          // Add load method for target items through junction
          item['load_' + relationship.name] = async function(queryModifier) {
            // Step 1: Load junction records
            const junctionItems = await this.loadMany(junctionTable, (query) => {
              query.eq(relationship.sourceKey, item[table.id]);
            });
            
            if (!junctionItems || junctionItems.length === 0) return [];
            
            // Step 2: Extract ID's for in clause to the target table
            const targetIds = junctionItems.map(j => j[relationship.targetKey]);

            
            // Step 3: Load abilities with these IDs & the pased in query modifier if present
            return this.loadMany(targetTable, (query) => {
              query.in(targetTable.id, targetIds);
              if (queryModifier) queryModifier(query);
            });
          }.bind(this);
          
          // Initialize relationship collection
          item[relationship.name] = [];
          
          // Process any included junction data already loaded with the character
          if (item[relationship.junctionTable] && Array.isArray(item[relationship.junctionTable])) {
            // Store junction items properly in data store
            for (let junctionItem of item[relationship.junctionTable]) {
              this.updateData(junctionTable, junctionItem);
              
              // Try to find already loaded target items
              const targetItem = this.data[targetTable.plural].find(
                t => t[targetTable.id] === junctionItem[relationship.targetKey]
              );
              
              if (targetItem && !item[relationship.name].includes(targetItem)) {
                item[relationship.name].push(targetItem);
              }
            }
          }
        }
      }  

      // Update relationships
      this.updateRelationships(table, item);
      
      return item;
    }
  }

  // Manage relationships between tables
  updateRelationships (table, item) {
    // Update relationships from other tables to us
    for (let refTable of this.tables.filter(t => t.name !== table.name)) {
      for (let relationship of refTable.relationships) {
        // Only process relationships that reference our table
        if (relationship.table === table.name) {
          if (relationship.type === 'has-one') {
            // Has one means that the id is on objects in the other table
            for (let relatedItem of this.data[refTable.plural]) {
              if (relatedItem[relationship.foreignKey] === item[table.id]) {
                // Use relationship.name instead of relationship.table
                relatedItem[relationship.name] = item;
              }
            }
          } else if (relationship.type === 'has-many') {
            // Has many means that the id is on our end
            for (let relatedItem of this.data[refTable.plural]) {
              if (item[relationship.refKey] === relatedItem[refTable.id]) {
                // Use relationship.name instead of table.plural
                if (!relatedItem[relationship.name]) relatedItem[relationship.name] = [];
                
                // Add if not already in the array
                if (!relatedItem[relationship.name].some(el => el[table.id] === item[table.id])) {
                  relatedItem[relationship.name].push(item);
                }
              }
            }
          } else if (relationship.type === 'junction' && relationship.table === table.name) {
            // Junction relationship handling
            // Find all junction records that reference this item
            const junctionRecords = this.data[relationship.junctionTable] || [];
            
            for (let junction of junctionRecords) {
              if (junction[relationship.targetKey] === item[table.id]) {    
                // Find the source item (character)
                const sourceItem = this.data[refTable.plural].find(
                  s => s[refTable.id] === junction[relationship.sourceKey]
                );
                
                if (sourceItem) {
                  // Initialize array if needed
                  if (!sourceItem[relationship.name]) sourceItem[relationship.name] = [];
                  
                  // Add this item to the collection if not already there
                  if (!sourceItem[relationship.name].some(i => i[table.id] === item[table.id])) {
                    sourceItem[relationship.name].push(item);
                  }
                }
              }
            }
          }
        } else if (relationship.type === 'junction' && relationship.junctionTable === table.name) {
          // Junction relationship handling
          // - we're the junction table connecting source and target
          
          // Find the target table
          const targetTable = this.tables.find(t => t.name === relationship.table);

          // Find source and target items
          const sourceItem = this.data[refTable.plural].find(s => s[refTable.id] === item[relationship.sourceKey]);
          const targetItem = this.data[targetTable.plural].find(t => t[targetTable.id] === item[relationship.targetKey]);

          if (sourceItem && targetItem) {
            // Initialize array if needed
            if (!Array.isArray(sourceItem[relationship.name])) sourceItem[relationship.name] = [];
            
            // Add target to source's collection if not already there
            if (!sourceItem[relationship.name].some(i => i[targetTable.id] === targetItem[targetTable.id])) {
              sourceItem[relationship.name].push(targetItem);
            }

            // Check if there's a reverse relationship defined
            const reverseRel = targetTable.relationships.find(r => 
              r.type === 'junction' && 
              r.table === refTable.name && 
              r.junctionTable === table.name
            );
            
            if (reverseRel) {
              // Initialize reverse collection if needed
              if (!Array.isArray(targetItem[reverseRel.name])) targetItem[reverseRel.name] = [];
              
              // Add source to target's collection if not already there
              if (!targetItem[reverseRel.name].some(i => i[refTable.id] === sourceItem[refTable.id])) {
                targetItem[reverseRel.name].push(sourceItem);
              }
            }
          }
        }
      }
    }

    // Update relationships from us to other tables
    for (let relationship of table.relationships) {
      const relatedTable = this.tables.find(t => t.name === relationship.table);

      if (relationship.type === 'has-one') {
        // Has one means I have the id on my side and there is only one possible related item 
        // - so update it in case the foreign key changed
        item[relationship.name] = this.data[relatedTable.plural].find(
          el => el[relatedTable.id] === item[relationship.foreignKey]
        ) || null;
      } else if (relationship.type === 'has-many') {
        // Has many means I have the id on the other side and there are multiple possible related items
        // - so update it if it doesn't exist, otherwise other items will add themselves on load
        if (!Array.isArray(item[relationship.name])) {
          item[relationship.name] = this.data[relatedTable.plural].filter(
            el => el[relationship.refKey] === item[table.id]
          ) || [];
        } 
      } else if (relationship.type === 'junction') {
        // Junction means I need to check the contents of the junction table and target table
        //Get the junction table
        const junctionTable = this.tables.find(t => t.name === relationship.junctionTable);

        // Initialize collection if needed
        if (!Array.isArray(item[relationship.name])) {
          item[relationship.name] = [];
        }

        // Find all junction records that reference this item
        const junctionRecords = this.data[junctionTable.plural] || [];
        
        for (let junction of junctionRecords) {
          if (junction[relationship.sourceKey] === item[relationship.foreignKey]) {        
            // if (table.name === 'character')debugger;
            // Find the target items
            const targetItem = this.data[relatedTable.plural].find(
              t => t[relationship.refKey] === junction[relationship.targetKey]
            );
            
            if (targetItem && !item[relationship.name].some(i => i[relationship.refKey] === targetItem[relationship.refKey])) {
              item[relationship.name].push(targetItem);
            }
          }
        }
      }
    }
  }

  // Process nested data from Supabase queries
  async processNestedData(table, data) {
    // Skip if no data
    if (!data || data.length === 0) return;
    
    // Process each relationship defined for this table
    for (const relationship of table.relationships) {
      if (relationship.type === 'has-one') {
        // For has-one, look for the relationship.name field (could be namespaced like core_skill_1)
        for (const item of data) {
          const fieldName = relationship.name; // Use the relationship name for has-one
          
          if (item[fieldName]) {
            const relatedItem = item[fieldName];
            if (relatedItem) {
              // Delete the reference so updateData can use the existing object if it already exists
              delete item[fieldName];
              const relatedTable = this.tables.find(t => t.name === relationship.table);
              this.updateData(relatedTable, relatedItem);
            }
          }
        }
      }
      else if (relationship.type === 'has-many') {
        // For has-many, Supabase returns data under the table name, not the relationship name
        for (const item of data) {
          const fieldName = relationship.table; // Use table name for has-many
          
          if (item[fieldName] && Array.isArray(item[fieldName])) {
            const relatedItems = item[fieldName];
            const relatedTable = this.tables.find(t => t.name === relationship.table);
            
            for (const relatedItem of relatedItems) {
              if (relatedItem) {
                this.updateData(relatedTable, relatedItem);
              }
            }
            
            // Remove the array to prevent duplicate processing
            delete item[fieldName];
          }
        }
      }
      else if (relationship.type === 'junction') {
        // For junction tables, process both junction and target items
        const junctionTable = this.tables.find(t => t.name === relationship.junctionTable);
        const targetTable = this.tables.find(t => t.name === relationship.table);
        
        for (const [i, item] of data.entries()) {
          // Junction data comes back under the junction table name
          if (item[relationship.junctionTable] && Array.isArray(item[relationship.junctionTable])) {
            const junctionItems = item[relationship.junctionTable];
            
            // Remove the junction array to prevent duplicate processing
            delete item[relationship.junctionTable];
            
            for (const junctionItem of junctionItems) {
              // if (table.name === 'character')debugger;
              // First process target items within the junction if they exist
              if (junctionItem[relationship.table]) {
                const targetItem = Array.isArray(junctionItem[relationship.table]) 
                  ? junctionItem[relationship.table][0] 
                  : junctionItem[relationship.table];
                  
                if (targetItem) {
                  // Remove nested target to prevent breaking references with existing objects
                  delete junctionItem[relationship.table];

                  // Process target item
                  this.updateData(targetTable, targetItem);
                }
              }
              
              // Process junction item
              this.updateData(junctionTable, junctionItem);
            }
          }
        }
      }
    }
  }

  async createMany (table, insertData) {
    try {
      //If the table passed in was a string, find the correct table element
      if (typeof table === 'string') {
        table = this.tables.find((t) => t.name === table);
      }

      this.data[table.plural + '_loading'] = true;

      let {data, error} = await this.supabase
        .from(table.name)
        .insert(insertData)
        .select();

      if(error) throw new Error(error.error.message);

      for (const [i, item] of data) {
        data[i] = this.updateData(table, item);
      }
    } catch (e) {
      console.log(e.message);
      throw e;
    } finally {
      this.data[table.plural + '_loading'] = false;
    }

    
    return data
  }

  async createOne (table, insertData) {
    let data = await this.createMany(table, [insertData]);
    return data[0];
  }

  async loadMany (table, queryModifier, isSingleton = false) {
    let data, error;
    try {
      if (typeof table === 'string') {
        table = this.tables.find((t) => t.name === table);
      }
      logger.debug('store', 'Starting loadMany for', table.name);
      
      this.data[table.plural + '_loading'] = true;

      //Make sure we have a user
      if (!this.user) {
        await this.checkAuth();
      }
      
      //Start query
      let query = this.supabase
        .from(table.name)
        .select(table.select);

      //Apply modifications/additional queries
      if (queryModifier) {
        queryModifier(query);
      }

      //Await the response
      const result = await query;
      data = result.data;

      logger.debug('store', 'Received data for', table.name, data);
      
      // Extract and process related data before the main items
      await this.processNestedData(table, data);
      
      //Update references and helper functions
      for (const [i, item] of data.entries()) {
        data[i] = this.updateData(table, item, isSingleton);
      }

    } catch (e) {
      logger.error('store', 'Error in loadMany:', e);
      throw e;
    } finally {
      this.data[table.plural + '_loading'] = false;
      logger.debug('store', 'Completed loadMany for', table.name);
    }

    
    return data;
  }

  async loadOne (table, id, isSingleton = false) {
    let data;
    
    if (typeof table === 'string') {
      table = this.tables.find((t) => t.name === table);
    }
    logger.debug('store', 'Starting loadOne for', table.name, 'id:', id);
    
    if (isSingleton) {
      this.data[table.name + '_loading'] = true;
    }
    
    try {
      //Id should be the id or blank if it's another singleton - it could be a query modifier function though
      let queryModifier;
      if (typeof id === 'function') {
        queryModifier = id;
      } else {
        // Add the id query
        queryModifier = (query) => {
          query.eq(table.id, id);
        }
      }

      //Using the loadMany function ensure that it's in the main array for this element as well for any potential async updates
      data = await this.loadMany(table, queryModifier, isSingleton);

      if (data.length > 1) {
        logger.error('store', 'Multiple items returned for singleton load');
        throw new Error('More than one item returned from load one function')
      }

    } catch (e) {
      logger.error('store', 'Error in loadOne:', e);
      //Rethrow
      throw e;
    } finally {
      //Notify that we are loaded
      if (isSingleton) {
        this.data[table.name + '_loading'] = false;
        logger.debug('store', 'Completed loadOne for singleton', table.name);
      }
    }

    return this.data[table.name];
  }

  //Necessary because the relationship is on user, not game or another sub object
  async loadGames () {
    this.loadMany('game', (query) => {
      query.eq('user_id', this.user.id);
    });
  }

  //Check if we're logged in or not
  async checkAuth () {
    try {
      //Ensure only one request is going at a time/allow multiple checks
      if (this.user_loading_promise) return this.user_loading_promise;
      
      this.user_loading = true;

      this.user_loading_promise = this.supabase.auth.getUser();
      const {data, error} = await this.user_loading_promise;

      this.user_loading = false;

      if(error && error.name !== 'AuthSessionMissingError') {
        throw new Error('Auth check failed: ' + error.message);
        console.log(error.message, error)
      } else if (data.user) {
        this.user = data.user;
        return true;
      } else {
        this.user = null;
        return false;
      }
    } catch (e) {
      throw e;
    } finally {
      this.user_loading_promise = null;
    }
  };

  async logInEmail (email, password) {
    //TODO - move from the login page
  }

  async logOut () {
    //TODO - move from the logout page
  }
}