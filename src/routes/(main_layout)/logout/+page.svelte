<!-- src/(public)/logout/+page.svelte -->
<script>
  import { createClient } from '@supabase/supabase-js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import { goto } from '$app/navigation';
  import { getPath } from '@utils/navigation';
  import logger from '@utils/logger';
  import { onMount } from 'svelte';

  logger.debug('app', 'Logout page script start');

  // Initialize Supabase client
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

  // UI Variables
  let errorMessage = $state('');
  let successMessage = $state('');
  
  // Logout
  errorMessage = '';
  successMessage = '';
  
  (async function () {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Successful login - you can redirect or handle the session here
      successMessage = 'Successfully logged out, returning to home page...'
      setTimeout(() => {
        goto(getPath('/'));  
      }, 1000)
      
      
    } catch (error) {
      console.error('Login error:', error);
      errorMessage = error.message;
    }
  })();

  onMount(() => {
    logger.debug('app', 'Logout page mounted');
    return () => {
      logger.debug('app', 'Logout page unmounted');
    };
  });
</script>

<div class="auth-container">
  <div class="auth-header">
    <h2>Logging you Out...</h2>
  </div>
    {#if errorMessage}
      <div class="error-message">
        {errorMessage}, please click logout again or refresh the page
      </div>
    {/if}
    

    {#if successMessage}
      <div class="success-message">
        {successMessage}
      </div>
    {/if}
</div>

<style>

</style>

<script context="module">
  logger.debug('app', 'Logout page module script');
</script>