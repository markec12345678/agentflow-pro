/**
 * Skills Integration Mock
 * Placeholder for skills system
 */

export const skillsIntegration = {
  listSkills: async () => [],
  executeSkill: async (name: string, args: any) => ({ success: true, result: null }),
  getSkillInfo: async (name: string) => ({ name, description: 'Skill' }),
};
