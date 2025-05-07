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
  import PanelSelector from './components/PanelSelector.svelte';


  /**
   * Create runes for state management
   */
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  let email = $state();

  // Set up panel state with default values
  // These defaults will be used during SSR
  let leftPanelWidth = $state('400px');
  let leftPanelContent = $state('player_ship');
  let leftPanelCollapsed = $state(false);
  let leftPanelName = $state('Player Ship');
  let leftPanelSliding = $state(false);
  let centerPanelContent = $state('chat');
  let rightPanelWidth = $state('400px');
  let rightPanelContent = $state('npc');
  let rightPanelCollapsed = $state(false);
  let rightPanelName = $state('NPC');
  let rightPanelSliding = $state(false);
  let windowWidth = $state(1024);

  onMount(async () => {
    /**
     * Check if we're logged in
     */
    let user = await supabase.auth.getUser();
    email = user?.data?.user?.email;

    // console.log(user);
    // Send them to the login if they aren't logged in
    if (!email) {
      goto(getPath('/login'));
    }

    // Unmount general mouse listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  });

  /**
   * Load panel defaults from local storage
   */
  //TODO - needs more complex defaults and access controls for GM vs. Player
  if (browser) {
    leftPanelWidth = localStorage.getItem('leftPanelWidth') || leftPanelWidth;
    leftPanelContent = localStorage.getItem('leftPanelContent') || leftPanelContent;
    leftPanelCollapsed = localStorage.getItem('leftPanelCollapsed') === 'true' || leftPanelCollapsed;
    centerPanelContent = localStorage.getItem('centerPanelContent') || centerPanelContent;
    rightPanelWidth = localStorage.getItem('rightPanelWidth') || rightPanelWidth;
    rightPanelContent = localStorage.getItem('rightPanelContent') || rightPanelContent;
    rightPanelCollapsed = localStorage.getItem('rightPanelCollapsed') === 'true';
    windowWidth = window.innerWidth;
  }

  /**
   * Panel change events
   */
  let onLeftPanelChanged = (newPanel) => {
    localStorage.setItem('leftPanelContent', newPanel);
  }

  let leftPanelToggle = () => {
    leftPanelCollapsed = !leftPanelCollapsed;
    localStorage.setItem('leftPanelCollapsed', leftPanelCollapsed.toString());
  }

  let onRightPanelChanged = (newPanel) => {
    localStorage.setItem('rightPanelContent', newPanel);
  }

  let onCenterPanelChanged = (newPanel) => {
    localStorage.setItem('centerPanelContent', newPanel);
  }
  
  let rightPanelToggle = () => {
    rightPanelCollapsed = !rightPanelCollapsed;
    localStorage.setItem('rightPanelCollapsed', rightPanelCollapsed.toString());
  }

  /**
   * Panel width management
  */
  let isDraggingLeft = $state(false);
  let isDraggingRight = $state(false);
  let startX = $state(0);
  let startLeftWidth = $state(0);
  let startRightWidth = $state(0);

  // Handle mousedown on the resize handles
  function handleMouseDown(e, side) {
    e.preventDefault();
    
    if (side === 'left') {
      isDraggingLeft = true;
      startX = e.clientX;
      startLeftWidth = parseInt(leftPanelWidth, 10);
    } else {
      isDraggingRight = true;
      startX = e.clientX;
      startRightWidth = parseInt(rightPanelWidth, 10);
    }
    
    // Add listeners for mousemove and mouseup
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // Handle mouse movement during drag
  function handleMouseMove(e) {
    if (!isDraggingLeft && !isDraggingRight) return;
    
    if (isDraggingLeft) {
      // Calculate new width based on mouse movement
      const newWidth = startLeftWidth + (e.clientX - startX);
      
      // Set minimum and maximum widths
      const minWidth = 200;
      const maxWidth = window.innerWidth / 2;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        leftPanelWidth = `${newWidth}px`;
        localStorage.setItem('leftPanelWidth', leftPanelWidth);
      }
    } else if (isDraggingRight) {
      // Calculate how much the mouse moved
      const delta = startX - e.clientX;
      
      // Calculate new width
      const newWidth = startRightWidth + delta;
      
      // Set minimum and maximum widths
      const minWidth = 200;
      const maxWidth = window.innerWidth / 2;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        rightPanelWidth = `${newWidth}px`;
        localStorage.setItem('rightPanelWidth', rightPanelWidth);
      }
    }
  }

  // Handle mouseup to stop dragging
  function handleMouseUp() {
    isDraggingLeft = false;
    isDraggingRight = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
</script>

{#if windowWidth > 768}
  <!-- Desktop Layout -->
  <div class="panel-layout">
    {#if !leftPanelCollapsed}
      <div class="panel panel-left" 
          transition:fly={{x: -300, duration: 300}} 
          onoutrostart={() => {leftPanelSliding = true; console.log('slideStart');}}
          onoutroend={() => {leftPanelSliding = false; console.log('slideEnd');}}
          style="width: {leftPanelWidth}">
        
        <div class="panel-header">
          <PanelSelector value={leftPanelContent} bind:name={leftPanelName} onChange={onLeftPanelChanged} />
          <button class="collapse-button" onclick={leftPanelToggle}> |← </button>
        </div>
        
        <div class="panel-content"></div>
      </div>
    {:else if !leftPanelSliding}
      <div class="panel-collapsed panel-left-collapsed">
        <button class="collapse-button" onclick={leftPanelToggle}> →| </button>
        <h3>{leftPanelName}</h3>
      </div>
    {/if}
    
    <!-- Left resize handle (only shown when left panel is visible) -->
    <button class="panel-resize-handle left-resize-handle" aria-label="resize-right-panel"
        style="display: {!leftPanelCollapsed ? 'flex' : 'none'}"
        onmousedown={(e) => handleMouseDown(e, 'left')}
    ></button>
    
    <!-- Center panel (always visible, flexes to fill space) -->
    <div class="panel panel-center">
      
      <div class="panel-header">
        <PanelSelector value={centerPanelContent} onChange={onCenterPanelChanged} />
      </div>

      <div class="panel-content"></div>
    </div>
    
    <!-- Right resize handle (only shown when right panel is visible) -->
    <button class="panel-resize-handle right-resize-handle" aria-label="resize-right-panel"
        style="display: {!rightPanelCollapsed ? 'flex' : 'none'}"
        onmousedown={(e) => handleMouseDown(e, 'right')}
    ></button>

    {#if !rightPanelCollapsed}
      <div class="panel panel-right" 
          transition:fly={{x: 300, duration: 300}} 
          onoutrostart={() => {rightPanelSliding = true; console.log('slideStart');}}
          onoutroend={() => {rightPanelSliding = false; console.log('slideEnd');}}
          style="width: {rightPanelWidth}">
        
        <div class="panel-header">
          <button class="collapse-button" onclick={rightPanelToggle}> →| </button>
          <PanelSelector value={rightPanelContent} bind:name={rightPanelName} onChange={onRightPanelChanged} />
        </div>
        
        <div class="panel-content"></div>
      </div>
    {:else if !rightPanelSliding}
      <div class="panel-collapsed panel-right-collapsed">
        <button class="collapse-button" onclick={rightPanelToggle}> |← </button>
        <h3>{rightPanelName}</h3>
      </div>
    {/if}
  </div>
{:else}
  <!-- Mobile Layout -->
  <div class="mobile-layout mobile-only">

  </div>
{/if}

<style>
  .panel-layout {
    display: flex;
    height: 100%;
    position: relative;
    z-index: 1;
    overflow-x: hidden;
    flex: 1;
  }

  .panel-layout {
    display: none;
    height: 100%;
  }
  
  @media (min-width: 768px) {
    .panel-layout {
      display: flex;
    }
  }

  .panel {
    display: flex;
    flex-direction: column;
  }

  .panel-center {
    flex: 1;
  }

  .panel-resize-handle {
    flex-direction: column;
    background-color: grey;
    border: 1px solid lightgray;
    width: 6px;
    cursor: ew-resize
  }

  .panel-header {
    display: flex;
  }

  .collapse-button {
    background-color: rgba(100, 100, 100, .5);
    border: none;
    padding: 0 5px;
    color: white;
    cursor:pointer;
  }

  .panel-collapsed {
    width: 30px;
    display: flex;
    flex-direction: column;
    background-color: rgba(100, 100, 100, .5);
    border-right: 2px solid #555;
  }

  .panel-collapsed h3 {
     writing-mode: vertical-lr;
     text-align: right;
     margin-top: 20px;
  }

  .panel-left-collapsed h3 {
    transform: rotate(180deg);
  }

  .panel-collapsed .collapse-button {
    height: 30px;
    width: 30px;
  }

</style>