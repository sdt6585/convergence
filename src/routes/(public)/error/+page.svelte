<!-- src/routes/+error.svelte -->
<script>
  import { getPath } from '../../../utils/navigation';
  import { page } from '$app/state'
</script>

<div class="error-container">
  <h1>Error {page?.route?.id}</h1>
  <p>{page.error?.message}</p>
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