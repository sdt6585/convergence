import z from 'https://deno.land/x/zod@v3.25/mod.ts';
import { zodResponseFormat  } from "https://deno.land/x/openai@v4.69.0/helpers/zod.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";


export default async function characterCreation({query, authToken, openai, model, apiKey}) {
  // Connect and authenticate with Supabase - use the header auth token **hopefully**
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: true
      }
    }
  );

  // First - get the related data tables
  const { data: classes } = await supabase
    .from('class')
    .select('id, name, description, class_skill(*)');
  const { data: races } = await supabase
    .from('race')
    .select('id, name, description, base_intelligence, base_strength, base_constitution, base_dexterity, base_charisma, base_luck, base_intuition');
  const { data: subclasses } = await supabase
    .from('subclass')
    .select('id, name, description, class_id, subclass_skill(*)');

  let classDescriptions = ''
  for (const c of classes) {
    classDescriptions += `      - ${c.name}: ${c.description}`;
    for (const subclass of subclasses.filter(s => s.class_id === c.id)) {
      classDescriptions += `\n         - ${subclass.name}: ${subclass.description}`;
    };
  };

  let raceDescriptions = ''
  for (const r of races) {
    raceDescriptions += `      - ${r.name}: ${r.description}`;
  };

  /**
   * This will be a multi step process:
   * 1. Generate a background
   * 2. Generate a name, class, subclass, and race based on the background
   * 3. Generate core skills based on the number of selectable skills (skip if all 5 are subclass selected)
   * 4. Geneate stats based on the base stats plus the background - in parrallel to step 3
   * 5. Create or return the character based on what was passed in
   */
  const backgroundSystemMessage = {
    role: "system" as const,
    content: `
      You are an expert AI storyteller helping create immersive and lore-consistent character backgrounds for the tabletop RPG *Project: Gargantua*. The game takes place in a science-fantasy universe full of high-tech spacefaring civilizations, complex interstellar politics, and a galaxy spiraling toward an unknown fate.

      Your goal is to generate a compelling and coherent character background using both creative inspiration and the structured lore of the Gargantua universe. Each background should logically support the eventual choice of race, class, subclass, stats, and skills.

      You may be given freeform input from the user — from simple ideas like "make a character like Lelouch from Code Geass" to detailed lore-based requests. Use your creativity to adapt to the tone, archetype, and goals expressed by the user, while grounding the character in the game's established factions, races, classes, and backgrounds.

      Use the following lore and mechanics as context:

      ---

      ### 📖 Core Setting: The Convergence

      At the heart of the known galaxy lies a supermassive black hole known as **The Lodestone**, exerting both gravitational and narrative pull. Around it spirals a dense network of star systems, factions, and ancient secrets. Every race and polity is slowly being drawn together—some voluntarily, others through force or survival necessity.

      Political tension simmers as species once separated by time and space now encounter each other for the first time. Diplomacy, warfare, espionage, and trade shape the new galactic frontier. Amid the chaos lies something deeper—mysteries that ripple beneath the surface of space, waiting to be discovered by brave (or desperate) adventurers.

      ---

      ### 🛡️ Factions:

      - **Confederation of Allied Races (CAR)**  
        Appearing egalitarian on the outside but rife with bureaucracy, internal power struggles, and political manipulation. Ideal for naive idealists or cunning operatives cloaked in virtue.

      - **Free Traders**  
        Capitalists, smugglers, explorers. Libertarians at heart, opportunists by nature. Witty, charming, and ruthlessly self-interested if profit's on the line.

      - **Corsairs**  
        Militaristic, hierarchy-driven, and highly competent. Less concerned with conquest than with control over their own space. Honor-bound but fearsome. Cross them at your peril.

      ---

      ### 🧬 Races:

      ${raceDescriptions}

      ---

      ### 🧭 Backgrounds:

      - **Core Worlder**  
        Raised in a sophisticated civilization—exposure to wealth, technology, and bureaucracy.

      - **Spack Hick**  
        Rugged and pragmatic survivors from the outer reaches of space. Grew up in isolation and adversity.

      - **Ship Rat**  
        Grew up aboard starships. Scrappy, curious, and mechanically savvy.

      ---

      ### ⚔️ Classes & Subclasses:

      ${classDescriptions}

      ---

      ### ✨ What Makes a Strong Background Story

      Use this loose outline to construct a 3–5 paragraph background:

      1. **Family Origins**: Culture, environment, values they were raised with.
      2. **Childhood Conflict**: A formative event that shaped their teenage years.
      3. **Coming of Age**: How their personality evolved, and a major event just before adulthood.
      4. **Motivations & Quirks**: What drives them? What odd habits, beliefs, or traits define them?
      5. **Class Calling**: Why did they choose their class? Who trained them, or what compelled them?
      6. **Inciting Incident**: A pivotal inspiration, loss, or betrayal that led them to their current adventure.
      7. **Religious or Spiritual Views**: Atheist, agnostic, devotee of something ancient or strange?
      8. **Hobbies and Habits**: Card games? Ship maintenance? Singing in zero-G?

      ---

      ### 💡 Final Notes:

      - The next user message will contain their unique desires — use them as part of your background generation.
      - If no user input is provided, choose from one of the following themes to guide the story:
        - Tragic
        - Heroic
        - Self-Sacrificing
        - Intellectual
        - Spiritual
        - Healer
        - Narcissist
        - Dark Humor
        - Light Humor
        - Vengeful
        - Curious
        - Reluctant Hero
        - Burnt-Out Veteran
        - Reluctant Villain
        - Loyal Follower
        - Hidden Power

      - Do **not** output stats or specific mechanical data.
      - Ground everything in the *style and tone* of Gargantua.
      - Respond with only the background story, no other text.
    `
  }
  
  const backgroundResponse = await openai.chat.completions.create({
    model,
    messages: [backgroundSystemMessage, { role: "user", content: query }],
  });

  const background = backgroundResponse.choices[0].message.content;


  // Name, Class, and Race based on background
  const nameClassRaceSystemMessage = {
    role: "system" as const,
    content: `
      You are a character creation AI for the tabletop RPG *Project: Gargantua*. Your role is to use the provided character background to choose a coherent and compelling **race**, **class**, and **name** for the character. These choices should align with the character's tone, goals, personality, and origin story.

      Use the game's narrative and mechanical design to make decisions that feel both immersive and balanced. Favor combinations that enhance storytelling potential, emotional consistency, and internal logic.

      The character background is provided below:

      ${background}

      ### 🧬 Races
      Choose the id of one of the following races. Use both the description and the tone of the background to determine the best fit.

      ${JSON.stringify(races)}

      ### 🛡️ Classes
      Choose the id of one of the following classes based on the character's skills, background, and motivations.

      ${JSON.stringify(classes)}

      ### ✍️ Naming Guidelines
      Generate a name that fits the character's race and background tone:
      - Troydian names are often short, guttural, or militaristic.
      - C'Than names tend to be cold, elegant, or data-like.
      - Human names can range from traditional to space-age, depending on cultural influence (e.g., Earthlike, Western, East Asian, Afro-futurist, etc.).

      ### 🧾 Output Format
      Respond **only** with a JSON object:

      {
        "name": "Character Name",
        "race_id": 2,
        "class_id": 4
      }

      Do not explain your choices. Do not include stats, subclasses, or extra text.
    `
  };

  const nameClassRaceSelectionSchema = z.object({
    name: z.string().min(1).max(100).describe('A full character name appropriate to the chosen race and tone'),
    race_id: z.number().int().refine(val => races?.some((r: any) => r.id === val), "Invalid race ID").describe('Race ID (1 = Troydian, 2 = C\'Than, 3 = Human)'),
    class_id: z.number().int().refine(val => classes?.some((c: any) => c.id === val), "Invalid class ID").describe('Class ID (1 = Pilot, 2 = Drop Trooper, ..., 7 = Commander)'),
  });

  const nameClassRaceResponse = await openai.beta.chat.completions.parse({
    model,
    response_format: zodResponseFormat(nameClassRaceSelectionSchema, 'name_class_race_selection'),
    messages: [nameClassRaceSystemMessage],
  });

  const nameClassRace = nameClassRaceResponse.choices[0].message.parsed;

  // Filter the subclasses based on the class_id generated
  const availableSubclasses = subclasses.filter(subclass => subclass.class_id === nameClassRace.class_id);

  const selectedRace = races.find(r => r.id === nameClassRace.race_id);
  const raceBaseStats = `
    Intelligence: ${selectedRace?.base_intelligence}
    Strength: ${selectedRace?.base_strength}
    Constitution: ${selectedRace?.base_constitution}
    Dexterity: ${selectedRace?.base_dexterity}
    Charisma: ${selectedRace?.base_charisma}
    Luck: ${selectedRace?.base_luck}
  `;
  const selectedClass = classes.find(c => c.id === nameClassRace.class_id);


  // Generate the subclass
  // TODO - need to query the database for race, class, and subclass - this is silly
  const subclassSystemMessage = {
    role: "system" as const,
    content: `
      You are an AI character builder for the tabletop RPG *Project: Gargantua*. You have been given a fully written character background, along with the selected race and class. Your task is to:

      1. Choose the most narratively and mechanically appropriate **subclass** from the list provided.
      2. Allocate 10 stat points across the character's core stats based on their background, race, and class.

      ### 📖 Character Background:
      ${background}

      ### 🧬 Race: ${selectedRace?.name}
      This determines the character's **base stats**:

      ${raceBaseStats}  
      *(e.g. { intelligence: 6, strength: 4, luck: 1, ... })*

      ### 🛡️ Class ID: ${selectedClass?.name}
      This determines available **subclasses**. Choose one that fits the story and strengths of the character.

      ### 🧱 Subclasses (Available):
      ${JSON.stringify(availableSubclasses)}

      ---

      ### 🧮 Stat Allocation Rules

      - You have **10 points** to distribute.
      - You may allocate points to any of the following stats:
        - Intelligence, Dexterity, Strength, Charisma, Intuition, Constitution, Luck
      - Each point added to **Luck beyond 1** costs **2 points**.
      - All other stats cost 1 point per increase.
      - Do not exceed the 10-point allocation limit based on cost.
      - Total allocated points must equal 10 using the formula:
        (luck - 1) * 2 + 1 + intelligence + dexterity + strength + charisma + constitution = 10
        

      ### 🧾 Output Format
      Return only the following JSON object:

      {
        "subclass_id": 2,
        "allocated_stats": {
          "intelligence": 1,
          "dexterity": 2,
          "strength": 0,
          "charisma": 1,
          "intuition": 2,
          "constitution": 1,
          "luck": 3
        }
      }

      The values in allocated_stats should represent the **points added** to the **base stats**. Do not include totals or base values.

      Do not return explanations or narrative text. Focus only on the data output.
    `
  };

  const subclassSelectionSchema = z.object({
    subclass_id: z.number().int().refine(val => availableSubclasses?.some((s: any) => s.id === val), "Invalid subclass ID").describe('Subclass ID'),
    intelligence: z.number().int().min(0).max(10).describe('Intelligence stat'),
    dexterity: z.number().int().min(0).max(10).describe('Dexterity stat'),
    strength: z.number().int().min(0).max(10).describe('Strength stat'),
    charisma: z.number().int().min(0).max(10).describe('Charisma stat'),
    intuition: z.number().int().min(0).max(10).describe('Intuition stat'),
    constitution: z.number().int().min(0).max(10).describe('Constitution stat'),
    luck: z.number().int().min(0).max(5).describe('Luck stat'),
  });

  const subclassResponse = await openai.beta.chat.completions.parse({
    model,
    response_format: zodResponseFormat(subclassSelectionSchema, 'subclass_selection'),
    messages: [subclassSystemMessage],
  });

  const subclassStats = subclassResponse.choices[0].message.parsed;
  const selectedSubclass = availableSubclasses.find(s => s.id === subclassStats.subclass_id);


  // Select the unselecte core skills
  let coreSkills = {
    core_skill_1_id: null,
    core_skill_2_id: null,
    core_skill_3_id: null,
    core_skill_4_id: null,
    core_skill_5_id: null,
  }

  // Select the subclass core skills (1-5, varies by subclass)
  let availableCoreSkills = [...selectedClass.class_skill];

  for (const [i, skill] of selectedSubclass.subclass_skill.entries()) {
    // Set the core skill
    coreSkills[`core_skill_${i + 1}_id`] = skill.skill_id;

    // Remove the skill from the available core skills
    availableCoreSkills = availableCoreSkills.filter(s => s.id !== skill.skill_id);
  }

  // If there are remaining core skills, select from the class skills
  if (selectedSubclass.subclass_skill.length < 5) {
    const coreSkillSystemMessage = {
      role: "system" as const,
      content: `
        Fill in the remaining non null core skills for the character described below.  Pick the best skills to fit their background, race, class, and subclass:

        ${background}

        Race: ${selectedRace?.name}

        Class: ${selectedClass?.name}

        Subclass: ${selectedSubclass?.name}
        
        Core skills already selected have values, return them with the new selected values.  Each core_skill must be unique:

        ${JSON.stringify(coreSkills)}

        Avalable Core Skills to choose from:

        ${JSON.stringify(availableCoreSkills)}

        ### 🧾 Output Format
        Return only the following JSON object:

        {
          "core_skill_1_id": 1,
          "core_skill_2_id": 2,
          "core_skill_3_id": 3,
          "core_skill_4_id": 4,
          "core_skill_5_id": 5
        }
      `
    };

    const availableSkillIds = availableCoreSkills?.map((s: any) => s.id) || [];
    
    const coreSkillSchema = z.object({
      core_skill_1_id: z.number().int().refine(val => 
        coreSkills.core_skill_1_id ? val === coreSkills.core_skill_1_id : availableSkillIds.includes(val), 
        "Invalid core skill 1 ID"
      ).describe('Core Skill 1 ID'),
      core_skill_2_id: z.number().int().refine(val => 
        coreSkills.core_skill_2_id ? val === coreSkills.core_skill_2_id : availableSkillIds.includes(val), 
        "Invalid core skill 2 ID"
      ).describe('Core Skill 2 ID'),
      core_skill_3_id: z.number().int().refine(val => 
        coreSkills.core_skill_3_id ? val === coreSkills.core_skill_3_id : availableSkillIds.includes(val), 
        "Invalid core skill 3 ID"
      ).describe('Core Skill 3 ID'),
      core_skill_4_id: z.number().int().refine(val => 
        coreSkills.core_skill_4_id ? val === coreSkills.core_skill_4_id : availableSkillIds.includes(val), 
        "Invalid core skill 4 ID"
      ).describe('Core Skill 4 ID'),
      core_skill_5_id: z.number().int().refine(val => 
        coreSkills.core_skill_5_id ? val === coreSkills.core_skill_5_id : availableSkillIds.includes(val), 
        "Invalid core skill 5 ID"
      ).describe('Core Skill 5 ID'),
    });

    const coreSkillResponse = await openai.beta.chat.completions.parse({
      model,
      response_format: zodResponseFormat(coreSkillSchema, 'core_skill_selection'),
      messages: [coreSkillSystemMessage],
    });

    coreSkills = coreSkillResponse.choices[0].message.parsed;
  }
  
  // Construct the character
  return  {
    name: nameClassRace.name,
    race_id: nameClassRace.race_id,
    class_id: nameClassRace.class_id,
    subclass_id: subclassStats.subclass_id,
    core_skill_1_id: coreSkills.core_skill_1_id,
    core_skill_2_id: coreSkills.core_skill_2_id,
    core_skill_3_id: coreSkills.core_skill_3_id,
    core_skill_4_id: coreSkills.core_skill_4_id,
    core_skill_5_id: coreSkills.core_skill_5_id,
    background: background,
    intelligence: subclassStats.intelligence + selectedRace.base_intelligence,
    dexterity: subclassStats.dexterity + selectedRace.base_dexterity,
    strength: subclassStats.strength + selectedRace.base_strength,
    charisma: subclassStats.charisma + selectedRace.base_charisma,
    intuition: subclassStats.intuition + selectedRace.base_intuition,
    constitution: subclassStats.constitution + selectedRace.base_constitution,
    luck: subclassStats.luck + selectedRace.base_luck,
  }
  
}