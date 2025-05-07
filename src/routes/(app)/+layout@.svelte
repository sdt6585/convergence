<script>
  import '@styles/app.css';
  import { createClient } from '@supabase/supabase-js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import { getPath } from '@utils/navigation';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import PanelSelector from './PanelSelector.svelte';


  /**
   * Create runes for state management
   */
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  let email = $state();
  let test = $state(''); //TODO - remove me

  // Set up panel state with default values
  // These defaults will be used during SSR
  let leftPanelWidth = $state('400px');
  let leftPanelContent = $state('player_ship');
  let leftPanelCollapsed = $state(false);
  let centerPanelContent = $state('chat');
  let rightPanelWidth = $state('400px');
  let rightPanelContent = $state('npc');
  let rightPanelCollapsed = $state(false);

  onMount(async () => {
    /**
     * Check if we're logged in
     */
    let user = await supabase.auth.getUser();
    email = user?.data?.user?.email;

    // Send them to the login if they aren't logged in
    if (!email) {
      goto(getPath('/login'));
    }

    const { data, error } = await supabase
      .from('Test')
      .select('*')

    // TODO - remove me!!!
    test = data?.map((item) => item.name).join(', ') || '';

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
  }

  /**
   * Panel change events
   */
  let onLeftPanelChanged = (newPanel) => {
    localStorage.setItem('leftPanelContent', newPanel);
  }

  let onRightPanelChanged = (newPanel) => {
    localStorage.setItem('rightPanelContent', newPanel);
  }

  let onCenterPanelChanged = (newPanel) => {
    localStorage.setItem('centerPanelContent', newPanel);
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

  /**
   * Menu state
  */
  let menuOpen = $state(false);
  let onMenuClick = () => {menuOpen = !menuOpen};
</script>

<div class="app">
  <header>
    <a class="logo-container" href="{getPath('/')}">
      <img src="{getPath('/images/logo.png')}" alt="Convergence" class="logo-image" />
      <h1 class="title desktop-only">CONVERGENCE</h1>
      <h2 class="title mobile-only">CONVERGENCE</h2>
    </a>
    <nav class="desktop-only">
      {#if email }
        <span>{email}</span>
      {/if}
    </nav>
    <button class="mobile-only nav-menu-open" onclick={onMenuClick} aria-label="menu button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </header>

  <!-- Side Menu -->
  {#if menuOpen}
  <div class="nav-menu" transition:fly={{x: 300, duration: 300}}>
    <div style="display: flex;">
      <button class="nav-menu-close" onclick={onMenuClick} aria-label="Close menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <span style="flex: 1;">Menu</span>
    </div>
    <!-- Menu content -->
    {#if email }
      <span>{email}</span>
    {/if}
    <a href="{getPath('/')}" onclick={onMenuClick}>Home</a>
    {#if email } 
      <a href="{getPath('/app')}" onclick={onMenuClick}>Enter Game</a>
      <a href="{getPath('/logout')}" onclick={onMenuClick}>Logout</a>
    {:else}
      <a href="{getPath('/login')}" onclick={onMenuClick}>Login</a>
      <a href="{getPath('/signup')}" onclick={onMenuClick}>Sign Up</a>
    {/if}
  </div>
  {/if}
  <!-- Desktop Layout Stephen -->
   <!-- Stephen -->
  <div class="panel-layout">
    <!-- Left collapsed panel (shown only when left panel is collapsed) -->
    <div class="panel-collapsed panel-left-collapsed" style="display: {leftPanelCollapsed ? 'flex' : 'none'}">
      <!-- Rotated title and expand button here -->
    </div>
    
    <!-- Left panel (shown only when not collapsed) -->
    <div class="panel panel-left" style="display: {!leftPanelCollapsed ? 'flex' : 'none'}; width: {leftPanelWidth}">
      
      <div class="panel-header">
        <PanelSelector value={leftPanelContent} onChange={onLeftPanelChanged} />
        <button class="collapse-button"> |← </button>
      </div>
      
      <div class="panel-content"></div>
    </div>
    
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
    
    <!-- Right panel (shown only when not collapsed) -->
    <div class="panel panel-right" style="display: {!rightPanelCollapsed ? 'flex' : 'none'}; width: {rightPanelWidth}">

      <div class="panel-header">
        <button class="collapse-button"> →| </button>
        <PanelSelector value={rightPanelContent} onChange={onRightPanelChanged} />
      </div>
      
      <div class="panel-content"></div>

    </div>
    
    <!-- Right collapsed panel (shown only when right panel is collapsed) -->
    <div class="panel-collapsed panel-right-collapsed" style="display: {rightPanelCollapsed ? 'flex' : 'none'}">
      <!-- Rotated title and expand button here -->
    </div>
  </div>

  <!-- Mobile Layout -->
  <div class="mobile-layout mobile-only">

  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    z-index: 1;
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
    padding: .5rem;
  }

  .panel-header .collapse-button {
    background-color: rgba(100, 100, 100, .5);
    border: none;
    padding: 0 5px;
    color: white;
    cursor:pointer;
  }

</style>