// Supabase
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { Data } from 'phaser';


export default class DataStore {
  user = $state(null);
  game = $state(null);
  ships = $state([]);
  characters = $state([]);
  planets = $state([]);
  star_systems = $state([]);

  
  constructor (options) {
    //Supabase
    this.PUBLIC_SUPABASE_URL = options.PUBLIC_SUPABASE_URL
    this.PUBLIC_SUPABASE_ANON_KEY = options.PUBLIC_SUPABASE_ANON_KEY
    this.supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  }

  //Check if we're logged in or not
  async checkAuth () {
    let {data, error} = await supabase.auth.getUser();
    if(error) {
      throw new Error(error.message);
    } else if (data.user) {
      this.user = data.user;
      return true;
    } else {
      this.user = null;
      return false;
    }
  };

  async logIn () {

  }
}