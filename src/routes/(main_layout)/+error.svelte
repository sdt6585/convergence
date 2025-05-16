<!-- src/routes/+error.svelte -->
<script>
  import { page } from '$app/state'
  import { getPath } from '@utils/navigation';
  import logger from '@utils/logger';
  import { onMount } from 'svelte';

  logger.debug('app', 'Error page script start');

  onMount(() => {
    logger.debug('app', 'Error page mounted');
    return () => {
      logger.debug('app', 'Error page unmounted');
    };
  });
</script>

<script context="module">
  logger.debug('app', 'Error page module script');
</script>

<div class="error-container">
  <h1>Error loading page: {page?.route?.id}</h1>
  <p>{page.error?.message || 'Page not found'}</p>
  <a href={getPath('/')}>Return to Home</a>
</div>

<style>
  .error-container {
    text-align: center;
    padding: 2rem;
  }
  .error-container h1 {
    margin-bottom: 1rem;
  }
</style>