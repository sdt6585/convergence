<script>
  // Components
  import Modal from '@components/Modal.svelte';
  import Character from './Character.svelte';
  // Styles
  import '@styles/app.css'
  // Utils
  import { getContext } from 'svelte';
  import { onMount } from 'svelte';
  import { blur, slide } from 'svelte/transition';
  import logger from '@utils/logger';

  const store = getContext('store');

  let character = $state({});
  let loading = $state(false);
  let modalRef;

  export async function initiateCharacterCreation(char = {}) {
    loading = true;
    
    // Set defaults/reset character state
    character = {
      name: '',
      background: '',
      game_id: store.data.game.id,
      is_npc: false,
      is_alive: true,
      planet_id: null,
      ship_id: null,
      player_id: null,
      is_primary: false,
      race_id: null,
      subclass_id: null,
      core_skill_1_id: null,
      core_skill_2_id: null,
      core_skill_3_id: null,
      core_skill_4_id: null,
      core_skill_5_id: null,
      intelligence: 0,
      dexterity: 0,
      strength: 0,
      charisma: 0,
      intuition: 0,
      luck: 0,
      constitution: 0,
      // ...other stat/skill properties as needed
    }

    // Override with provided character values
    for (let key of Object.keys(char)) {
      character[key] = char[key];
    }

    // Make sure we have all the static data for races, classes, subclasses, and abilities
    if (store.data.races.length == 0 || store.data.classes.length == 0 || store.data.subclasses.length == 0 || store.data.abilities.length == 0) {
      await Promise.all([
        store.load_races(),
        store.load_classes(),
        store.load_subclasses(),
        store.load_abilities(),
      ]);
    }

    // Set the class_id if the subclass_id is provided
    if (char.subclass_id) {
      class_id = store.data.subclasses.find(subclass => subclass.id === char.subclass_id).class_id;
    }

    //TODO remove
    logger.debug('app', 'races', $state.snapshot(store.data.races));
    logger.debug('app', 'classes', $state.snapshot(store.data.classes));
    logger.debug('app', 'subclasses', $state.snapshot(store.data.subclasses));
    logger.debug('app', 'abilities', $state.snapshot(store.data.abilities));

    // Open modal
    modalRef.open();
    
  }

  onMount(() => {
    
  });

  // Panel order
  const panels = ['welcome', 'class', 'subclass', 'core_skills', 'race', 'stats', 'name', 'finalize'];
  let currentPanel = $state('welcome');
  let pendingPanel = null;
  
  function showPanel(panel) {
    if (panel === currentPanel) return;
    pendingPanel = panel;
    currentPanel = null; // triggers out transition
  }

  function handleOutroEnd() {
    // When the transition out finishes, show the new panel
    currentPanel = pendingPanel;
    pendingPanel = null;
  }

  // Utility functions for UI
  let selectedClass = $state(null);
  let subclassOptions = $state(null);
  let selectedSubclass = $state(null);
  let selectedRace = $state(null);
  let usedStatPoints = $derived(character.intelligence + character.charisma + character.strength + character.dexterity + character.intuition + character.luck + character.constitution);
  let remainingStatPoints = $derived(45 - usedStatPoints);
  let generatePromptText = $state('');
  let generateNameAndBackgroundPromptText = $state('');

  function handleClassChange(e) {
    const class_id = parseInt(e.target.value);
    selectedClass = store.data.classes.find(c => c.id === class_id);
    subclassOptions = store.data.subclasses.filter(s => s.class_id === class_id);

    // Clear the subclass_id and selectedSubclass
    character.subclass_id = null;
    selectedSubclass = null;

    e.srcElement.blur();
  }

  function handleSubclassChange(e) {
    character.subclass_id = parseInt(e.target.value)
    selectedSubclass = store.data.subclasses.find(s => s.id === character.subclass_id)
    // Set locked core skills from subclass.skills
    for (let i = 0; i < 5; i++) {
      character[`core_skill_${i+1}_id`] = selectedSubclass.skills[i]?.id ?? null
    }
    for (let i = selectedSubclass.skills.length; i < 5; i++) {
      character[`core_skill_${i+1}_id`] = null
    }
    // Make sure the subclass abilities are ordered by tier
    selectedSubclass.abilities.sort((a, b) => a.tier - b.tier)
    e.srcElement.blur()
  }
  
  function handleRaceChange(e) {
    character.race_id = parseInt(e.target.value);
    selectedRace = store.data.races.find(r => r.id === character.race_id);

    // Set the base stats from the race
    character.intelligence = selectedRace.base_intelligence;
    character.dexterity = selectedRace.base_dexterity;
    character.strength = selectedRace.base_strength;
    character.charisma = selectedRace.base_charisma;
    character.intuition = selectedRace.base_intuition;
    character.luck = selectedRace.base_luck;
    character.constitution = selectedRace.base_constitution;

    e.srcElement.blur();
  }

  function handleSkillChange(e, idx) {
    character[`core_skill_${idx+1}_id`] = parseInt(e.target.value)
    // Clear any other slot that has the same value
    for (let i = 0; i < 5; i++) {
      if (i !== idx && character[`core_skill_${i+1}_id`] === character[`core_skill_${idx+1}_id`]) {
        character[`core_skill_${i+1}_id`] = null
      }
    }
    e.srcElement.blur()
  }

  async function handleFinalize() {
    logger.debug('app', 'character', $state.snapshot(character));
    debugger;
    // Create the character
    let createdCharacter = await store.create_character(character);

    // Add the sub class abilities
    let abilityPromises = [];
    for (let ability of selectedSubclass.abilities) {
      abilityPromises.push(store.create_character_ability({character_id: createdCharacter.id, ability_id: ability.id}));
    }

    // Wait for all the abilities to be added
    await Promise.all(abilityPromises);

    // Close the modal
    modalRef.close();
  }

  async function handleGenerateNameAndBackground() {
    showPanel('loading');
    /**
    *  Generate the character TODO - implement Open AI API and run this through with a contextual function and some 
    *   prompt engeineering to include the character information and some game design information 
     */
    // let generatedCharacter = await store.generate_character(generatePromptText);

    // character.name = generatedCharacter.name;
    // character.background = generatedCharacter.background;
    setTimeout(() => {
      character.name = 'John Doe';
      character.background = 'John Doe is a 30 year old male who is a software engineer and lives in San Francisco.';
      showPanel('name');
    }, 1500);

    // showPanel('name');
  }

  async function handleGenerate() {
    showPanel('loading');

    // TODO - implement Open AI API and run this through with a contextual function and some prompt engeineering to include the character information and some game design information 
    setTimeout(() => {
      showPanel('finalize')
    }, 2000);
  }
  
