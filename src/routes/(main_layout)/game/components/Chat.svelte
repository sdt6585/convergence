<script>
  import { onMount, tick } from 'svelte';
  import { getContext } from 'svelte';
  import logger from '@utils/logger';
  
  // Access store for data
  const store = getContext('store');
  const roll = getContext('roll');
  
  // Chat state
  let messageLog = $state([]);
  let gameLog = $state([]);
  let inputText = $state('');
  let viewport = $state(null);
  let viewMode = $state('chat'); // 'chat' or 'log'
  let isRecording = $state(false);
  let showingAllMessages = $state(false);
  
  // Example combat log content
  const gameLogMockup = [
    { type: 'system', content: '=== Combat Started ===', timestamp: new Date(Date.now() - 420000) },
    { type: 'ship', content: 'Artemis has entered the sector', timestamp: new Date(Date.now() - 400000) },
    { type: 'ship', content: 'Corsair Vengeance detected on long-range scanners', timestamp: new Date(Date.now() - 380000) },
    { type: 'system', content: 'Turn 1 - Artemis\'s turn', timestamp: new Date(Date.now() - 360000) },
    { type: 'ship', content: 'Grax at weapons station', timestamp: new Date(Date.now() - 350000) },
    { type: 'combat', content: 'Artemis is firing Pulse Laser at Corsair Vengeance', timestamp: new Date(Date.now() - 340000) },
    { type: 'combat', content: 'HIT! Dealt 8 damage', timestamp: new Date(Date.now() - 330000) },
    { type: 'system', content: 'Artemis ends turn', timestamp: new Date(Date.now() - 320000) },
    { type: 'system', content: 'Turn 1 - Corsair Vengeance\'s turn', timestamp: new Date(Date.now() - 310000) },
    { type: 'ship', content: 'Gunner Draz at weapons station', timestamp: new Date(Date.now() - 300000) },
    { type: 'combat', content: 'Corsair Vengeance is firing Heavy Plasma Cannon at Artemis', timestamp: new Date(Date.now() - 290000) },
    { type: 'combat', content: 'MISS!', timestamp: new Date(Date.now() - 280000) },
    { type: 'system', content: 'Corsair Vengeance ends turn', timestamp: new Date(Date.now() - 270000) },
    { type: 'system', content: 'Turn 2 - Artemis\'s turn', timestamp: new Date(Date.now() - 260000) },
    { type: 'movement', content: 'Brad at navigation station attempts evasive maneuvers', timestamp: new Date(Date.now() - 250000) },
    { type: 'system', content: 'Evasion roll: 14 + 8 = 22 vs difficulty 12', timestamp: new Date(Date.now() - 240000) },
    { type: 'system', content: 'Evasion SUCCESSFUL', timestamp: new Date(Date.now() - 230000) },
    { type: 'combat', content: 'Grax fires the torpedo launcher', timestamp: new Date(Date.now() - 220000) },
    { type: 'combat', content: 'Artemis is firing Torpedo Launcher at Corsair Vengeance', timestamp: new Date(Date.now() - 210000) },
    { type: 'combat', content: 'HIT! Dealt 20 damage', timestamp: new Date(Date.now() - 200000) },
    { type: 'system', content: 'Corsair Vengeance takes 20 damage! HP: 8980/9000', timestamp: new Date(Date.now() - 190000) },
    { type: 'ship', content: 'Corsair Vengeance shield levels at 1480/1500', timestamp: new Date(Date.now() - 180000) },
    { type: 'system', content: 'Artemis ends turn', timestamp: new Date(Date.now() - 170000) },
    { type: 'system', content: 'Can we try targeting their engines?', sender: 'Brad', mode: 'public', timestamp: new Date(Date.now() - 160000) },
    { type: 'system', content: 'Targeting subsystems requires a precision weapons check. With your current weapons loadout, you have a 65% chance of success. Would you like to attempt this on your next turn?', timestamp: new Date(Date.now() - 150000) },
    { type: 'system', content: 'Yes, let\'s try that', sender: 'Brad', mode: 'agent', timestamp: new Date(Date.now() - 140000) },
    { type: 'system', content: 'Brad prepares targeting solutions for engine subsystems', timestamp: new Date(Date.now() - 130000) },
    { type: 'system', content: 'Maya, can you divert more power to forward shields?', sender: 'Alex', mode: 'private', timestamp: new Date(Date.now() - 120000) },
    { type: 'system', content: 'Already on it, Captain. Rerouting power from non-essential systems.', sender: 'Maya', mode: 'private', timestamp: new Date(Date.now() - 110000) },
    { type: 'ship', content: 'Artemis shield levels at 1050/1000 (overcharged)', timestamp: new Date(Date.now() - 100000) },
    { type: 'system', content: 'Maya successfully boosts shield capacity by 5%', timestamp: new Date(Date.now() - 90000) },
    { type: 'system', content: 'Turn 3 begins', timestamp: new Date(Date.now() - 60000) }
  ];
  
  // Add state for LLM actions (prototype)
  let pendingActions = $state([]); // Array of {id, description, approved, cancelled}
  let lastUserMessage = $state(null); // For visual connection
  
  // Add state for log filter
  let logFilter = $state('All Events');
    
  // Map log types to categories
  function getLogCategory(type) {
    if (type === 'combat') return 'Combat';
    if (type === 'character' || type === 'ship') return 'Ship';
    if (type === 'system') return 'System';
    if (type === 'movement') return 'Movement';
    return 'System';
  }
  
  // Initialize with the combat log but staggered with timeouts
  onMount(() => {
    displayMessagesSequentially();
    // TODO - remove me/prototype code
  });
  
  // Function to display messages one by one with delays
  function displayMessagesSequentially() {
    let index = 0;
    
    function addNextMessage() {
      logger.debug('app', $state.snapshot(logFilter), $state.snapshot(gameLog));
      if (index < gameLogMockup.length) {
        gameLog.push(gameLogMockup[index]);
        index++;
        setTimeout(addNextMessage, 1000); // 1 second delay between messages
      } else {
        showingAllMessages = true;
      }
    }
    
    // Start the sequence
    addNextMessage();
  }
  
  // Auto-scroll to bottom on new messages
  $effect.pre(() => {
    gameLog;
    const autoscroll = viewport && viewport.offsetHeight + viewport.scrollTop > viewport.scrollHeight - 50;
    
    if (autoscroll) {
      tick().then(() => {
        if (viewport) viewport.scrollTo(0, viewport.scrollHeight);
      });
    }
  });
  
  // Handle form submission
  async function handleSubmit() {
    if (!inputText.trim()) return;
    
    // Add player message
    const playerMessage = {
      type: 'player',
      content: inputText,
      sender: 'Alex',
      timestamp: new Date()
    };
    messageLog.push(playerMessage);
    
    const aiContent = await generateSystemResponse(inputText);

    // Clear input
    inputText = '';

    //TODO - create a generating status/rune so the submit button turns into a stop button and the mic button is disabled temporarily

    // TODO - remove me/prototype code - implement LLM/API integration here
    setTimeout(() => {
      let aiResponse = {
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
      };
      messageLog.push(aiResponse);
    }, 800);
  }
  
  // Handle chat mode change
  function setChatMode(mode) {
    viewMode = mode;
  }
  
  // Handle microphone toggle
  function toggleMicrophone() {
    if (!isRecording) {
      // Start recording logic would go here
      isRecording = true;
      
      // Simulate ending recording after 3 seconds
      setTimeout(() => {
        isRecording = false;
        inputText = inputText + " [Transcribed speech would appear here]";
      }, 3000);
    } else {
      // Stop recording logic would go here
      isRecording = false;
    }
  }
  
  // Helper function to generate system messages
  async function generateSystemResponse(input) {
    if (input.toLowerCase().includes('check')) {
      // Show dice modal and log result
      const result = await roll({
        sides: 15,
        baseStatValue: 4,
        threshold: 13,
        modifiers: [
          { type: 'Equipment: Smarty Pants', modifier: 4 },
          { type: 'Status: Drunk', modifier: -3 },
          { type: 'Skill: Battle Knowledge', modifier: 2 }
        ],
        title: 'Lelouch - Check Strength'
      });
      // Compose result string
      const modStr = '+4 -3 +2';
      const msg = `${result.title}: ${result.rawResult} + 4 ${modStr} = ${result.modifiedResult} vs ${result.threshold}: ${result.result ? 'SUCCESS' : 'FAILURE'}`;
      gameLog.push({
        type: 'system',
        content: msg,
        timestamp: new Date()
      });
      return msg;
    } else if (input.toLowerCase().includes('move')) {
      // Set actions for moving players
      pendingActions = [
        { id: 1, description: 'Move Lelouch from Planet Earth to Ship Rocinante', approved: false, cancelled: false },
        { id: 2, description: 'Move Monkey D. Luffy from Planet Earth to Ship Rocinante', approved: false, cancelled: false },
        { id: 3, description: 'Move Saitama from Planet Earth to Ship Rocinante', approved: false, cancelled: false },
        { id: 4, description: 'Move Kirito from Planet Earth to Ship Rocinante', approved: false, cancelled: false },
      ];
      lastUserMessage = input;
      return 'Understood. Here are the actions I will take:';
    } else if (input.toLowerCase().includes('scan')) {
      pendingActions = [];
      return 'Scan complete. Detected 3 vessels in the vicinity. One identified as friendly.';
    } else if (input.toLowerCase().includes('fire')) {
      pendingActions = [];
      return 'Weapons locked. Ready to fire on your command.';
    } else if (input.toLowerCase().includes('shield')) {
      pendingActions = [];
      return 'Shield frequencies adjusted. Efficiency increased by 12%.';
    } else {
      pendingActions = [];
      return 'System update: All stations operating at nominal capacity.';
    }
  }
  
  // Format timestamp for display
  function formatTimestamp(timestamp) {
    // Use user's locale if available, fallback to en-US
    const locale = navigator?.language || 'en-US';
    // Example: Wed, 5/22, 8:58 PM
    return timestamp.toLocaleString(locale, {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // TODO - implement LLM API integration here
  // This should call an external class/service and update messages and pendingActions accordingly
  function handleLLMRequest(inputText) {
    // TODO - remove me/prototype code
    // For now, just use the above stub
  }
  
  // Approve/cancel logic for actions
  function approveAction(id) {
    pendingActions = pendingActions.map(a => a.id === id ? { ...a, approved: true, cancelled: false } : a);
  }
  function cancelAction(id) {
    pendingActions = pendingActions.map(a => a.id === id ? { ...a, approved: false, cancelled: true } : a);
  }
  function approveAll() {
    pendingActions = pendingActions.map(a => a.cancelled ? a : { ...a, approved: true });
  }
  function cancelAll() {
    pendingActions = pendingActions.map(a => ({ ...a, approved: false, cancelled: true }));
  }
  function executeApprovedActions() {
    // TODO - implement action execution logic
    // For now, just mark as executed and clear
    pendingActions = [];
  }
  
  // Add a helper to get the icon class for each log type
  function getIconClass(type) {
    if (type === 'combat') return 'icon-combat';
    if (type === 'movement') return 'icon-movement';
    if (type === 'system') return 'icon-system';
    if (type === 'character' || type === 'ship') return 'icon-ship';
    return 'icon-system';
  }
  
  function getLogColor(type) {
    if (type === 'combat') return '#e57373';
    if (type === 'character' || type === 'ship') return '#81d4fa';
    if (type === 'system') return '#ffd54f';
    if (type === 'movement') return '#64b5f6';
    return '#ffd54f';
  }
</script>

<div class="chat-container">
  <div class="mode-selector">
    <button class={viewMode === 'chat' ? 'mode-btn active' : 'mode-btn'} onclick={() => viewMode = 'chat'}>
      Chat
    </button>
    <button class={viewMode === 'log' ? 'mode-btn active' : 'mode-btn'} onclick={() => viewMode = 'log'}>
      Game Log
    </button>
  </div>
  
  {#if viewMode === 'chat'}
    <div class="message-container" bind:this={viewport}>
      {#each messageLog as message}
        <div class="message-row {message.type}">
          <div class="message-content">
            {#if message.type === 'player'}
              <span class="sender">{message.sender}:</span>
            {/if}
            <span class="content">{message.content}</span>
          </div>
          <div class="timestamp-under">{formatTimestamp(message.timestamp)}</div>
        </div>
      {/each}
      {#if pendingActions.length > 0}
        <div class="action-approval-group">
          <div class="action-approval-header">
            <span>Actions to Approve</span>
            <button class="btn btn-primary" onclick={approveAll}>Approve All</button>
            <button class="btn btn-secondary" onclick={cancelAll}>Cancel All</button>
          </div>
          {#each pendingActions as action (action.id)}
            <div class="action-approval-card {action.cancelled ? 'cancelled' : ''} {action.approved ? 'approved' : ''}">
              <span>{action.description}</span>
              <div class="action-buttons">
                <button class="btn btn-primary" disabled={action.approved} onclick={() => approveAction(action.id)}>Approve</button>
                <button class="btn btn-secondary" disabled={action.cancelled} onclick={() => cancelAction(action.id)}>Cancel</button>
              </div>
            </div>
          {/each}
          <button class="btn btn-primary" onclick={executeApprovedActions} disabled={pendingActions.every(a => a.cancelled)}>Execute Approved</button>
        </div>
      {/if}
    </div>
    <div class="input-container">
      <div class="input-row">
        <textarea 
          class="message-input" 
          placeholder="Enter message or command..."
          bind:value={inputText}
          onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && (handleSubmit(), e.preventDefault())}
        ></textarea>
        <div class="input-buttons">
          <button class="btn btn-primary" onclick={handleSubmit} disabled={!inputText.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  {:else if viewMode === 'log'}
    <div class="game-log-container">
      <div class="log-filter-row">
        <select class="log-filter-select" bind:value={logFilter}>
          <option selected={logFilter === 'All Events'}>All Events</option>
          <option selected={logFilter === 'Combat'}>Combat</option>
          <option selected={logFilter === 'Movement'}>Movement</option>
          <option selected={logFilter === 'System'}>System</option>
          <option selected={logFilter === 'Ship'}>Ship</option>
        </select>
      </div>
      <div class="log-list">
        {#each gameLog.filter(log => logFilter === 'All Events' || getLogCategory(log.type) === logFilter) as log}
          <div class="log-row-squared" style="border-left: 6px solid {getLogColor(log.type)};">
            <div class="log-left">
              <div class="log-icon-large {getIconClass(log.type)}"></div>
            </div>
            <div class="log-content-wide">
              {@html log.content}
              <div class="timestamp-under">{formatTimestamp(log.timestamp)}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .chat-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: rgba(30, 30, 30, 0.6);
    border-radius: var(--border-radius);
    overflow: hidden;
    position: relative;
  }
  
  .mode-selector {
    display: flex;
    margin-top: 10px; /* bottom margin is handled by absolute positioning of the message container */
    border-radius: var(--border-radius);
    overflow: hidden;
  }
  
  .mode-btn {
    flex: 1;
    padding: 6px 0;
    background-color: rgba(60, 60, 60, 0.7);
    border: none;
    color: #ccc;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .mode-btn:hover {
    background-color: rgba(80, 80, 80, 0.7);
  }
  
  .mode-btn.active {
    background-color: rgba(80, 50, 100, 0.7);
    color: #fff;
  }
  
  .message-container, .game-log-container {
    position: absolute;
    top: 40px; /* Height of mode selector + some margin */
    left: 0;
    right: 0;
    bottom: 150px; /* Height of input container*/
    overflow-y: auto;
    padding: 0 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .game-log-container {
    bottom: 0;
  }
  
  .message-row, .log-row {
    display: flex;
    flex-direction: column;
    margin-bottom: 4px;
    padding: 6px 10px;
    border-radius: 4px;
    animation: fadeIn 0.3s ease;
    max-width: 85%;
    background-color: rgba(60, 60, 60, 0.5);
    color: #e0e0e0;
  }
  
  .player {
    align-self: flex-end;
    margin-left: auto;
    background-color: rgba(40, 70, 40, 0.4);
  }
  
  .ai {
    align-self: flex-start;
    margin-right: auto;
    background-color: rgba(70, 40, 70, 0.4);
  }
  
  .system {
    background-color: rgba(60, 60, 60, 0.5);
    color: #aaa;
    font-style: italic;
  }
  
  .combat {
    background-color: rgba(80, 30, 30, 0.4);
    color: #e0e0e0;
  }
  
  .ship {
    background-color: rgba(30, 60, 90, 0.4);
    color: #e0e0e0;
  }
  
  .character {
    background-color: rgba(60, 50, 90, 0.4);
    color: #e0e0e0;
  }
  
  .timestamp-under {
    font-size: 0.7em;
    color: #777;
    margin-top: 2px;
    align-self: flex-end;
    padding-top: 3px;
  }
  
  .sender {
    font-weight: bold;
    margin-right: 5px;
  }
  
  .action-approval-group {
    margin-top: 10px;
    padding: 10px;
    background-color: rgba(50, 50, 50, 0.8);
    border-radius: 4px;
  }
  
  .action-approval-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .action-approval-header span {
    font-weight: bold;
  }
  
  .action-approval-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-radius: 4px;
    margin-bottom: 5px;
  }
  
  .action-approval-card.cancelled {
    background-color: rgba(200, 50, 50, 0.8);
  }
  
  .action-approval-card.approved {
    background-color: rgba(50, 200, 50, 0.8);
  }
  
  .action-buttons {
    display: flex;
    gap: 5px;
  }
  
  .log-filter-row {
    margin-bottom: 10px;
  }
  
  .log-filter-select {
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    border: 1px solid var(--clr-surface-a30);
    background-color: var(--clr-surface-a10);
    color: var(--text-light);
    font-size: 1rem;
    outline: none;
    margin-bottom: 10px;
  }
  
  .log-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .log-row-squared {
    display: flex;
    width: 100%;
    background: var(--clr-surface-a20);
    border-radius: 0;
    margin-bottom: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    min-height: 60px;
    border-left: 6px solid var(--clr-surface-a30);
  }
  .log-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-width: 56px;
    padding: 10px 8px 10px 0;
    background: transparent;
  }
  .log-icon-large {
    width: 32px;
    height: 32px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon-combat::before {
    content: '';
    display: block;
    width: 32px;
    height: 32px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' fill='%23e57373' height='32px' width='32px' version='1.1' id='Layer_1' viewBox='0 0 511.983 511.983' xml:space='preserve'%3E%3Cg%3E%3Cg%3E%3Cg%3E%3Cpath d='M125.491,267.021c-3.337-3.337-8.73-3.337-12.066,0c-25.301,25.293-25.813,53.094-1.707,78.507l-53.896,53.888 l-8.866-8.798c-6.647-6.656-17.468-6.673-24.098-0.043L4.992,410.449c-6.656,6.647-6.656,17.476,0,24.132l72.397,72.405 c3.328,3.328,7.706,4.992,12.075,4.992c4.369,0,8.747-1.664,12.066-4.992l19.866-19.857c3.482-3.482,5.163-8.346,4.625-13.346 c-0.495-4.582-2.756-8.994-6.536-12.774l-6.912-6.878l53.837-53.828c25.762,24.525,52.873,23.927,78.549-1.749 c3.337-3.337,3.337-8.73,0-12.066L125.491,267.021z M176.649,386.445l-4.301-4.241c-3.336-3.285-8.695-3.268-12.023,0.043 l-59.836,59.844L87.04,428.702c-3.336-3.328-8.73-3.311-12.075,0.026c-3.328,3.337-3.311,8.738,0.026,12.066l32.435,32.299 c1.263,1.254,1.587,2.236,1.86,2.014l-19.831,19.814l-72.397-72.405l19.857-19.806l14.925,14.814 c3.328,3.302,8.721,3.294,12.041-0.026l59.827-59.836l15.317,15.352c3.337,3.337,8.73,3.337,12.066,0.017 c3.345-3.328,3.345-8.738,0.017-12.075l-25.617-25.668c-9.591-9.6-14.473-19.021-14.498-28.023 c-0.017-7.049,2.935-14.362,8.798-21.803l106.752,106.743C209.604,405.679,193.971,403.785,176.649,386.445z'/%3E%3Cpath d='M287.625,176.687L430.933,33.378l45.773-10.172L305.425,194.487c-3.337,3.337-3.337,8.73,0,12.066 c1.664,1.664,3.849,2.5,6.033,2.5c2.185,0,4.369-0.836,6.033-2.5L488.764,35.281l-10.163,45.764L335.292,224.354 c-3.337,3.337-3.337,8.73,0,12.066c1.664,1.664,3.849,2.5,6.033,2.5c2.185,0,4.369-0.836,6.033-2.5L492.425,91.354 c1.152-1.143,1.946-2.594,2.304-4.181l17.067-76.8c0.111-0.521,0.12-1.05,0.137-1.57c0.009-0.128,0.043-0.256,0.043-0.384 c-0.017-0.973-0.213-1.911-0.546-2.816c-0.077-0.205-0.171-0.393-0.265-0.589c-0.418-0.922-0.939-1.792-1.673-2.526 c-0.734-0.734-1.604-1.254-2.517-1.673c-0.205-0.094-0.393-0.188-0.597-0.265c-0.904-0.324-1.843-0.529-2.807-0.546 c-0.145,0-0.273,0.034-0.418,0.043c-0.521,0.017-1.033,0.034-1.544,0.145l-76.8,17.067c-1.579,0.35-3.029,1.143-4.181,2.295 L275.558,164.621c-3.337,3.337-3.337,8.73,0,12.066S284.288,180.023,287.625,176.687z'/%3E%3Cpath d='M506.991,410.449l-19.857-19.866c-6.007-6.016-16.922-7.296-26.129,1.92l-6.861,6.895l-53.837-53.828 c24.516-25.754,23.936-52.864-1.749-78.549c-3.337-3.337-8.73-3.337-12.066,0L267.025,386.487c-3.337,3.337-3.337,8.73,0,12.066 c25.301,25.301,53.111,25.813,78.507,1.707l53.897,53.897l-8.806,8.866c-6.656,6.656-6.673,17.468-0.034,24.098l19.866,19.866 c3.319,3.328,7.697,4.992,12.066,4.992s8.747-1.664,12.075-4.992l72.397-72.397C513.647,427.934,513.647,417.097,506.991,410.449 z M422.519,494.921l-19.806-19.857l14.814-14.925c3.302-3.337,3.294-8.721-0.026-12.041l-59.836-59.836l15.352-15.309 c3.345-3.328,3.345-8.73,0.017-12.075c-3.336-3.328-8.738-3.337-12.066-0.009l-25.677,25.617 c-9.6,9.591-19.029,14.473-28.023,14.498h-0.077c-7.023,0-14.31-2.953-21.726-8.806l106.743-106.735 c13.483,16.922,11.563,32.555-5.769,49.886l-4.233,4.301c-3.285,3.345-3.268,8.713,0.051,12.023l59.836,59.836l-13.397,13.449 c-3.319,3.336-3.302,8.747,0.026,12.066c3.354,3.337,8.747,3.319,12.075-0.026l32.29-32.427c1.263-1.254,2.219-1.587,2.022-1.86 l19.814,19.831L422.519,494.921z'/%3E%3Cpath d='M281.591,349.854c2.185,0,4.369-0.836,6.033-2.5c3.336-3.337,3.336-8.73,0-12.066L33.382,81.045L23.219,35.281 l282.206,282.206c1.664,1.664,3.849,2.5,6.033,2.5c2.185,0,4.369-0.836,6.033-2.5c3.337-3.337,3.337-8.73,0-12.066L35.277,23.206 L81.05,33.378L335.292,287.62c3.337,3.337,8.73,3.337,12.066,0c3.336-3.337,3.336-8.73,0-12.066l-256-256 c-1.152-1.152-2.603-1.946-4.181-2.295l-76.8-17.067C9.865,0.081,9.353,0.064,8.832,0.047C8.687,0.038,8.559,0.004,8.414,0.004 C7.441,0.021,6.511,0.226,5.606,0.55C5.402,0.627,5.214,0.721,5.018,0.815c-0.922,0.41-1.792,0.939-2.526,1.673 C1.758,3.221,1.229,4.092,0.819,5.013C0.725,5.21,0.631,5.397,0.555,5.602C0.222,6.507,0.026,7.445,0.009,8.418 c0,0.128,0.034,0.256,0.043,0.384c0.017,0.521,0.026,1.05,0.137,1.57l17.067,76.8c0.358,1.587,1.152,3.038,2.304,4.181 l164.634,164.634l-19.567,19.567c-3.337,3.337-3.337,8.73,0,12.066c1.664,1.664,3.849,2.5,6.033,2.5s4.369-0.836,6.033-2.5 l19.567-19.567l17.8,17.801l-19.567,19.567c-3.337,3.336-3.337,8.73,0,12.066c1.664,1.664,3.849,2.5,6.033,2.5 c2.185,0,4.369-0.836,6.033-2.5l19.567-19.567l17.801,17.801l-19.567,19.567c-3.337,3.337-3.337,8.73,0,12.066 c1.664,1.664,3.849,2.5,6.033,2.5s4.369-0.836,6.033-2.5l19.567-19.567l19.567,19.567 C277.222,349.018,279.407,349.854,281.591,349.854z'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .icon-movement::before {
    content: '';
    display: block;
    width: 32px;
    height: 32px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' fill='%2364b5f6' height='32px' width='32px' version='1.1' id='Layer_1' viewBox='0 0 512 512' xml:space='preserve'%3E%3Cg%3E%3Cg%3E%3Cpath d='M316.02,187.316H195.971c-4.742,0-8.575,3.842-8.575,8.575V315.94c0,4.733,3.833,8.575,8.575,8.575H316.02 c4.742,0,8.575-3.842,8.575-8.575V195.891C324.595,191.158,320.762,187.316,316.02,187.316z M307.445,307.365H204.546V204.466 h102.899V307.365z'/%3E%3C/g%3E%3C/g%3E%3Cg%3E%3Cg%3E%3Cpath d='M341.882,102.098L262.701,3.135c-3.267-4.073-10.136-4.073-13.403,0l-79.172,98.963c-2.058,2.572-2.452,6.097-1.029,9.072 c1.432,2.975,4.433,4.862,7.726,4.862h40.911v40.911c0,4.733,3.833,8.575,8.575,8.575h59.39c4.742,0,8.575-3.842,8.575-8.575 v-40.911h40.911c3.301,0,6.294-1.886,7.726-4.862C344.335,108.204,343.94,104.671,341.882,102.098z M285.691,98.883 c-4.742,0-8.575,3.842-8.575,8.575v40.911h-42.24v-40.911c0-4.733-3.833-8.575-8.575-8.575h-31.633l61.328-76.668l61.328,76.668 H285.691z'/%3E%3C/g%3E%3C/g%3E%3Cg%3E%3Cg%3E%3Cpath d='M157.033,217.654h-40.911v-40.911c0-3.293-1.895-6.303-4.853-7.726c-2.984-1.423-6.508-1.029-9.081,1.038L3.216,249.218 C1.183,250.848,0,253.309,0,255.915c0,2.607,1.183,5.068,3.216,6.697l98.972,79.172c1.552,1.243,3.447,1.878,5.359,1.878 c1.26,0,2.538-0.283,3.721-0.849c2.967-1.432,4.853-4.433,4.853-7.726v-40.911h40.911c4.742,0,8.575-3.842,8.575-8.575V226.22 C165.607,221.487,161.766,217.654,157.033,217.654z M148.458,277.027h-40.911c-4.742,0-8.575,3.842-8.575,8.575v31.641 l-76.668-61.336l76.668-61.336v31.641c0,4.733,3.833,8.575,8.575,8.575h40.911V277.027z'/%3E%3C/g%3E%3C/g%3E%3Cg%3E%3Cg%3E%3Cpath d='M342.885,400.66c-1.415-2.975-4.408-4.862-7.709-4.862h-40.911v-40.911c0-4.733-3.833-8.575-8.575-8.575h-59.39 c-4.742,0-8.575,3.842-8.575,8.575v40.911h-40.911c-3.301,0-6.294,1.887-7.726,4.862c-1.423,2.967-1.029,6.5,1.029,9.072 l79.172,98.972c1.629,2.032,4.099,3.216,6.697,3.216c2.598,0,5.068-1.183,6.697-3.216l79.172-98.972 C343.914,407.16,344.309,403.636,342.885,400.66z M255.996,489.616l-61.328-76.668h31.633c4.742,0,8.575-3.842,8.575-8.575 v-40.911h42.24v40.911c0,4.733,3.833,8.575,8.575,8.575h31.633L255.996,489.616z'/%3E%3C/g%3E%3C/g%3E%3Cg%3E%3Cg%3E%3Cpath d='M508.784,249.218l-98.972-79.172c-2.581-2.067-6.122-2.461-9.081-1.038c-2.967,1.432-4.853,4.433-4.853,7.726v40.911 h-40.911c-4.742,0-8.575,3.842-8.575,8.575v59.381c0,4.733,3.833,8.575,8.575,8.575h40.911v40.911 c0,3.293,1.895,6.303,4.853,7.726c1.192,0.566,2.452,0.849,3.721,0.849c1.912,0,3.807-0.643,5.359-1.878l98.972-79.172 c2.032-1.621,3.216-4.09,3.216-6.697C512,253.309,510.817,250.848,508.784,249.218z M413.028,317.252V285.61 c0-4.733-3.833-8.575-8.575-8.575h-40.911v-42.231h40.911c4.742,0,8.575-3.842,8.575-8.575v-31.641l76.668,61.336L413.028,317.252 z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .icon-ship::before {
    content: '';
    display: block;
    width: 32px;
    height: 32px;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%2381d4fa' viewBox='0 0 64 64'><g id='Rocket_1_'><path d='M63.9999542,8.8992481c0-2.7851996-0.7939987-4.9892998-2.3593979-6.5497999C55.3563538-3.9113514,38.8339539,2.7459486,24.019455,17.5105476c-0.5382996,0.5366001-1.0302982,1.1086006-1.5033989,1.6948013-0.1553001-0.0642014-0.3339996-0.1216011-0.5394993-0.1694012-4.2666016-0.9970989-17.960001,1.3291016-21.9463005,17.2549-0.1025887,0.4081993,0.0615,0.8358994,0.4101,1.0713005,0.169,0.1152,0.3643113,0.1717987,0.5596,0.1717987,0.206,0,0.4121-0.0634003,0.5869-0.1903992,5.4105997-3.9248009,9.7511997-5.5033989,13.5403004-4.9222984-0.2614889,0.4740982-0.5269003,0.9365005-0.8010006,1.3783989-0.2451992,0.3955002-0.1855993,0.9071999,0.1435118,1.235302l1.569088,1.5639992-2.9371996,2.9263c-0.1884995,0.1875-0.2939997,0.4422989-0.2939997,0.7080002,0,0.2655983,0.1055002,0.5205002,0.2939997,0.7080002l9.8291121,9.7967987c0.1952877,0.1944008,0.4500885,0.2919998,0.7059994,0.2919998,0.255888,0,0.510788-0.097599,0.706089-0.2919998l2.9410992-2.9315987,1.5734997,1.5683975c0.1934013,0.1923027,0.4483128,0.2919998,0.7061005,0.2919998,0.1805992,0,0.3623009-0.0489006,0.5244007-0.1484985,0.4132996-0.2549019,0.8422985-0.5024986,1.283699-0.7461014,0.6509018,3.8078995-0.9258003,8.1761017-4.913599,13.6377029-0.2480011,0.3398972-0.2567997,0.7987976-0.022501,1.1474991,0.1884995,0.2812004,0.5020008,0.4423981,0.830101,0.4423981,0.0801105,0,0.1611118-0.0098,0.2411995-0.0293007,15.9404984-3.9638977,18.2959137-17.6093979,17.3134995-21.8652992-0.0601006-0.2597008-0.1386986-0.4641991-0.2238998-0.6455002,0.635498-0.5021973,1.2546997-1.0267982,1.833313-1.6035004C57.1034546,29.2185478,63.9999542,17.0662479,63.9999542,8.8992481z M16.0575562,30.5486488c-3.9013996-0.8223-8.1884995,0.3213005-13.2792997,3.5625,2.5039001-6.9482002,7.0644999-10.2305012,10.6426001-11.7763996,2.6826-1.1582012,5.1239986-1.4824009,6.6864986-1.4824009,0.4190006,0,0.7734013,0.0233994,1.0537014,0.0596008L16.0575562,30.5486488z M23.6366673,48.6179466l-8.4121113-8.384697,2.2304993-2.2217026,7.2674999,7.2423019,1.1445999,1.1404991L23.6366673,48.6179466z M41.5331535,50.5730476c-1.5468979,3.5830002-4.8417969,8.1483994-11.8368988,10.6514015,3.2461014-5.0694008,4.3935013-9.3389015,3.5703011-13.2294998l9.6737976-5.089901C43.1141548,44.2195473,42.9872551,47.203949,41.5331535,50.5730476z M34.6893539,44.8650475c-1.7586861,0.8467026-3.4335976,1.6514015-4.970686,2.5438995L16.4364567,34.1716499c0.7172985-1.2282028,1.3803997-2.5621014,2.052-3.9399014l4.0607986-7.6671009c0.8499012-1.3155994,1.7915001-2.5506992,2.8822994-3.6380997C38.9843559,5.4187484,54.916954-1.5236515,60.2284546,3.7654486c1.1758003,1.1718998,1.7714996,2.8993998,1.7714996,5.1337996,0,7.5449009-6.8251991,19.4169998-16.982399,29.5410023C42.1884537,41.2595482,38.3759537,43.0925484,34.6893539,44.8650475z'/><path d='M42.724556,12.8533487c-1.1395988,1.1337996-1.767601,2.6426001-1.767601,4.2480001,0,1.6064987,0.6280022,3.1152992,1.767601,4.2490997,1.1748009,1.1688995,2.7178001,1.7539005,4.2607002,1.7539005,1.5429993,0,3.0859985-0.585001,4.2598-1.7539005,1.139698-1.1338005,1.766613-2.642601,1.766613-4.2490997,0-1.6054001-0.626915-3.1142006-1.766613-4.2480001C48.8974533,10.5154486,45.0741539,10.5154486,42.724556,12.8533487z M49.8349533,19.9324493c-1.5722847,1.5643997-4.1279984,1.5643997-5.7001991,0-0.7588005-0.7559013-1.1777992-1.7608013-1.1777992-2.8311005,0-1.0692997,0.4189987-2.0742006,1.1777992-2.8301001,0.7861023-0.7821999,1.8183022-1.1728001,2.850502-1.1728001,1.032299,0,2.0634995,0.3906002,2.8496971,1.1728001,0.7587128,0.7558994,1.1767159,1.7608004,1.1767159,2.8301001C51.0116692,18.171648,50.5936661,19.176548,49.8349533,19.9324493z'/><path d='M16.464756,47.1472473c-0.3896008-0.3915977-1.0223999-0.3915977-1.4139996-0.0018997l-9.9950886,9.9619026c-0.3907118,0.3895988-0.3926115,1.0223999-0.0020003,1.4139977,0.1952887,0.1963005,0.4511886,0.2940025,0.7080002,0.2940025,0.2548885,0,0.5107884-0.097702,0.7060885-0.2920036l9.9951-9.9618988C16.8534565,48.1716499,16.8554554,47.5388489,16.464756,47.1472473z'/><path d='M5.7245564,51.9734497c0.2549,0,0.5106997-0.097702,0.7061114-0.2919998l6.5819998-6.5605011c0.3905888-0.3897018,0.3915882-1.0224991,0.0018883-1.4141006-0.3895998-0.3915977-1.0223999-0.392601-1.4139996-0.0019989l-6.5820999,6.5606003c-0.3906002,0.3895988-0.3916001,1.0224991-0.0019002,1.4141006C5.2118564,51.8757477,5.4677563,51.9734497,5.7245564,51.9734497z'/><path d='M18.5018559,50.5837479l-6.5819998,6.5606003c-0.3906002,0.3895988-0.3915997,1.0224991-0.0018997,1.4141006,0.1953001,0.1962013,0.4510994,0.2938995,0.7080002,0.2938995,0.2547998,0,0.5107107-0.0976982,0.7059994-0.2919998l6.5821009-6.5605011c0.3906116-0.389698,0.3916111-1.0224991,0.0018997-1.4141006C19.5263557,50.194149,18.8934555,50.1931496,18.5018559,50.5837479z'/></g></svg>") no-repeat center/contain;
  }
  .icon-system::before {
    content: '';
    display: block;
    width: 32px;
    height: 32px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32px' height='32px' viewBox='0 0 1024 1024' class='icon' version='1.1'%3E%3Cpath d='M772.672 575.808V448.192l70.848-70.848a370.688 370.688 0 0 0-56.512-97.664l-96.64 25.92-110.528-63.808-25.92-96.768a374.72 374.72 0 0 0-112.832 0l-25.92 96.768-110.528 63.808-96.64-25.92c-23.68 29.44-42.816 62.4-56.576 97.664l70.848 70.848v127.616l-70.848 70.848c13.76 35.264 32.832 68.16 56.576 97.664l96.64-25.92 110.528 63.808 25.92 96.768a374.72 374.72 0 0 0 112.832 0l25.92-96.768 110.528-63.808 96.64 25.92c23.68-29.44 42.816-62.4 56.512-97.664l-70.848-70.848z m39.744 254.848l-111.232-29.824-55.424 32-29.824 111.36c-37.76 10.24-77.44 15.808-118.4 15.808-41.024 0-80.768-5.504-118.464-15.808l-29.888-111.36-55.424-32-111.168 29.824A447.552 447.552 0 0 1 64 625.472L145.472 544v-64L64 398.528A447.552 447.552 0 0 1 182.592 193.28l111.168 29.824 55.424-32 29.888-111.36A448.512 448.512 0 0 1 497.472 64c41.024 0 80.768 5.504 118.464 15.808l29.824 111.36 55.424 32 111.232-29.824c56.32 55.68 97.92 126.144 118.592 205.184L849.472 480v64l81.536 81.472a447.552 447.552 0 0 1-118.592 205.184zM497.536 627.2a115.2 115.2 0 1 0 0-230.4 115.2 115.2 0 0 0 0 230.4z m0 76.8a192 192 0 1 1 0-384 192 192 0 0 1 0 384z' fill='%23ffd54f'/%3E%3C/svg%3E");
  }
  .log-content-wide {
    flex: 1;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: var(--text-light);
    font-size: 1.1em;
    background: transparent;
  }
  .timestamp-under {
    font-size: 0.8em;
    color: #888;
    margin-top: 2px;
    text-align: center;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .input-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 150px;
    background-color: rgba(40, 40, 40, 0.8);
    border-top: 1px solid #444;
    padding: 10px;
    z-index: 10;
  }
  
  .input-row {
    display: flex;
    gap: 10px;
    height: calc(100% - 40px);
  }
  
  .message-input {
    flex: 1;
    height: 100%;
    padding: 10px;
    background-color: rgba(50, 50, 50, 0.8);
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    resize: none;
    font-family: inherit;
  }
  
  .input-buttons {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
</style>