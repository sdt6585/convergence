<script>
  // Utility
  import { getPath } from '@utils/navigation'
  import { getContext } from 'svelte';

  const auth = getContext('auth');
  
</script>

<div class="container">
  <section class="intro">
    <h2>Welcome to Convergence</h2>
    <p>
      A game where paths intersect, choices converge, and destinies unfold. 
      Explore a world where every decision matters and shapes your unique journey.
    </p>
    
    {#if auth.email} 
      <a href="{getPath('/app')}" class="cta-button">Play Now</a>
    {:else}
      <a href="{getPath('/login')}" class="cta-button">Begin Your Journey</a>
    {/if}
  </section>
</div>

<style>
  .container {
    max-width: 800px;
    width: 100%;
  }
  
  .intro {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
    padding: 3rem 1rem;
  }
  
  h2 {
    font-size: 2.5rem;
    color: #f5f5f5;
  }
  
  p {
    font-size: 1.2rem;
    line-height: 1.6;
    color: #bbbbbb;
  }
  
  .cta-button {
    display: inline-block;
    background-color: #444;
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: 5px;
    font-size: 1.1rem;
    transition: all 0.2s ease;
    margin-top: 1rem;
  }
  
  .cta-button:hover {
    background-color: #555;
    text-decoration: none;
  }
</style>