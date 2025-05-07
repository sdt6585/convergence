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

  // Set up the context
  let user = $state({});
  let app = {};
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

  
  if (browser) {
    //Check if we're logged in or not
    app = new DataStore();
    app.checkAuth();
  }
  afterNavigate(app.checkAuth);

  //Menu
  let menuOpen = $state(false);
  let onMenuClick = (e) => {menuOpen = !menuOpen};


</script>

<div class="main-container">
  <header>
    <a class="logo-container" href="{getPath('/')}">
      <img src="{getPath('/images/logo.png')}" alt="Convergence" class="logo-image" />
      <h1 class="title desktop-only">CONVERGENCE</h1>
      <h2 class="title mobile-only">CONVERGENCE</h2>
    </a>
    <nav class="nav desktop-only">
      {#if app.user }
        <span>{app.user.email}</span>
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
    <a href="{getPath('/')}" onclick={onMenuClick}>Home</a>
    {#if app.user } 
      <a href="{getPath('/games')}" onclick={onMenuClick}>View Games</a>
      <a href="{getPath('/logout')}" onclick={onMenuClick}>Logout</a>
    {:else}
      <a href="{getPath('/login')}" onclick={onMenuClick}>Login</a>
      <a href="{getPath('/signup')}" onclick={onMenuClick}>Sign Up</a>
    {/if}
  </div>
  {/if}
  
  <main>
    <!-- This slot is where page content will be rendered -->
    <slot></slot>
  </main>
</div>

<style>
  
</style>