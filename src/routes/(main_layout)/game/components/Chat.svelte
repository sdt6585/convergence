<script>
  import { onMount, tick } from 'svelte';
  import { getContext } from 'svelte';
  import logger from '@utils/logger';
  
  // Access store for data
  const store = getContext('store');
  
  // Chat state
  let messages = $state([]);
  let inputText = $state('');
  let viewport = $state(null);
  let chatMode = $state('private'); // private, agent, or public
  let isRecording = $state(false);
  let showingAllMessages = $state(false);
  
  // Example combat log content
  let combatLog = $state([
    { type: 'system', content: '=== Combat Started ===', timestamp: new Date(Date.now() - 420000) },
    { type: 'ship', content: 'Artemis has entered the sector', timestamp: new Date(Date.now() - 400000) },
    { type: 'ship', content: 'Corsair Vengeance detected on long-range scanners', timestamp: new Date(Date.now() - 380000) },
    { type: 'combat', content: 'Turn 1 - Artemis\'s turn', timestamp: new Date(Date.now() - 360000) },
    { type: 'character', content: 'Grax at weapons station', timestamp: new Date(Date.now() - 350000) },
    { type: 'combat', content: 'Artemis is firing Pulse Laser at Corsair Vengeance', timestamp: new Date(Date.now() - 340000) },
    { type: 'combat', content: 'HIT! Dealt 8 damage', timestamp: new Date(Date.now() - 330000) },
    { type: 'system', content: 'Artemis ends turn', timestamp: new Date(Date.now() - 320000) },
    { type: 'combat', content: 'Turn 1 - Corsair Vengeance\'s turn', timestamp: new Date(Date.now() - 310000) },
    { type: 'character', content: 'Gunner Draz at weapons station', timestamp: new Date(Date.now() - 300000) },
    { type: 'combat', content: 'Corsair Vengeance is firing Heavy Plasma Cannon at Artemis', timestamp: new Date(Date.now() - 290000) },
    { type: 'combat', content: 'MISS!', timestamp: new Date(Date.now() - 280000) },
    { type: 'system', content: 'Corsair Vengeance ends turn', timestamp: new Date(Date.now() - 270000) },
    { type: 'combat', content: 'Turn 2 - Artemis\'s turn', timestamp: new Date(Date.now() - 260000) },
    { type: 'character', content: 'Brad at navigation station attempts evasive maneuvers', timestamp: new Date(Date.now() - 250000) },
    { type: 'combat', content: 'Evasion roll: 14 + 8 = 22 vs difficulty 12', timestamp: new Date(Date.now() - 240000) },
    { type: 'combat', content: 'Evasion SUCCESSFUL', timestamp: new Date(Date.now() - 230000) },
    { type: 'character', content: 'Grax fires the torpedo launcher', timestamp: new Date(Date.now() - 220000) },
    { type: 'combat', content: 'Artemis is firing Torpedo Launcher at Corsair Vengeance', timestamp: new Date(Date.now() - 210000) },
    { type: 'combat', content: 'HIT! Dealt 20 damage', timestamp: new Date(Date.now() - 200000) },
    { type: 'system', content: 'Corsair Vengeance takes 20 damage! HP: 8980/9000', timestamp: new Date(Date.now() - 190000) },
    { type: 'ship', content: 'Corsair Vengeance shield levels at 1480/1500', timestamp: new Date(Date.now() - 180000) },
    { type: 'system', content: 'Artemis ends turn', timestamp: new Date(Date.now() - 170000) },
    { type: 'player', content: 'Can we try targeting their engines?', sender: 'Brad', mode: 'public', timestamp: new Date(Date.now() - 160000) },
    { type: 'ai', content: 'Targeting subsystems requires a precision weapons check. With your current weapons loadout, you have a 65% chance of success. Would you like to attempt this on your next turn?', timestamp: new Date(Date.now() - 150000) },
    { type: 'player', content: 'Yes, let\'s try that', sender: 'Brad', mode: 'agent', timestamp: new Date(Date.now() - 140000) },
    { type: 'system', content: 'Brad prepares targeting solutions for engine subsystems', timestamp: new Date(Date.now() - 130000) },
    { type: 'player', content: 'Maya, can you divert more power to forward shields?', sender: 'Alex', mode: 'private', timestamp: new Date(Date.now() - 120000) },
    { type: 'player', content: 'Already on it, Captain. Rerouting power from non-essential systems.', sender: 'Maya', mode: 'private', timestamp: new Date(Date.now() - 110000) },
    { type: 'ship', content: 'Artemis shield levels at 1050/1000 (overcharged)', timestamp: new Date(Date.now() - 100000) },
    { type: 'character', content: 'Maya successfully boosts shield capacity by 5%', timestamp: new Date(Date.now() - 90000) },
    { type: 'system', content: 'Turn 3 begins', timestamp: new Date(Date.now() - 60000) }
  ]);
  
  // Initialize with the combat log but staggered with timeouts
  onMount(() => {
    displayMessagesSequentially();
  });
  
  // Function to display messages one by one with delays
  function displayMessagesSequentially() {
    messages = []; // Start with empty messages
    let index = 0;
    
    function addNextMessage() {
      if (index < combatLog.length) {
        messages = [...messages, combatLog[index]];
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
    messages;
    const autoscroll = viewport && viewport.offsetHeight + viewport.scrollTop > viewport.scrollHeight - 50;
    
    if (autoscroll) {
      tick().then(() => {
        if (viewport) viewport.scrollTo(0, viewport.scrollHeight);
      });
    }
  });
  
  // Handle form submission
  function handleSubmit() {
    if (!inputText.trim()) return;
    
    // Add player message
    const playerMessage = {
      type: 'player',
      content: inputText,
      sender: 'Alex', // This would be the current player's character
      mode: chatMode,
      timestamp: new Date()
    };
    
    messages = [...messages, playerMessage];
    
    // Simulate AI response after a brief delay
    setTimeout(() => {
      let aiResponse;
      
      if (chatMode === 'agent') {
        aiResponse = {
          type: 'ai',
          content: `I'll help you with that. ${generateAgentResponse(inputText)}`,
          timestamp: new Date()
        };
      } else {
        aiResponse = {
          type: 'ai',
          content: generateResponse(inputText),
          timestamp: new Date()
        };
      }
      
      messages = [...messages, aiResponse];
      
      // Simulate a system message for some requests
      if (inputText.toLowerCase().includes('scan') || 
          inputText.toLowerCase().includes('fire') ||
          inputText.toLowerCase().includes('shield')) {
        
        setTimeout(() => {
          const systemMessage = {
            type: 'system',
            content: generateSystemResponse(inputText),
            timestamp: new Date()
          };
          
          messages = [...messages, systemMessage];
        }, 1000);
      }
    }, 800);
    
    // Clear input
    inputText = '';
  }
  
  // Handle chat mode change
  function setChatMode(mode) {
    chatMode = mode;
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
  
  // Helper function to generate sample responses
  function generateResponse(input) {
    const responses = [
      "I understand your query about the ship's systems.",
      "The tactical analysis suggests proceeding with caution.",
      "Based on my calculations, your plan has a 72% chance of success.",
      "I've reviewed the ship logs and found similar scenarios in the past.",
      "The crew is standing by for your orders, Captain."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Helper function to generate agent responses (more action-oriented)
  function generateAgentResponse(input) {
    const responses = [
      "I've analyzed the target's shield frequencies and adjusted our weapons accordingly.",
      "Scanning nearby sectors for potential threats or allies.",
      "Rerouting auxiliary power to the damaged systems.",
      "I've calculated an optimal evasive pattern to avoid incoming fire.",
      "Running diagnostics on the warp core to identify the anomaly."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Helper function to generate system messages
  function generateSystemResponse(input) {
    if (input.toLowerCase().includes('scan')) {
      return "Scan complete. Detected 3 vessels in the vicinity. One identified as friendly.";
    } else if (input.toLowerCase().includes('fire')) {
      return "Weapons locked. Ready to fire on your command.";
    } else if (input.toLowerCase().includes('shield')) {
      return "Shield frequencies adjusted. Efficiency increased by 12%.";
    } else {
      return "System update: All stations operating at nominal capacity.";
    }
  }
  
  // Format timestamp for display
  function formatTimestamp(timestamp) {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
</script>

<div class="chat-container">
  <div class="message-container" bind:this={viewport}>
    {#each messages as message}
      <div class="message-row {message.type} {message.mode || ''}">
        <div class="timestamp">{formatTimestamp(message.timestamp)}</div>
        <div class="message-content">
          {#if message.type === 'player'}
            <span class="sender">{message.sender}:</span>
          {/if}
          <span class="content">{message.content}</span>
        </div>
      </div>
    {/each}
  </div>
  
  <div class="input-container">
    <div class="mode-selector">
      <button class={chatMode === 'private' ? 'mode-btn active' : 'mode-btn'} onclick={() => setChatMode('private')}>
        Private
      </button>
      <button class={chatMode === 'agent' ? 'mode-btn active' : 'mode-btn'} onclick={() => setChatMode('agent')}>
        Agent
      </button>
      <button class={chatMode === 'public' ? 'mode-btn active' : 'mode-btn'} onclick={() => setChatMode('public')}>
        Public
      </button>
    </div>
    
    <div class="input-row">
      <textarea 
        class="message-input" 
        placeholder={chatMode === 'agent' ? "Enter command for the AI agent..." : "Enter message..."}
        bind:value={inputText}
        onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && (handleSubmit(), e.preventDefault())}
      ></textarea>
      
      <div class="input-buttons">
        <button class={isRecording ? "mic-btn recording" : "mic-btn"} onclick={toggleMicrophone}>
          {isRecording ? "◉" : "🎤"}
        </button>
        <button class="submit-btn" onclick={handleSubmit} disabled={!inputText.trim()}>
          Send
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .chat-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: rgba(30, 30, 30, 0.6);
    border-radius: 5px;
    overflow: hidden;
    position: relative; /* For absolute positioning of children */
  }
  
  .message-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 170px; /* Height of input container + padding */
    overflow-y: auto;
    padding: 15px;
    padding-bottom: 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .message-row {
    display: flex;
    margin-bottom: 4px;
    padding: 6px 10px;
    border-radius: 4px;
    animation: fadeIn 0.3s ease;
    max-width: 85%;
  }
  
  /* Align messages based on type */
  .system, .combat, .ship, .character, .ai {
    align-self: flex-start; /* Left align */
    margin-right: auto;
  }
  
  .player {
    align-self: flex-end; /* Right align */
    margin-left: auto;
    flex-direction: row-reverse;
  }
  
  .player .timestamp {
    text-align: right;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .timestamp {
    font-size: 0.7em;
    color: #777;
    min-width: 65px;
    margin-right: 8px;
    align-self: flex-start;
    padding-top: 3px;
  }
  
  .player .timestamp {
    margin-right: 0;
    margin-left: 8px;
  }
  
  .message-content {
    flex: 1;
    line-height: 1.4;
  }
  
  .sender {
    font-weight: bold;
    margin-right: 5px;
  }
  
  /* Message type styles */
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
  
  .player {
    background-color: rgba(40, 70, 40, 0.4);
    color: #e0e0e0;
  }
  
  .ai {
    background-color: rgba(70, 40, 70, 0.4);
    color: #e0e0e0;
  }
  
  /* Message mode indicators */
  .private .sender:after {
    content: " (private)";
    font-size: 0.8em;
    opacity: 0.7;
  }
  
  .agent .sender:after {
    content: " (agent)";
    font-size: 0.8em;
    opacity: 0.7;
  }
  
  .public .sender:after {
    content: " (public)";
    font-size: 0.8em;
    opacity: 0.7;
  }
  
  /* Input area */
  .input-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 150px; /* Fixed height for input area */
    background-color: rgba(40, 40, 40, 0.8);
    border-top: 1px solid #444;
    padding: 10px;
    z-index: 10;
  }
  
  .mode-selector {
    display: flex;
    margin-bottom: 10px;
    border-radius: 4px;
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
  
  .input-row {
    display: flex;
    gap: 10px;
    height: calc(100% - 40px); /* Account for mode selector height */
  }
  
  .message-input {
    flex: 1;
    height: 100%;
    padding: 10px;
    background-color: rgba(50, 50, 50, 0.8);
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    resize: none; /* Prevent textarea resizing since we control the size */
    font-family: inherit;
  }
  
  .input-buttons {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .mic-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background-color: rgba(60, 60, 60, 0.8);
    color: #e0e0e0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
  }
  
  .mic-btn.recording {
    background-color: rgba(200, 50, 50, 0.8);
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
  
  .submit-btn {
    flex: 1;
    padding: 8px;
    background-color: rgba(70, 50, 120, 0.8);
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
  }
  
  .submit-btn:hover {
    background-color: rgba(90, 70, 140, 0.8);
  }
  
  .submit-btn:disabled {
    background-color: rgba(60, 60, 60, 0.6);
    color: #888;
    cursor: not-allowed;
  }
</style> 