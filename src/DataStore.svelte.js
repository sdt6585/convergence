// Supabase
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';


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
    ]},
    {name: 'player', singleton: {parent: 'game'}, relationships: [
      {table: 'character', type: 'has-many'}
    ]},
    {name: 'ship', relationships: [
      {table: 'character', type: 'has-many'}
    ]},
    {name: 'character', singleton: {parent: 'game'}, relationships: ['player']},
    {name: 'planet', relationships: [
      {table: 'character', type: 'has-many'}
    ]},
    {name: 'star_system', singleton: {parent: 'game'},relationships: ['star_system_object']},
    {name: 'star_system_object', refTable: 'star_system'}
  ]
  
  constructor (options) {
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
        relationship.type = relationship.type || 'has-one' //could be one-many, has-one, or junction
        if (relationship.type === 'has-one') {
          relationship.foreignKey = relationship.foreignKey || relationship.table + '_id';
        } else if (relationship.type === 'has-many') {
          relationship.refKey = relationship.refKey || table.name + '_id';
          relationship.id = relationship.id || table.id;
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
          
          // Update the select statement to include junction data if needed
          if (!table.select.includes(relationship.junctionTable)) {
            table.select = `${table.select}, ${relationship.junctionTable}(*)`;
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
  }

  //Used to udpate the data for a single element or array
  updateData (table, item, isSingleton = false) {
    if (typeof table === 'string') {
      table = this.tables.find((t) => {t.name === table});
    }
    //Try and find if it exists already
    let existingItem = this.data[table.plural].find((el) => {el[table.id] === item[table.id]});

    if (existingItem) {
      //Copy properties
      for (let prop of Object.getOwnPropertyNames(item)) {
        existingItem[prop] = item[prop]
      }

      return existingItem; //use this to update the reference on the calling function's end to include all the pre-existing functions
    } else {
      // Set it as the singleton if it is - has to be here or the loading indicators are useless!
      if (isSingleton) {
        this.data[table.name] = item;
      }

      //Push it into the array if it doesn't already exist
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
      
      //Update any references to us from other tables:
      for (let refTable of this.tables.filter(t => t.name !== table.name)) {
        for (let relationship of refTable.relationships) {
          // Only process relationships that reference our table
          if (relationship.table === table.name) {
            if (relationship.type === 'has-one') {
              // Has one means that the id is on objects in the other table
              for (let relatedItem of this.data[refTable.plural]) {
                if (relatedItem[relationship.foreignKey] === item[table.id]) {
                  relatedItem[relationship.table] = item;
                }
              }
            } else if (relationship.type === 'has-many') {
              // Has many means that the id is on our end
              for (let relatedItem of this.data[refTable.plural]) { // Changed from table.plural to refTable.plural
                if (relatedItem[relationship.refKey] === item[relationship.id]) {
                  if (!relatedItem[table.plural]) relatedItem[table.plural] = [];
                  relatedItem[table.plural].push(item);
                }
              }
            } else if (relationship.type === 'junction' && relationship.junctionTable === table.name) {
              // This table has a relationship using our junction table
              //TODO - this has not been debugged at all and was made by claude!
              // debugger;
              
              // Find the relevant item in the source table
              const sourceItem = this.data[refTable.plural].find(
                srcItem => srcItem[refTable.id] === item[relationship.sourceKey]
              );
              
              // Find the relevant item in the target table
              const targetTable = this.tables.find(t => t.name === relationship.table);
              const targetItem = this.data[targetTable.plural].find(
                tgtItem => tgtItem[targetTable.id] === item[relationship.targetKey]
              );
              
              // Update their cached references if they exist
              if (sourceItem && sourceItem[targetTable.plural]) {
                if (!sourceItem[targetTable.plural].some(
                  tgt => tgt[targetTable.id] === targetItem[targetTable.id]
                )) {
                  sourceItem[targetTable.plural].push(targetItem);
                }
              }
              
              if (targetItem && targetItem[refTable.plural]) {
                if (!targetItem[refTable.plural].some(
                  src => src[refTable.id] === sourceItem[refTable.id]
                )) {
                  targetItem[refTable.plural].push(sourceItem);
                }
              }
            }
          }
        }
      }

      //Add helper functions to allow getting or loading related data for relationships and cache relationship items
      for (const [i, relationship] of table.relationships.entries()) {
        if (relationship.type === 'has-one') {
          /**
           * Has one relationship
           */
          // Add singular load function like get_ship(queryModifier)
          // debugger; //untested code
          item['load_' + relationship.table] = async function() {
            if (item[relationship.foreignKey]) {
              // Check if already loaded
              const relatedTable = this.tables.find(t => t.name === relationship.table);
              const existing = this.data[relatedTable.plural].find(
                el => el[relatedTable.id] === item[relationship.foreignKey]
              );
              
              if (existing) return existing;
              
              // Load if not found
              return this.loadOne(relationship.table, item[relationship.foreignKey]);
            }
            return null;
          }.bind(this);

          // Add a reference to loaded/cached related item
          item[relationship.table] = this.data[relationship.table] || null;

        } else if (relationship.type === 'has-many') {
          /**
           * Has many relationship
           */
          // Add plural getter like item.getCharacters()
          //First get the related table
          let relatedTable = this.tables.find((t) => relationship.table === t.name);
          item['load_' + relatedTable.plural] = async function(queryModifier) {
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
          item[relatedTable.plural] = this.data[relatedTable.plural].filter((i) => i[relationship.refKey] === item[relationship.id]) || [];

        } else if (relationship.type === 'junction') {
          /**
           * Junction relationship
           */
          const targetTable = this.tables.find(t => t.name === relationship.table);

          //Store the related subquery data 
          for (let [i, junctionItem] of item[relationship.junctionTable].entries()) {
            item[relationship.junctionTable][i] = this.updateData(relationship.junctionTable, junctionItem);
          }
          
          // Add load method for target items through junction
          const baseModifier = (query) => {
            query.eq(`${relationship.junctionTable}.${relationship.sourceKey}`, item[table.id]);
          }
          item['load_' + targetTable.plural] = async function(queryModifier) {
            const combinedModifer = queryModifier 
              ? (query) => {baseModifier(query); queryModifier(query);}
              : baseModifier;
            ;
            
            return this.loadMany(targetTable, combinedModifer);
          }.bind(this);
          
          // Add reference to loaded/cached related items
          item[targetTable.plural] = this.data[targetTable.plural].filter(i => {
            //TODO - this should probably reference a separate array in this.data....
            //Make sure the array exists
            if (!i[relationship.junctionTable] || !Array.isArray(i[relationship.junctionTable])) {
              return false;
            }

            //Check if the junction array has anything that matches our id
            let matchesOurId = i[relationship.junctionTable].filter(j => j[relationship.sourceKey] === item[relationship.foreignKey]);

            return matchesOurId.length > 0;
          }) || [];
        }
      }
      
      return item;
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
      
      this.data[table.plural + '_loading'] = true;

      //Make sure we have a  user
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

      //Update references and helper functions
      for (const [i, item] of data.entries()) {
        data[i] = this.updateData(table, item, isSingleton);
      }

    } catch (e) {
      console.log(e.message);
      throw e;
    } finally {
      this.data[table.plural + '_loading'] = false;
    }

    
    return data;
  }

  async loadOne (table, id, isSingleton = false) {
    let data;
    try {
      //Id should be the id or blank if it's another singleton - it could be a query modifier function though
      let queryModifier;
      if (typeof id === 'function') {
        queryModifier = id;
      } else {
        // Add the id query
        queryModifier = (query) => {
          query.eq(table.id, id);

          //Build the query to find the right relationship TODO - remove this but I think something like it will be required eventually for the inverse relationship query
          // //User is special since it's outside the main data and has a different 
          // if(table.singleton.parent === 'user') {
          //   query.eq(table.singleton.foreignKey, this.user[table.singleton.parent_id]);
          // } else {
          //   query.eq(table.singleton.foreignKey, this.data[table.singleton.parent][table.singleton.parent_id]);
          // }
        }
      }

      //Notify that we're loading if it's a singleton (loadMany call below will do the same for the plural)
      if (isSingleton) {
        this.data[table.name + '_loading'] = true;
      }

      //Using the loadMany function ensure that it's in the main array for this element as well for any potential async updates
      data = await this.loadMany(table, queryModifier, isSingleton);

      if (data.length > 1) {
        throw new Error('More than one item returned from load one function')
      }

    } catch (e) {
      //Rethrow
      throw e;
    } finally {
      //Notify that we are loaded
      if (isSingleton) {
        this.data[table.name + '_loading'] = false;
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