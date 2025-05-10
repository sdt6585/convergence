<script>
  //Styles
  import '@styles/app.css';
  import { tick } from 'svelte';
  import { preventDefault } from 'svelte/legacy';

  // Props
  const {
    title = 'Modal',
    message = '',
    closeable = true,
    type = '', // 'alert', 'confirm_cancel', or '' for custom content
    confirmText = 'OK',
    onClose = () => {},
    onConfirm = () => {}
  } = $props();

  // Local state
  let isOpen = $state(false);
  let root;
  
  export function close() {
    isOpen = false;
    onClose();
  }
  
  async function confirm() {
    let preventDefault = false;
    await onConfirm({
      preventDefault: function () {
        preventDefault = true;
      }
    });

    if (!preventDefault) {
      close();
    }
  }
  
  // Method to open the modal
  export async function open() {
    isOpen = true;

    //Focus the first relevant element
    await tick();
    let elements = root.querySelectorAll(['input', 'select', 'datalist', 'textarea', 'button:not(.close-button)']);
    if (elements.length > 0) {
      elements[0].focus();
    }
  }
  
  // Handler to stop propagation
  function handleContainerClick(e) {
    e.stopPropagation();
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" bind:this={root} onclick={closeable ? close : null} onkeydown={e => e.key === 'Escape' && closeable ? close() : null}>
    <div class="modal-container" onclick={handleContainerClick}>
      <div class="modal-header">
        <h2>{title}</h2>
        {#if closeable}
          <button class="close-button" onclick={close} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        {/if}
      </div>
      
      <div class="modal-content">
        {#if message}
          <p class="modal-message">{message}</p>
        {/if}

        <!-- Allow custom content -->
        <slot></slot>
        
        {#if type === 'alert'}
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" onclick={confirm}>OK</button>
          </div>
        {:else if type === 'confirm_cancel'}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick={close}>Cancel</button>
            <button type="button" class="btn btn-primary" onclick={confirm}>{confirmText}</button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* Same styling as before */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  
  .modal-container {
    background-color: var(--clr-surface-a10);
    border-radius: var(--border-radius);
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .modal-header {
    padding: var(--space-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    margin: 0;
    line-height: 1;
    color: var(--clr-primary-a0)
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .modal-message {
    margin-bottom: 1rem;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    flex: 1
  }
</style>