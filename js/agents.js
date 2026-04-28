// Live multi-agent discussion
const AGENT_NAMES = ['Spark', 'Swift', 'Fleet'];
const AGENT_AVATARS = { Spark: '✨', Swift: '⚡', Fleet: '🚀' };
let discussionActive = false;

function isAgentsEnabled() {
  return document.getElementById('agents-switch').checked;
}

async function runAgentDiscussion(userMessage, skillPrompt = '') {
  const container = document.getElementById('chat-container');
  if (discussionActive) return; // prevent overlapping discussions
  discussionActive = true;
  
  // Create discussion wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'discussion-container';
  wrapper.innerHTML = '<div class="discussion-header">🛠️ Agents discussing your request…</div>';
  container.appendChild(wrapper);
  
  // Build discussion script with placeholders
  const conversation = [
    { agent: 'Spark', text: `Let's break down the request: "${userMessage}". We need to consider the core intent first.` },
    { agent: 'Swift', text: `Quick initial thought: I can give a fast answer, but fleet should check the technical depth.` },
    { agent: 'Fleet', text: `Analyzing... from a code/math perspective, there are a few edge cases to note.` },
    { agent: 'Spark', text: `Good. Combining our views, the most helpful approach would be a balanced explanation plus a concrete example.` },
    { agent: 'Swift', text: `Agree. I'll keep it crisp. The user seems to want actionable information.` },
    { agent: 'Fleet', text: `I'll ensure the final solution is logically sound and, if relevant, includes a code snippet or formula.` },
    { agent: 'Spark', text: `Perfect. Let me synthesise our points into a final answer.` }
  ];
  
  // Simulate discussion with typing delays
  for (const turn of conversation) {
    await addDiscussionMessage(wrapper, turn.agent, turn.text);
    await sleep(600 + Math.random() * 400); // realistic pause
  }
  
  // Generate final answer based on the discussion
  const finalAnswer = generateAgentFinalAnswer(userMessage, skillPrompt);
  await addFinalAnswer(wrapper, finalAnswer);
  
  discussionActive = false;
}

async function addDiscussionMessage(container, agent, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `discussion-message ${agent.toLowerCase()}`;
  
  const avatar = document.createElement('span');
  avatar.className = 'discussion-avatar';
  avatar.textContent = AGENT_AVATARS[agent] || '🤖';
  
  const bubble = document.createElement('div');
  bubble.className = 'discussion-bubble';
  bubble.innerHTML = `<strong>${agent}</strong><br>`;
  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  container.appendChild(msgDiv);
  
  // Typewriter effect
  const words = text.split(' ');
  for (const word of words) {
    bubble.innerHTML += word + ' ';
    container.scrollTop = container.scrollHeight;
    await sleep(40);
  }
  // Highlight after complete
  msgDiv.classList.add('complete');
  
  container.scrollTop = container.scrollHeight;
}

async function addFinalAnswer(container, answer) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'final-answer';
  msgDiv.innerHTML = `<strong>💡 BradAI (collective)</strong><br>`;
  container.appendChild(msgDiv);
  
  // Typing effect for final answer
  const words = answer.split(' ');
  for (const word of words) {
    msgDiv.innerHTML += word + ' ';
    container.scrollTop = container.scrollHeight;
    await sleep(30);
  }
  msgDiv.classList.add('complete');
  
  // Also save this as the assistant message to history (app.js will handle saving)
  return answer;
}

function generateAgentFinalAnswer(userMessage, skillPrompt) {
  // Build a meaningful answer based on the discussion
  const base = skillPrompt ? `(Guided by skill: ${skillPrompt}) ` : '';
  return `${base}After our discussion, here’s a comprehensive answer to "${userMessage}":\n\n` +
    `• Spark’s insight: Provide clear, everyday language.\n` +
    `• Swift’s contribution: Keep it direct and actionable.\n` +
    `• Fleet’s technical check: The solution is logically solid.\n\n` +
    `🔹 Summary: [Here would be the actual AI-generated response based on our combined reasoning.]`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for app.js
window.runAgentDiscussion = runAgentDiscussion;
