<!-- src/routes/+error.svelte -->
<script>
  import { page } from '$app/state'
  import { getPath } from '@utils/navigation';
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