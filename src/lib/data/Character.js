/**
 * Character Model Class
 * Extends character data with helper methods for skill calculations and other functionality
 */
export function createCharacter(data, store) {
  const character = {
    ...data,
    store,
    getSkillLevel(skillName) {
      const fieldName = `${skillName.toLowerCase().replace(/\s+/g, '_')}_success_checks`;
      const successChecks = this[fieldName] || 0;
      if (successChecks < 1) return 0;
      if (successChecks < 5) return 1;
      if (successChecks < 15) return 2;
      if (successChecks < 30) return 3;
      if (successChecks < 60) return 4;
      if (successChecks < 120) return 5;
      if (successChecks < 240) return 6;
      if (successChecks < 480) return 7;
      if (successChecks < 960) return 8;
      if (successChecks < 1920) return 9;
      return 10;
    },
    getSkillProgress(skillName) {
      const thresholds = [0, 1, 5, 15, 30, 60, 120, 240, 480, 960, 1920];
      const fieldName = `${skillName.toLowerCase().replace(/\s+/g, '_')}_success_checks`;
      const successChecks = this[fieldName] || 0;
      const level = this.getSkillLevel(skillName);
      if (level >= 10) {
        return {
          success_rolls: successChecks,
          rolls_to_next_level: 0,
          next_level_rolls_required: 0
        };
      }
      const currentLevelMin = thresholds[level];
      const nextLevelMin = thresholds[level + 1];
      const levelRange = nextLevelMin - currentLevelMin;
      const rolls_to_next_level = nextLevelMin - successChecks;
      return {
        success_checks: successChecks,
        rolls_to_next_level,
        next_level_rolls_required: levelRange
      };
    },
    getSkill(skillName) {
      const skill = this.store.data.skills.find(skill => 
        skill.field_name === skillName 
        || skill.name === skillName 
        || skill.id === skillName
      );
      const successChecksField = skill.field_name + '_success_checks';
      const successChecks = this[successChecksField] || 0;
      const level = this.getSkillLevel(skillName);
      const progressInfo = this.getSkillProgress(skillName);
      return {
        level,
        ...progressInfo,
        skill
      };
    },
    getSkills() {
      return this.store.data.skills.map(skill => ({
        name: skill.name,
        ...this.getSkill(skill.field_name)
      }));
    },
    getSkillsByCategory() {
      const allSkills = this.getSkills();
      const coreSkillMap = {};
      if (this.core_skill_1) coreSkillMap[this.core_skill_1.field_name] = 1;
      if (this.core_skill_2) coreSkillMap[this.core_skill_2.field_name] = 2;
      if (this.core_skill_3) coreSkillMap[this.core_skill_3.field_name] = 3;
      if (this.core_skill_4) coreSkillMap[this.core_skill_4.field_name] = 4;
      if (this.core_skill_5) coreSkillMap[this.core_skill_5.field_name] = 5;
      const coreSkills = [];
      const categories = {};
      for (const skill of allSkills) {
        const isCoreSkill = skill.skill && skill.skill.field_name in coreSkillMap;
        if (isCoreSkill) {
          skill.isCoreSkill = true;
          skill.corePosition = coreSkillMap[skill.skill.field_name];
          coreSkills.push(skill);
          continue;
        }
        const category = skill.skill && skill.skill.category ? skill.skill.category : 'Other';
        if (!categories[category]) categories[category] = [];
        categories[category].push(skill);
      }
      coreSkills.sort((a, b) => a.corePosition - b.corePosition);
      for (const cat in categories) {
        categories[cat].sort((a, b) => {
          const aOrd = a.skill && typeof a.skill.ordinal_position === 'number' ? a.skill.ordinal_position : Infinity;
          const bOrd = b.skill && typeof b.skill.ordinal_position === 'number' ? b.skill.ordinal_position : Infinity;
          if (aOrd !== bOrd) return aOrd - bOrd;
          return a.skill.name.localeCompare(b.skill.name);
        });
      }
      const result = [];
      if (coreSkills.length > 0) {
        result.push({ name: 'Core', skills: coreSkills });
      }
      for (const category of Object.keys(categories).sort()) {
        result.push({ name: this.formatCategoryName(category), skills: categories[category] });
      }
      return result;
    },
    formatCategoryName(category) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };
  return character;
}