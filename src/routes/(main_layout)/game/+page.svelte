<script>
  //Styles
  import '@styles/app.css';
  //Utility
  import { getPath } from '@utils/navigation';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { fly } from 'svelte/transition';
  import { page } from '$app/state';
  import { getContext } from 'svelte';
  import logger from '@utils/logger';
  //Components
  import PanelSelector from './components/PanelSelector.svelte';
  import Party from './components/Party.svelte';
  import Character from './components/Character.svelte';
  import Chat from './components/Chat.svelte';

  logger.debug('app', 'Game page script start');

  let store = getContext('store');

  /**
   * Create runes for state management
   */
  // Set up panel state with default values
  // These defaults will be used during SSR
  let leftPanelWidth = $state('400px');
  let leftPanelContent = $state('party');
  let leftPanelCollapsed = $state(false);
  let leftPanelName = $state('Party');
  let leftPanelSliding = $state(false);
  let centerPanelContent = $state('character');
  let rightPanelWidth = $state('400px');
  let rightPanelContent = $state('npc');
  let rightPanelCollapsed = $state(false);
  let rightPanelName = $state('chat');
  let rightPanelSliding = $state(false);
  let windowWidth = $state(1024);
  
  // Character selection state for cross-panel communication
  let selectedCharacter = $state(null);

  onMount(async () => {
    logger.debug('app', 'Game page mounted');
    // Load game as singleton
    let game_id = page.url.searchParams.get('game_id')
    
    await store.load_game(game_id, true);
    
    // Add window resize listener
    if (browser) {
      const handleResize = () => {
        windowWidth = window.innerWidth;
      };
      
      window.addEventListener('resize', handleResize);
    }

    // Unmount general listeners
    return () => {
      logger.debug('app', 'Game page unmounted');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (browser) {
        window.removeEventListener('resize', handleResize);
      }
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
    logger.debug('app', 'left panel changed', newPanel);
    leftPanelContent = newPanel;
    localStorage.setItem('leftPanelContent', newPanel);
  }

  let leftPanelToggle = () => {
    leftPanelCollapsed = !leftPanelCollapsed;
    localStorage.setItem('leftPanelCollapsed', leftPanelCollapsed.toString());
  }

  let onCenterPanelChanged = (newPanel) => {
    logger.debug('app', 'center panel changed', newPanel);
    centerPanelContent = newPanel;
    localStorage.setItem('centerPanelContent', newPanel);
  }

  let onRightPanelChanged = (newPanel) => {
    logger.debug('app', 'right panel changed', newPanel);
    rightPanelContent = newPanel;
    localStorage.setItem('rightPanelContent', newPanel);
  }

  let rightPanelToggle = () => {
    rightPanelCollapsed = !rightPanelCollapsed;
    localStorage.setItem('rightPanelCollapsed', rightPanelCollapsed.toString());
  }

  /**
   * Character selection handler
   */
  //TODO - this is a hack to get the character selected event to work - this shouldn't be right panel specific
  function handleCharacterSelect(event) {
    selectedCharacter = event.detail;
    logger.debug('app', 'Character selected in game page', selectedCharacter);
    
    // If the right panel isn't showing character details, switch it
    if (rightPanelContent !== 'character') {
      rightPanelContent = 'character';
      rightPanelName = 'Character';
      localStorage.setItem('rightPanelContent', rightPanelContent);
    }
    
    // If the right panel is collapsed, uncollapse it
    if (rightPanelCollapsed) {
      rightPanelToggle();
    }
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


{#if store.data.game_loading === false}
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
          
          <div class="panel-content">
            {#if leftPanelContent === 'party'}
              <Party on:select-character={handleCharacterSelect} />
            {:else if leftPanelContent === 'character'}
              <Character selectedCharacter={selectedCharacter} />
            {:else if leftPanelContent === 'chat'}
              <Chat />
            {/if}
          </div>
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

        <div class="panel-content">
          {#if centerPanelContent === 'party'}
            <Party on:select-character={handleCharacterSelect} />
          {:else if centerPanelContent === 'character'}
            <Character selectedCharacter={selectedCharacter} />
          {:else if centerPanelContent === 'chat'}
            <Chat />
          {/if}
        </div>
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
          
          <div class="panel-content">
            {#if rightPanelContent === 'party'}
              <Party on:select-character={handleCharacterSelect} />
            {:else if rightPanelContent === 'character'}
              <Character selectedCharacter={selectedCharacter} />
            {:else if rightPanelContent === 'chat'}
              <Chat />
            {/if}
          </div>
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
    <div class="mobile-layout">
      <div class="mobile-tabs">
        <button 
          class="mobile-tab-button {leftPanelContent === 'party' || leftPanelContent.startsWith('party') ? 'active' : ''}" 
          onclick={() => onLeftPanelChanged('party')}
        >
          Party
        </button>
        <button 
          class="mobile-tab-button {centerPanelContent === 'chat' ? 'active' : ''}" 
          onclick={() => onCenterPanelChanged('chat')}
        >
          Chat
        </button>
        <button 
          class="mobile-tab-button {rightPanelContent === 'character' ? 'active' : ''}" 
          onclick={() => onRightPanelChanged('character')}
        >
          Character
        </button>
      </div>
      
      <div class="mobile-panel">
        <div class="mobile-panel-header">
          <div class="tab-switcher">
            <button 
              class="tab-button {leftPanelContent === 'party' ? 'active' : ''}"
              onclick={() => onLeftPanelChanged('party')}
            >
              Party Tree
            </button>
            <button 
              class="tab-button {leftPanelContent === 'character' ? 'active' : ''}"
              onclick={() => onLeftPanelChanged('character')}
            >
              Character Sheet
            </button>
            <button 
              class="tab-button {leftPanelContent === 'chat' ? 'active' : ''}"
              onclick={() => onLeftPanelChanged('chat')}
            >
              Chat
            </button>
          </div>
        </div>
        <div class="mobile-panel-content">
          {#if leftPanelContent === 'party'}
            <Party on:select-character={handleCharacterSelect} />
          {:else if leftPanelContent === 'character'}
            <Character selectedCharacter={selectedCharacter} />
          {:else if leftPanelContent === 'chat'}
            <Chat />
          {/if}
        </div>
      </div>
    </div>
  {/if}
{:else}
    <h1 style="text-align: center; padding-top: 20px;">Loading...</h1>
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
  
  /* Mobile Styles */
  .mobile-layout {
    display: none;
    height: 100%;
    overflow-y: auto;
  }
  
  @media (max-width: 767px) {
    .mobile-layout {
      display: block;
    }
  }
  
  .mobile-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .mobile-panel-header {
    padding: 10px;
    background-color: rgba(40, 40, 40, 0.9);
    border-bottom: 1px solid #444;
  }
  
  .mobile-panel-content {
    flex: 1;
    overflow-y: auto;
    height: calc(100% - 50px);
  }

  .mobile-tabs {
    display: flex;
    justify-content: space-around;
    background-color: rgba(40, 40, 40, 0.9);
    border-bottom: 1px solid #444;
  }
  
  .mobile-tab-button {
    padding: 10px;
    flex: 1;
    background-color: transparent;
    border: none;
    color: #ccc;
    font-weight: bold;
    cursor: pointer;
  }
  
  .mobile-tab-button.active {
    background-color: rgba(60, 60, 60, 0.9);
    color: #fff;
    border-bottom: 2px solid #888;
  }
  
  .tab-switcher {
    display: flex;
    width: 100%;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  
  .tab-button {
    padding: 8px 12px;
    background-color: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #ccc;
    font-size: 0.9em;
    cursor: pointer;
    white-space: nowrap;
  }
  
  .tab-button.active {
    color: #fff;
    border-bottom: 2px solid #888;
    background-color: rgba(60, 60, 60, 0.5);
  }
  
  .chat-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-style: italic;
    opacity: 0.7;
  }
</style>

<script context="module">
  logger.debug('app', 'Game page module script end');
</script>