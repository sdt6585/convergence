<script>
  import Modal from './Modal.svelte';

  // Svelte 5 runes mode: use $props for props
  let {
    title = 'Dice Roll',
    sides = 15,
    baseStatValue = 0,
    threshold = 0,
    modifiers = [],
  } = $props();

  let isOpen = $state(false);
  let displayValue = $state(null);
  let displayModified = $state(null);
  let displayResult = $state(null);
  let displayRolls = $state([]);
  let animationDone = $state(false);
  let finalRaw = $state(0);
  let finalModified = $state(0);
  let finalResult = $state(false);
  let modalRef;

  // Helper to sum modifiers
  function sumModifiers(mods) {
    if (!mods || !Array.isArray(mods)) return 0;
    return mods.reduce((acc, m) => acc + (m.modifier || 0), 0);
  }

  // Animation logic
  async function animateRoll() {
    // Generate 10-30 random rolls
    const rollCount = Math.floor(Math.random() * 21) + 10;
    let rolls = [];
    for (let i = 0; i < rollCount - 1; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    // Final roll
    finalRaw = Math.floor(Math.random() * sides) + 1;
    rolls.push(finalRaw);
    displayRolls = rolls;

    let delay = 100;
    for (let i = 0; i < rolls.length; i++) {
      displayValue = rolls[i];
      displayModified = displayValue + baseStatValue + sumModifiers(modifiers);
      displayResult = displayModified >= threshold;
      await new Promise(res => setTimeout(res, delay));
      delay = Math.floor(delay * 1.05);
    }
    
    // Final values
    finalModified = displayModified;
    finalResult = displayResult;
    animationDone = true;

    // Return values
    return {rawResult: finalRaw, modifiedResult: finalModified, threshold, result: finalResult, title};
  }

  // Open modal and start animation
  export async function roll({ sides: s = 15, baseStatValue: b = 0, threshold: t = 0, modifiers: m = [], title: ti = 'Dice Roll'}) {
    // Set all props/state, rename to avoid reference issues
    sides = s;
    baseStatValue = b;
    threshold = t;
    modifiers = m;
    title = ti;

    // Reset animation state
    displayValue = null;
    displayModified = null;
    displayResult = null;
    displayRolls = [];
    animationDone = false;
    finalRaw = 0;
    finalModified = 0;
    finalResult = false;

    // Open the modal
    modalRef.open();

    // Return the result of the animation (the dice roll result)
    let results = await animateRoll();

    // Close the modal after a few seconds
    setTimeout(() => {
      modalRef.close();
    }, 5000);

    return results;
  }
</script>

<Modal bind:this={modalRef} title={title} closeable={false}>
  <div class="dice-modal-future">
    <div class="dice-digital-display">
      <span class="dice-value">{displayValue !== null ? displayValue : '--'}</span>
    </div>
    <div class="dice-modifiers">
      <div class="mod-row base">Base Stat: <span>{baseStatValue}</span></div>
      {#each modifiers as mod}
        <div class="mod-row {mod.modifier >= 0 ? 'pos' : 'neg'}">{mod.type}: <span>{mod.modifier >= 0 ? '+' : ''}{mod.modifier}</span></div>
      {/each}
    </div>
    <div class="dice-summary">
      <div>Threshold: <span>{threshold}</span></div>
      <div>Modified: <span>{displayModified !== null ? displayModified : '--'}</span></div>
    </div>
    
    <div class="final-result {finalResult ? 'success' : 'fail'}">
      {#if animationDone}{finalResult ? 'SUCCESS!' : 'FAILURE'}{/if}
    </div>
  </div>
</Modal>

<style>
.dice-modal-future {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #181c2f 60%, #2e2e38 100%);
  border-radius: 18px;
  box-shadow: 0 0 30px #00f2ff44, 0 0 8px #00f2ff22;
  color: #00f2ff;
  font-family: 'Share Tech Mono', 'Consolas', monospace;
}
.dice-digital-display {
  font-size: 4rem;
  background: #0a0e1a;
  border: 2px solid #00f2ff;
  border-radius: 12px;
  margin-bottom: 1.2em;
  box-shadow: 0 0 16px #00f2ff88;
  text-shadow: 0 0 8px #00f2ff, 0 0 2px #fff;
  letter-spacing: 0.1em;
  transition: background 0.2s;
  width: 230px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dice-value {
  font-variant-numeric: tabular-nums;
  font-weight: bold;
}
.dice-modifiers {
  margin-bottom: 1em;
  width: 100%;
  max-width: 320px;
}
.mod-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.2em;
  margin: 0.2em 0;
}
.mod-row.base {
  color: #00f2ff;
}
.mod-row.pos {
  color: #00ff99;
}
.mod-row.neg {
  color: #ff0055;
}
.dice-summary {
  margin-top: 1em;
  font-size: 1.1em;
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.3em;
  align-items: flex-start;
}
.dice-result {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 0.5em;
  letter-spacing: 0.1em;
  text-shadow: 0 0 8px #00f2ff, 0 0 2px #fff;
}
.dice-result.success {
  color: #00ff99;
}
.dice-result.fail {
  color: #ff0055;
}
.final-result {
  margin-top: 1.5em;
  height: 40px;
  font-size: 2em;
  font-weight: bold;
  letter-spacing: 0.15em;
  text-shadow: 0 0 12px #00f2ff, 0 0 2px #fff;
  animation: pop 0.7s cubic-bezier(.23,1.5,.32,1) 1;
}
.final-result.success {
  color: #00ff99;
}
.final-result.fail {
  color: #ff0055;
}
@keyframes pop {
  0% { transform: scale(0.7); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
</style> 