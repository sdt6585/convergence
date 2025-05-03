<script>
  // Styles
  import '@styles/app.css';
  // Supabase
  import { createClient } from '@supabase/supabase-js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  // Utility
  import { getPath } from '@utils/navigation'
  import { afterNavigate } from '$app/navigation';
  import { setContext } from 'svelte'; 

  // Set up the context
  let email = $state();
  let user = $state({});
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  setContext('auth', {
    get user() { return user; },
    get email() { return email; },
    supabase
  });

  //Check if we're logged in or not
  async function checkAuth () {
    let userResponse = await supabase.auth.getUser();
    email = userResponse?.data?.user?.email || false;
  };
  checkAuth();
  afterNavigate(checkAuth);


</script>

<div class="app">
  <header>
    <div class="logo-container">
      <img src="{getPath('/images/logo.png')}" alt="Convergence" class="logo-image" />
      <h1 class="title">CONVERGENCE</h1>
    </div>
    <nav>
      {#if email }
        <span>Hello {email}</span>
      {/if}
      <a href="{getPath('/')}">Home</a>
      {#if email } 
        <a href="{getPath('/app')}">Enter Game</a>
        <a href="{getPath('/logout')}">Logout</a>
      {:else}
        <a href="{getPath('/login')}">Login</a>
        <a href="{getPath('/signup')}">Sign Up</a>
      {/if}
    </nav>
  </header>
  
  <main>
    <!-- This slot is where page content will be rendered -->
    <slot></slot>
  </main>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: relative;
    z-index: 1;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: rgba(20, 20, 20, 0.8);
  }
  
  .logo-container {
    display: flex;
    align-items: center;
  }
  
  .logo-image {
    height: 50px; /* Adjust the size as needed */
    width: auto;
  }
  
  nav {
    display: flex;
    gap: 1.5rem;
  }
  
  nav a {
    color: #f5f5f5;
    font-size: 1rem;
  }
  
  main {
    flex: 1;
    padding: 2rem;
    display: flex;
    justify-content: center;
  }

  .title {
    margin-left: 15px;
  }
</style>