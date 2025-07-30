import dummyData from '../../../dummy_data.json';

/**
 * Expands the Skills section if collapsed.
 */
async function expandSkillsSection(): Promise<HTMLElement | null> {
  const headers = Array.from(document.querySelectorAll('button.topBar')) as HTMLElement[];
  const header = headers.find(btn => btn.textContent?.trim().includes('Skills'));
  if (!header) {
    console.log('Skills section header not found');
    return null;
  }

  const isExpanded = header.getAttribute('aria-expanded') === 'true';
  if (!isExpanded) {
    console.log('Expanding Skills section...');
    header.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const sectionContentId = header.id.replace(':topBar', ':sectionContent');
  return document.getElementById(sectionContentId) as HTMLElement | null;
}

/**
 * Adds a single skill: type first 4 letters, wait, then select from suggestions
 */
async function addSkill(skill: string): Promise<void> {
  const skillInput = document.querySelector<HTMLInputElement>('ui5-input-xweb-skill-profiler input');
  if (!skillInput) {
    console.warn('Skill input not found');
    return;
  }
  

  // Clear and type the first 4 letters
  const searchText = skill.slice(0, 4);
  skillInput.value = '';
  skillInput.focus();
  skillInput.value = searchText;
  skillInput.dispatchEvent(new Event('input', { bubbles: true }));
  console.log(`Typing "${searchText}" to search for skill "${skill}"`);

  // Wait for suggestions
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Select suggestion
  const suggestions = Array.from(document.querySelectorAll('span.ui5-li-title')) as HTMLElement[];
  const suggestion = suggestions.find(el => el.textContent?.toLowerCase().includes(skill.toLowerCase()));

  if (suggestion) {
    suggestion.click();
    console.log(`✅ Selected skill: ${skill}`);
  } else {
    console.warn(`❌ Skill not found: ${skill}`);
  }

  // Wait 2 seconds before typing the next skill
  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Autofill Skills
 */
export async function autofillSkills(): Promise<boolean> {
  try {
    console.log('Starting autofillSkills...');

    const sectionContent = await expandSkillsSection();
    if (!sectionContent) {
      console.log('Skills section not found');
      return false;
    }

    const skills = (dummyData as any).skills;
    if (!Array.isArray(skills) || skills.length === 0) {
      console.log('No skills found in dummy data');
      return false;
    }

    for (const skill of skills) {
      await addSkill(skill);
    }

    console.log('All skills added successfully');
    return true;
  } catch (err) {
    console.error('Error autofilling skills:', err);
    return false;
  }
}
