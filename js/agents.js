// Live multi-agent discussion (mock version)
const AGENT_AVATARS = { Spark: '✨', Swift: '⚡', Fleet: '🚀' };
let discussionActive = false;

function isAgentsEnabled() {
  return document.getElementById('agents-switch').checked;
}

async function runAgentDiscussion(userMessage, skillPrompt = '') {
  const container = document.getElementById('chat-container');
  if (discussionActive) return;
  discussionActive = true;

  const wrapper = document.createElement('div');
  wrapper.className = 'discussion-container';
  wrapper.innerHTML = '<div class="discussion-header">🛠️ Agents discussing your request…</div>';
  container.appendChild(wrapper);

  const conversation = [
    { agent: 'Spark', text: `Let's break down: "${userMessage}".` },
    { agent: 'Swift', text: `Quick take – I can give a fast answer.` },
    { agent: 'Fleet', text: `Checking technical depth…` },
    { agent: 'Spark', text: `Merging views.` },
    { agent: 'Swift', text: `Agreed, let's keep it actionable.` },
    { agent: 'Fleet', text: `Conclusion: a concise answer with an example.` }
  ];

  for (const turn of conversation) {
    await addDiscussionMessage(wrapper, turn.agent, turn.text);
    await new Promise(r => setTimeout(r, 700));
  }

  const final = `**Collective answer:**\n- ${userMessage} explained simply.\n- Example: [demo code]\n- (Replace with real agent output when connected)`;
  await addFinalAnswer(wrapper, final);
  discussionActive = false;
  return final;
}

async function addDiscussionMessage(container, agent, text) {
  const msg = document.createElement('div');
  msg.className = `discussion-message ${agent.toLowerCase()}`;
  msg.innerHTML = `<span class="discussion-avatar">${AGENT_AVATARS[agent]}</span>
                   <div class="discussion-bubble"><strong>${agent}</strong><br>${text}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

async function addFinalAnswer(container, text) {
  const msg = document.createElement('div');
  msg.className = 'final-answer';
  msg.innerHTML = `<strong>💡 BradAI</strong><br>${text.replace(/\n/g, '<br>')}`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

window.runAgentDiscussion = runAgentDiscussion;