</script>

<Modal title="Character Creation" bind:this={modalRef}>
  <div class="modal-container">
    {#if currentPanel === 'welcome'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <span>Mysteries await you as you explore the converging star systems near the supermassive black hole at the galactic core.  Describe your past to start the path to forging your destiny.</span>
        <div class="form-group" style="margin-top: 2rem;">
          <label for="character-description">Describe your character</label>
          <textarea
            id="character-description"
            class="btn"
            bind:value={generatePromptText}
            style="width: 100%; min-height: 120px; font-size: 1.1rem; padding: 1rem; resize: vertical;"
            placeholder="Write a detailed description of your character, their background, goals, and anything else you want the AI to use."
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick={handleGenerate}>Generate</button>
          <button class="btn btn-secondary" onclick={() => showPanel('class')}>Manual character creation</button>
        </div>
      </div>
    {/if}
    {#if currentPanel === 'class'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <div>
          <label class="panel-label">Select a class to determine the subclass abilities and skills for your character. You can change this selection before finalizing your character.</label>
          <select class="btn btn-primary panel-select" onchange={handleClassChange}>
            <option value="" disabled selected={!selectedClass}>Select class to view description...</option>
            {#each store.data.classes as c} <!-- class is a reserved word, using c instead -->
              <option value={c.id} selected={selectedClass?.id === c.id}>{c.name}</option>
            {/each}
          </select>
          {#if selectedClass}
            <div class="panel-description">
              <div>{selectedClass.description}</div>
              <div style="margin-top: 1rem;">Available Sub Classes:</div>
              <ul style="margin-left: 2rem;">
                {#each selectedClass.subclasses as subclass}
                  <li>
                    <div class="description-list-title">{subclass.name}:</div>
                    <div class="description-list-item">{subclass.description}</div>
                  </li>
                {/each}
              </ul>
            </div>
          {:else}
            <div class="panel-description">
              <div>&nbsp;</div>
            </div>
          {/if}
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick={() => showPanel('welcome')}>Welcome</button>
          <button class="btn btn-secondary" onclick={() => showPanel('subclass')} disabled={!selectedClass}>Select Subclass</button>
        </div>
      </div>
    {/if}
    {#if currentPanel === 'subclass'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <div>
          <label class="panel-label">Select a subclass for your character.</label>
          {#if !subclassOptions}
            <div class="error-message">You must select a class before selecting a subclass.</div>
          {:else}
            <select class="btn btn-primary panel-select" onchange={handleSubclassChange}>
              <option value="" disabled selected={!selectedSubclass}>Select subclass...</option>
              {#each subclassOptions as subclass}
                <option value={subclass.id} selected={selectedSubclass?.id === subclass.id}>{subclass.name}</option>
              {/each}
            </select>
            {#if selectedSubclass}
              <div class="panel-description">
                <div>{selectedSubclass.description}</div>
                <div style="margin-top: 1rem;">Subclass Abilities:</div>
                <ul style="margin-left: 2rem;">
                  {#each selectedSubclass.abilities as ability}
                    <li>
                      <div class="description-list-title">Tier {ability.tier}: {ability.name}</div>
                      <div class="description-list-item">{ability.description}</div>
                    </li>
                  {/each}
                </ul>
              </div>
            {:else}
              <div class="panel-description">
                <div>&nbsp;</div>
              </div>
            {/if}
          {/if}
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick={() => showPanel('class')}>Return to Class Selection</button>
          <button class="btn btn-primary" onclick={() => showPanel('core_skills')} disabled={!character.subclass_id}>Select Core Skills</button>
        </div>
      </div>
    {/if}
    {#if currentPanel === 'core_skills'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <div class="form-group">
          <label>Core Skills</label>
          {#if !character.subclass_id}
            <div class="error-message">You must select a subclass before choosing core skills.</div>
          {:else}
            {#each [0, 1, 2, 3, 4] as idx}
              {#if selectedSubclass.skills[idx]}
                <div class="form-group">
                  <label>Subclass Skill {idx+1}:</label>
                  <input class="btn" type="text" value={selectedSubclass.skills[idx].name} readonly style="width: 100%;" />
                </div>
              {:else}
                <div class="form-group">
                  <label>Selectable Class Skill {idx+1}:</label>
                  <select
                    class="btn btn-primary"
                    bind:value={character[`core_skill_${idx+1}_id`]}
                    onchange={e => handleSkillChange(e, idx)}
                    style="width: 100%;"
                  >
                    <option value="" disabled selected>Select skill...</option>
                     <!-- Filter out the subclass skills -->
                     <!-- {#each selectedClass.skills.filter(skill => !selectedSubclass.skills.some(subSkill => subSkill.id === skill.id)) as skill} -->
                    {#each selectedClass.skills.filter(skill =>
                      ![1,2,3,4,5]
                        .filter(i => i !== idx+1)
                        .map(i => character[`core_skill_${i}_id`])
                        .includes(skill.id)
                      && !selectedSubclass.skills.some(subSkill => subSkill.id === skill.id)
                    ) as skill}
                      <option value={skill.id} selected={character[`core_skill_${idx+1}_id`] === skill.id}>{skill.name}</option>
                    {/each}
                  </select>
                </div>
              {/if}
            {/each}
          {/if}
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick={() => showPanel('subclass')}>Return to Subclass Selection</button>
          <button class="btn btn-primary" onclick={() => showPanel('race')} disabled={
            !character.core_skill_1_id ||
            !character.core_skill_2_id ||
            !character.core_skill_3_id ||
            !character.core_skill_4_id ||
            !character.core_skill_5_id ||
            new Set([
              character.core_skill_1_id,
              character.core_skill_2_id,
              character.core_skill_3_id,
              character.core_skill_4_id,
              character.core_skill_5_id
            ]).size !== 5
          }>Select Race</button>
        </div>
      </div>
    {/if}
    {#if currentPanel === 'race'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <div>
          <label class="panel-label">Select your character's race.</label>
          <select class="btn btn-primary panel-select" bind:value={character.race_id} onchange={handleRaceChange}>
            <option value="" disabled selected>Select race...</option>
            {#each store.data.races as race}
              <option value={race.id} selected={selectedRace?.id === race.id}>{race.name}</option>
            {/each}
          </select>
          {#if selectedRace}
            <div class="panel-description">
              <div>{selectedRace.description}</div>
              <div style="margin-top: 1rem;">Base Stats:</div>
              <ul style="margin-left: 2rem;">
                <li>Intelligence: {selectedRace.base_intelligence}</li>
                <li>Dexterity: {selectedRace.base_dexterity}</li>
                <li>Strength: {selectedRace.base_strength}</li>
                <li>Charisma: {selectedRace.base_charisma}</li>
                <li>Intuition: {selectedRace.base_intuition}</li>
                <li>Luck: {selectedRace.base_luck}</li>
                <li>Constitution: {selectedRace.base_constitution}</li>
              </ul>
            </div>
          {:else}
            <div class="panel-description">
              <div>&nbsp;</div>
            </div>
          {/if}
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick={() => showPanel('core_skills')}>Return to Core Skills Selection</button>
          <button class="btn btn-primary" onclick={() => showPanel('stats')} disabled={!character.race_id}>Select Stats</button>
        </div>
      </div>
    {/if}
    {#if currentPanel === 'stats'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <div class="form-group">
          <span>You have 45 total skill points, 35 determined by your race and the rest selected below. Choose wisely!</span>
          <h3>Remaining points: {remainingStatPoints}</h3>
          <div class="form-group">
            <div class="stat-input-group">
              <label>Intelligence (Base: {selectedRace.base_intelligence})</label>
              <input class="btn" type="number" min="{selectedRace.base_intelligence}" max={character.intelligence + remainingStatPoints} bind:value={character.intelligence}/>
            </div>
            <div class="stat-input-group">
              <label>Dexterity (Base: {selectedRace.base_dexterity})</label>
              <input class="btn" type="number" min="{selectedRace.base_dexterity}" max={character.dexterity + remainingStatPoints} bind:value={character.dexterity}/>
            </div>
            <div class="stat-input-group">
              <label>Strength (Base: {selectedRace.base_strength})</label>
              <input class="btn" type="number" min="{selectedRace.base_strength}" max={character.strength + remainingStatPoints} bind:value={character.strength}/>
            </div>
            <div class="stat-input-group">
              <label>Charisma (Base: {selectedRace.base_charisma})</label>
              <input class="btn" type="number" min="{selectedRace.base_charisma}" max={character.charisma + remainingStatPoints} bind:value={character.charisma}/>
            </div>
            <div class="stat-input-group">
              <label>Intuition (Base: {selectedRace.base_intuition})</label>
              <input class="btn" type="number" min="{selectedRace.base_intuition}" max={character.intuition + remainingStatPoints} bind:value={character.intuition}/>
            </div>
            <div class="stat-input-group">
              <label>Luck (Base: {selectedRace.base_luck})</label>
              <input class="btn" type="number" min="{selectedRace.base_luck}" max={character.luck + remainingStatPoints} bind:value={character.luck}/>
            </div>
            <div class="stat-input-group">
              <label>Constitution (Base: {selectedRace.base_constitution})</label>
              <input class="btn" type="number" min="{selectedRace.base_constitution}" max={character.constitution + remainingStatPoints} bind:value={character.constitution}/>
            </div>

          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" onclick={() => showPanel('race')}>Return to Race Selection</button>
          <button class="btn btn-primary" onclick={() => showPanel('name')} disabled={remainingStatPoints !== 0}>Select Name & Background</button>
        </div>
      </div>
    {/if}
    {#if currentPanel === 'name'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <div class="form-group">
          <label>Generate Name & Background (AI)</label>
          <textarea class="btn" type="text" bind:value={generateNameAndBackgroundPromptText} placeholder="Add anything to guide the AI..." style="width: 100%;" />
          <button class="btn btn-primary" onclick={handleGenerateNameAndBackground}>Generate</button>
        </div>
        <div class="form-group">
          <label>Character Name</label>
          <input class="btn" type="text" bind:value={character.name} style="width: 100%;" />
        </div>
        <div class="form-group">
          <label>Background</label>
          <textarea class="btn" bind:value={character.background} style="width: 100%; min-height: 80px;"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn" onclick={() => showPanel('stats')}>Return to Stats Selection</button>
          <button class="btn btn-primary" onclick={() => showPanel('finalize')} disabled={!character.name || !character.background}>Finalize</button>
        </div>
      </div>
    {/if}
    {#if currentPanel === 'finalize'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <Character {character} />
        <div class="modal-actions">
          <button class="btn" onclick={() => showPanel('name')}>Return to Name & Background Selection</button>
          <button class="btn btn-primary" onclick={handleFinalize}>Create Character</button>
        </div>
      </div>
    {/if}
    {#if currentPanel === 'loading'}
      <div class="creation-panel" transition:slide onoutroend={handleOutroEnd}>
        <div>Loading...</div>
      </div>
    {/if}
  </div>
</Modal>

<style>
  .modal-container {
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }

  .creation-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    max-height: calc(100vh - 100px);
  }

  .creation-panel > :first-child {
    flex: 1;
  }

  .panel-label {
    margin-bottom: 20px;
    display: block;
    border-radius: 10px 10px 0 0;
    padding: 1rem;
    font-weight: bold;
  }

  .panel-select {
    border-radius: 10px 10px 0 0;
    width: 100%;
    background-color: var(--clr-surface-a20);
  }

  .panel-description {
    background: var(--clr-surface-a20);
    border-radius: 0 0 10px 10px;
    border-top: none;
    padding: 1rem;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .panel-description .description-list-title {
    font-style: italic;
    margin-top: .5rem
  }

  .panel-description .description-list-item {
    margin-left: 1rem; 
  }

  .stat-input-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .stat-input-group label {
    font-size: .9rem;
  }

  .stat-input-group input {
    width: 100%;
    padding: 5px 20px;
    border-radius: 5px;
    font-size: 2rem;
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