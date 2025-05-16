<script>
  // Styles
  import '@styles/app.css';
  //Supbase/Server
  import DataStore from '@src/DataStore.svelte';
  // Utility
  import { getPath } from '@utils/navigation'
  import { afterNavigate } from '$app/navigation';
  import { setContext } from 'svelte'; 
  import { fly } from 'svelte/transition';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { redirect } from '@sveltejs/kit';
  import logger from '@utils/logger'; //this replaces console.log/error/debug/etc

  logger.debug('app', 'Layout script start');

  //Check if we're logged in or not
  let store = $state(new DataStore);
  setContext('store', store);

  //Menu
  let menuOpen = $state(false);
  let onMenuClick = (e) => {menuOpen = !menuOpen};

  //Menu options
  function goFullScreen() {
    document.documentElement.requestFullscreen();
  }

  onMount(() => {
    logger.debug('app', 'Layout mounted');

    // Set up global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      logger.error('Uncaught error:', { message, source, lineno, colno, error });
    };

    // Set up unhandled promise rejection handler
    window.onunhandledrejection = (event) => {
      logger.error('Unhandled promise rejection:', event.reason);
    };

    // Make sure we're logged in and have the right to access this
    async function checkAuth () {
      await store.checkAuth();

      // Access control - paths that require login
      if(store.user === null && [
        '/game',
        '/games'
      ].includes(page.url.pathname)) {
        redirect(303, getPath('/login?path=' + page.url.pathname));
      }
    }

    afterNavigate(checkAuth); 

    return () => {
      logger.debug('app', 'Layout unmounted');
    };
  });
</script>


<div class="main-container">
  <header>
    <a class="logo-container" href="{getPath('/')}">
      <img src="{getPath('/images/logo.png')}" alt="Convergence" class="logo-image" />
      <h1 class="title desktop-only">CONVERGENCE</h1>
      <h2 class="title mobile-only">CONVERGENCE</h2>
    </a>
    <nav class="nav desktop-only">
      {#if store.user }
        <span>{store.user.email}</span>
      {/if}
    </nav>
    <button class="nav-menu-open" onclick={onMenuClick} aria-label="menu button">
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
    <a class="menu-option" href="{getPath('/')}" onclick={onMenuClick}>Home</a>
    {#if store.user } 
      <a class="menu-option" href="{getPath('/games')}" onclick={onMenuClick}>View Games</a>
      <a class="menu-option" href="{getPath('/logout')}" onclick={onMenuClick}>Logout</a>
    {:else}
      <a class="menu-option" href="{getPath('/login')}" onclick={onMenuClick}>Login</a>
      <a class="menu-option" href="{getPath('/signup')}" onclick={onMenuClick}>Sign Up</a>
    {/if}
    <button class="menu-option" onclick={goFullScreen}>
      Fullscreen
      <svg class="fullscreen-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <!-- Rounded outer frame -->
        <rect x="1" y="1" width="22" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
        
        <!-- Top-left corner and arrow -->
        <path d="M4 4 L9 4 L9 6 L6 6 L6 9 L4 9 Z" fill="currentColor"/>
        <path d="M9 9 L6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        
        <!-- Top-right corner and arrow -->
        <path d="M20 4 L15 4 L15 6 L18 6 L18 9 L20 9 Z" fill="currentColor"/>
        <path d="M15 9 L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        
        <!-- Bottom-left corner and arrow -->
        <path d="M4 20 L9 20 L9 18 L6 18 L6 15 L4 15 Z" fill="currentColor"/>
        <path d="M9 15 L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        
        <!-- Bottom-right corner and arrow -->
        <path d="M20 20 L15 20 L15 18 L18 18 L18 15 L20 15 Z" fill="currentColor"/>
        <path d="M15 15 L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
  {/if}
  
  <main>
    <!-- This slot is where page content will be rendered -->
    <slot></slot>
  </main>
</div>

<style>
</style>

<script context="module">
  logger.debug('app', 'Layout module script end');
</script>