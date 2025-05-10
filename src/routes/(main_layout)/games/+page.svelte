<script>
  //Styles
  import '@styles/app.css';
  //Utility
  import { getPath } from '@utils/navigation';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { fly } from 'svelte/transition';
  import { getContext } from 'svelte';
  //Components
  import Modal from '@components/Modal.svelte';

  /**
   * Make sure games is loaded
   */
  let store = getContext('store');
  onMount(() => {
    store.load_games();
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
  
  async function handleCreateGame(e) {
    e.preventDefault();
    
    if (validateForm()) {
      // Create the game
      await store.create_game({ name: gameName, user_id: store.user.id });
      
      // Reset form and close modal
      gameName = '';
      gameModal.close();
    }
  }
  
  function handleCancel() {
    // Reset form
    gameName = '';
    errors = { name: '' };
  }
</script>


<div class="container">
  {#if store.data.games.length > 0}
    <div style="display:flex;">
      <h2>Games</h2>
      <button class="btn btn-primary" style="margin-left: auto;" onclick={() => {gameModal.open()}}>+ Create</button>
    </div>
    
    <ul class="games" style="font-size: 1.5rem">
      {#each store.data.games as game}
        <li style="margin-left:20px;"><a href={getPath(`/game?game_id=${game.id}`)}>{game.name}</a></li>
        {/each}
    </ul>
  {:else if !store.data.games_loading}
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
  type="confirm_cancel"
  confirmText="Create"
  closeable={true}
  onClose={handleCancel}
  onConfirm={handleCreateGame}
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
    
    <!-- <div class="modal-actions">
      <button type="button" class="btn" onclick={() => {}}>
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">
        Create
      </button>
    </div> -->
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