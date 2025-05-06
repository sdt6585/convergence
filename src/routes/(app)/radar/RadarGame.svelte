<script>
  import { onMount, onDestroy } from 'svelte';
  import { simulateTurn, resetShips } from './gameStore.js';
  
  // Container reference
  let gameContainer;
  let game;
  
  onMount(async () => {
    // Dynamically import the client-side module
    const { createPhaserGame } = await import('./phaser-client.js');
    
    // Create Phaser game once the component is mounted and the module is loaded
    if (gameContainer) {
      game = createPhaserGame(gameContainer);
    }
  });
  
  onDestroy(() => {
    // Clean up Phaser game when component is destroyed
    if (game) {
      game.destroy(true);
    }
  });
  
  function nextTurn() {
    simulateTurn();
  }
  
  function reset() {
    resetShips();
  }
</script>

<div class="radar-game">
  <div class="radar-container" bind:this={gameContainer}></div>
  <div class="game-controls">
    <button on:click={nextTurn}>Next Turn</button>
    <button on:click={reset}>Reset</button>
  </div>
</div>

<style>
  .radar-game {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .radar-container {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 400px;
    background-color: #000033;
    overflow: hidden;
  }
  
  .game-controls {
    padding: 10px;
    display: flex;
    gap: 10px;
    background-color: #001133;
  }
  
  button {
    padding: 8px 16px;
    background-color: #003366;
    color: #00ff00;
    border: 1px solid #00ff00;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #004477;
  }
</style>