const SKILLS = [
  { id: 'general', name: 'General Assistant', preprompt: '' },
  { id: 'code', name: 'Code Generator', preprompt: 'You are an expert programmer. Provide clean, well-commented code.' },
  { id: 'math', name: 'Math Solver', preprompt: 'You are a mathematics expert. Solve problems step by step.' },
  { id: 'writing', name: 'Writing Assistant', preprompt: 'You are a professional writer. Improve grammar and style.' },
  { id: 'creative', name: 'Creative Brainstorm', preprompt: 'You are a creative assistant. Generate innovative ideas.' },
  { id: 'analyst', name: 'Data Analyst', preprompt: 'You are a data analyst. Provide insights and explanations.' }
];

// Populate skills dropdown
document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('skills-menu');
  SKILLS.forEach(skill => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.textContent = skill.name;
    item.dataset.skillId = skill.id;
    menu.appendChild(item);
  });
});
