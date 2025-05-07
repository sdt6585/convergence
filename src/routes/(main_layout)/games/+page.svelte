<script>
  //Styles
  import '@styles/app.css';
  //Supabase
  import { createClient } from '@supabase/supabase-js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  //Utility
  import { getPath } from '@utils/navigation';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { fly } from 'svelte/transition';
  //Components
  import Modal from '@components/Modal.svelte';

  /**
   * Create runes for state management
   */
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  let user = {};
  let email = $state();
  let games = $state([]);
  let loading = $state(true);

  // Browser only - make sure we're loaded
  onMount(async () => {
    /**
     * Check if we're logged in
     */
    let userResponse = await supabase.auth.getUser();
    user = userResponse.data.user;
    email = user?.email;

    // console.log(user);
    // Send them to the login if they aren't logged in
    if (!email) {
      goto(getPath('/login'));
    }

    const gameResponse = await supabase
      .from('game')
      .select('*')
      .eq('user_id', user.id);
    
    if(gameResponse.error) throw new Error(gameResponse.error.message);
    games = [...games, ...gameResponse.data];
    loading = false;
  });

  /**
   * Create game modal
   */
  let gameModal;
  let gameName = $state('');
  let errors = $state({name: ''});
  
  function validateForm() {
    let isValid = true;
    
    // Reset errors
    errors = { name: '' };
    
    // Validate name
    if (!gameName.trim()) {
      errors.name = 'Game name is required';
      isValid = false;
    }
    
    return isValid;
  }
  
  async function handleCreateGame(event) {
    event.preventDefault();
    
    if (validateForm()) {
      // Do something with the game name
      let insertGameResponse = await supabase
        .from('game')
        .insert([
          { name: gameName, user_id: user.id },
        ])
        .select()
      
      if(insertGameResponse.error) throw new Error(insertGameResponse.error.message);

      //Update and re-render the games list
      games = [...games, ...insertGameResponse.data]
      
      // Reset form and close modal
      gameName = '';
      gameModal.close();
      
      // Your existing code to handle game creation
    }
  }
  
  function handleCancel() {
    // Reset form
    gameName = '';
    errors = { name: '' };
  }
</script>


<div class="container">
  {#if games.length > 0}
    <div style="display:flex;">
      <h2>Games</h2>
      <button class="btn btn-primary" style="margin-left: auto;" onclick={() => {gameModal.open()}}>+ Create</button>
    </div>
    
    <ul class="games" style="font-size: 1.5rem">
      {#each games as game}
        <li style="margin-left:20px;"><a href={getPath(`/game#game_id=${game.id}`)}>{game.name}</a></li>
        {/each}
    </ul>
  {:else if !loading}
    <div style="text-align: center;">
      <h2>Create your first Game!</h2>
      <button class="btn btn-primary" style="margin-top: 10px;" onclick={() => {gameModal.open()}}>+ Create</button>
    </div>
  {:else}
    <h1>Loading...</h1>
  {/if}
</div>

<Modal 
  bind:this={gameModal}
  title="Create New Game"
  closeable={true}
  onClose={handleCancel}
>
  <form class="modal-form" onsubmit={handleCreateGame}>
    <div class="form-group">
      <label for="game-name">Game Name</label>
      <input 
        type="text" 
        id="game-name" 
        placeholder="Enter game name"
        bind:value={gameName}
        class={errors.name ? 'error' : ''}
      />
      {#if errors.name}
        <div class="error-message">
          {errors.name}
        </div>
      {/if}
    </div>
    
    <div class="modal-actions">
      <button type="button" class="btn" onclick={() => {
        handleCancel();
        gameModal.close();
      }}>
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">
        Create
      </button>
    </div>
  </form>
</Modal>

<style>
  .container {
    padding: 20px;
  }
  .modal-actions {
    margin-top: 1rem;
  }
</style>