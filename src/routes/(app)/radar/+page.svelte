<script>
  import RadarGame from './RadarGame.svelte';
</script>

<div class="app">
  <h1>Gargantua Tactical Radar</h1>
  <p class="instructions">
    Click on a ship to select it and see its possible movement area.
    Drag from a selected ship to set a new velocity vector.
    Right-click on a ship to open action menu.
    Use the "Next Turn" button to advance the simulation.
  </p>
  <RadarGame />
</div>

<style>
  .app {
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 2rem;
    background-color: #001122;
    color: #00ff00;
    min-height: 100vh;
  }
  
  h1 {
    margin-bottom: 1rem;
  }
  
  .instructions {
    margin-bottom: 2rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
</style>