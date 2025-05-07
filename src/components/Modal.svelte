<script>
  //Styles
  import '@styles/app.css';

  // Props
  const {
    title = 'Modal',
    message = '',
    closeable = true,
    type = '', // 'alert', 'ok_cancel', or '' for custom content
    onClose = () => {},
    onConfirm = () => {}
  } = $props();

  // Local state
  let isOpen = $state(false);
  
  export function close() {
    isOpen = false;
    onClose();
  }
  
  function confirm() {
    onConfirm();
    close();
  }
  
  // Method to open the modal
  export function open() {
    isOpen = true;
  }
  
  // Handler to stop propagation
  function handleContainerClick(e) {
    e.stopPropagation();
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" onclick={closeable ? close : null} onkeydown={e => e.key === 'Escape' && closeable ? close() : null}>
    <div class="modal-container" onclick={handleContainerClick}>
      <div class="modal-header">
        <h2>{title}</h2>
        {#if closeable}
          <button class="close-button" onclick={close}>×</button>
        {/if}
      </div>
      
      <div class="modal-content">
        {#if message}
          <p class="modal-message">{message}</p>
        {/if}
        
        {#if type === 'alert'}
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" onclick={confirm}>OK</button>
          </div>
        {:else if type === 'ok_cancel'}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick={close}>Cancel</button>
            <button type="button" class="btn btn-primary" onclick={confirm}>OK</button>
          </div>
        {:else}
          <slot></slot> <!-- Allow custom content -->
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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  
  .modal-container {
    background-color: var(--clr-surface-a20);
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
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }
  
  .btn-primary {
    background-color: #4a5568;
    color: white;
  }
  
  .btn-secondary {
    background-color: #e2e8f0;
    color: #4a5568;
  }
</style>