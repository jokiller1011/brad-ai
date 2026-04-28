function isAgentsEnabled() {
  return document.getElementById('agents-switch').checked;
}

function renderAgentsResponse(userMessage, skillPreprompt = '') {
  const container = document.getElementById('chat-container');
  const panelsDiv = document.createElement('div');
  panelsDiv.className = 'agents-panels';

  const models = [
    { name: 'Spark', id: 'spark', color: '#10a37f' },
    { name: 'Swift', id: 'swift', color: '#5436da' },
    { name: 'Fleet', id: 'fleet', color: '#d9534f' }
  ];

  models.forEach(model => {
    const panel = document.createElement('div');
    panel.className = 'agent-panel';
    panel.innerHTML = `<div class="agent-panel-header">${model.name}</div>`;
    const content = document.createElement('div');
    content.className = 'message-content';
    // Simulate different responses per model
    content.textContent = generateMockResponse(model.id, userMessage, skillPreprompt);
    panel.appendChild(content);

    // TTS button
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'tts-btn';
    ttsBtn.title = 'Read aloud';
    ttsBtn.innerHTML = '🔊';
    ttsBtn.addEventListener('click', () => {
      speakText(content.textContent);
    });
    actions.appendChild(ttsBtn);
    panel.appendChild(actions);

    panelsDiv.appendChild(panel);
  });

  container.appendChild(panelsDiv);
  container.scrollTop = container.scrollHeight;
}

function generateMockResponse(modelId, userMsg, skill) {
  const base = skill ? `[${skill}] ` : '';
  switch (modelId) {
    case 'spark': return `${base}✨ Spark (Everyday): Sure! Here's a thoughtful response to "${userMsg}".`;
    case 'swift': return `${base}⚡ Swift (Fast): Quick answer: ${userMsg.toUpperCase()} – done!`;
    case 'fleet': return `${base}🚀 Fleet (Code/Math): Analyzing... Solution: 42 (deep reasoning applied).`;
    default: return '🤖 Processing...';
  }
}
