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
  
  // Mobile-specific state
  let mobilePanelContent = $state('party');
  
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
    mobilePanelContent = localStorage.getItem('mobilePanelContent') || mobilePanelContent;
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
  
  // Mobile panel change handler
  let onMobilePanelChanged = (newPanel) => {
    logger.debug('app', 'mobile panel changed', newPanel);
    mobilePanelContent = newPanel;
    localStorage.setItem('mobilePanelContent', newPanel);
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
              <Party />
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
            <Party />
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
              <Party />
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
    <!-- Mobile Layout - Updated with single panel and bottom navigation -->
    <div class="mobile-layout">
      <div class="mobile-panel">
        <div class="mobile-panel-content">
          {#if mobilePanelContent === 'party'}
            <Party />
          {:else if mobilePanelContent === 'character'}
            <Character selectedCharacter={selectedCharacter} />
          {:else if mobilePanelContent === 'chat'}
            <Chat />
          {/if}
        </div>
        
        <div class="mobile-nav">
          <button class="mobile-nav-button {mobilePanelContent === 'party' ? 'active' : ''}" 
                  onclick={() => onMobilePanelChanged('party')}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M16,21V19C16,17.9 15.1,17 14,17H8C6.9,17 6,17.9 6,19V21H4V19C4,16.8 5.8,15 8,15H14C16.2,15 18,16.8 18,19V21H16Z" />
              <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
              <path d="M13,3V2H11V3H5V1H19V3H13Z" />
            </svg>
            <span>Party</span>
          </button>
          
          <button class="mobile-nav-button {mobilePanelContent === 'chat' ? 'active' : ''}" 
                  onclick={() => onMobilePanelChanged('chat')}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M6,9H18V11H6M14,14H6V12H14M18,8H6V6H18" />
            </svg>
            <span>Chat</span>
          </button>
          
          <button class="mobile-nav-button {mobilePanelContent === 'character' ? 'active' : ''}" 
                  onclick={() => onMobilePanelChanged('character')}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
            </svg>
            <span>Character</span>
          </button>
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
    width: 5px;
    cursor: ew-resize
  }

  .panel-header {
    display: flex;
  }

  .panel-content {
    max-height: calc(100vh - 120px);
    height: calc(100vh - 120px);
    overflow-x: auto;
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
  
  /* Mobile Styles - Updated */
  .mobile-layout {
    display: none;
    height: calc(100vh - 66px);
    flex-direction: column;
  }
  
  @media (max-width: 767px) {
    .mobile-layout {
      display: flex;
    }
  }
  
  .mobile-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  
  .mobile-panel-content {
    flex: 1;
    overflow-y: auto;
    height: calc(100vh - 126px);
    max-height: calc(100vh - 126px);
  }
  
  .mobile-nav {
    display: flex;
    justify-content: space-around;
    background-color: rgba(40, 40, 40, 0.9);
    border-top: 1px solid #444;
    height: 60px;
  }
  
  .mobile-nav-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    background-color: transparent;
    border: none;
    color: #ccc;
    padding: 8px 0;
    cursor: pointer;
  }
  
  .mobile-nav-button svg {
    fill: currentColor;
    margin-bottom: 4px;
  }
  
  .mobile-nav-button.active {
    color: #fff;
    background-color: rgba(60, 60, 60, 0.9);
  }
  
  .mobile-nav-button span {
    font-size: 0.8em;
  }
</style>

<script context="module">
  logger.debug('app', 'Game page module script end');
</script>