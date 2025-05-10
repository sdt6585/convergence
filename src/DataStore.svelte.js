// Supabase
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';


export default class DataStore {
  user = $state(null);
  user_loading = $state(true);
  user_loading_promise = null;
  // games = $state([]);
  // games_loading = $state(true);
  game = $state(null);
  game_loading = $state(true);
  // ships = $state([]);
  // ships_loading = $state(true);
  // characters = $state([]);
  // characters_loading = $state(true);
  // planets = $state([]);
  // planets_loading = $state([]);
  // star_systems = $state([]);
  // star_systems_loading = $state(true);
  data = $state([]);
  /**
   * List of tables - turns into data.table_loading, data.tables, this.create_tables(), this.create_table(), this.load_tables(), etc below
   * singleton - if true, allow selection of a single element and a this.table/this.table_loading object, and changes the this.load_table to find the right id and save the instance
   * plural - defaults to just add an s, use it for non normative plurals like die/dice, mouse/mice, deer/deer
   * key - either user_id or a singleton reference, defaults to game_id
   * select - the query sent to supabase - defaults to *
   */
  tables = [
    {name: 'game', refTable: 'user', singleton: true},
    {name: 'player', singleton: true, select: '*, player_character(*, character(*)))'}, //maybe needs a separate singletonRefTable?
    {name: 'ship'},
    {name: 'character', singleton: true},
    {name: 'planet'},
    {name: 'star_system', singleton: true},
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
      //Plural Default
      table.plural = table.plural || table.name + 's';
      //Refernce defaults
      table.refTable = table.refTable || 'game';
      table.refKey = table.refKey || table.refTable + '_id';
      //Select default
      table.select = table.select || '*';
      //Placeholders/Defaults for data and loading indicators
      this.data[table.plural] = [];
      this.data[table.plural + '_loading'] = true;

      
      //Create Many: This creates a function like create_games for each relevant table
      this['create_' + table.plural] = async function (insertData) {
        try {
          this.data[table.plural + '_loading'] = true;

          let {data, error} = await this.supabase
            .from(table.name)
            .insert(insertData)
            .select();

          if(error) throw new Error(error.error.message);
          
          this.data[table.plural] = [...this.data[table.plural], ...data];
        } catch (e) {
          console.log(e.message);
          throw e;
        } finally {
          this.data[table.plural + '_loading'] = false;
        }

        
        return this[table.plural]
      }

      //Create One: This creates a helper function like create_game as a shorthand to create a single item
      this['create_' + table.name] = async function (data) {
        return this['create_' + table.plural]([data]);
      }

      //Load/read helper function
      this['load_' + table.plural] = async function (id) {
        try {
          this.data[table.plural + '_loading'] = true;

          //Make sure we have a  user
          if (!this.user) {
            await this.checkAuth();
          }

          //Make sure we have a foreign key
          if (!id) {
            if(table.refTable === 'user') {
              id = this.user.id;
            } else {
              //This finds a singleton, ie game.game_id
              id = this.data[table.refTable].id;
            }
          }
          
          const {data, error} = await this.supabase
            .from(table.name)
            .select(table.select)
            .eq(table.refKey, id);
          
          this.data[table.plural] = data;
        } catch (e) {
          console.log(e.message);
          throw e;
        } finally {
          this.data[table.plural + '_loading'] = false;
        }

        
        return this[table.plural]
      }

      // If there is a singleton - it's a different function and some extra data elements for the singleton load (ie. this.data.game, this.data.game_loading)
      if (table.singleton) {
        //Placeholders/Defaults for data and loading indicators
        this.data[table.name] = [];
        this.data[table.name + '_loading'] = true;

        this['load_' + table.name] = async function (id) {
          try {
            this.data[table.name + '_loading'] = true;
  
            //Make sure we have a  user
            if (!this.user) {
              await this.checkAuth();
            }
  
            const {data, error} = await this.supabase
              .from(table.name)
              .select(table.select)
              .eq('id', id);
            
            this.data[table.name] = data[0];
          } catch (e) {
            console.log(e.message);
            throw e;
          } finally {
            this.data[table.name + '_loading'] = false;
          }
  
          
          return this[table.name]
        }
      }
    }

    //Fix binding/this issues
    for (let property of Object.getOwnPropertyNames(DataStore.prototype)) {
      try {this[property] = DataStore.prototype[property].bind(this);} catch (e) {}
    }
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

  }

  async logOut () {

  }

  // async loadGames () {
  //   this.games_loading = true;

  //   //Make sure we have a  user
  //   if (!this.user) {
  //     await this.checkAuth();
  //   }

  //   const {data, error} = await this.supabase
  //     .from('game')
  //     .select('*')
  //     .eq('user_id', $state.snapshot(this.user.id));
    
  //   if(error) throw new Error(error.message);

  //   this.games = data;

  //   this.games_loading = false;
  // }

  // async createGame (gameData) {
  //   return this.createGames ([gameData]);
  // }
  // async createGames (gamesData) {
  //   // Do something with the game name
  //   let {data, error} = await this.supabase
  //     .from('game')
  //     .insert(gamesData)
  //     .select()

  //   if(error) throw new Error(error.error.message);


  //   this.games = [...this.games, ...data];
  //   return data
  // }
}