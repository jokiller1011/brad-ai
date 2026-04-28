// Placeholder replaced at build time by GitHub Actions
const ELEVENLABS_API_KEY = 'sk_0410ef75f8c69518bfc180c0f8944f1f5a0ea11eeb6332aa';
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice

let currentModel = 'spark';
let activeSkill = null;
let conversations = JSON.parse(localStorage.getItem('bradai_conversations')) || [];
let currentChatId = conversations.length > 0 ? conversations[0].id : null;

// DOM elements
const modelSelect = document.getElementById('model-select');
const skillsMenu = document.getElementById('skills-menu');
const skillsBtn = document.getElementById('skills-btn');
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const convList = document.getElementById('conversation-list');
const agentsSwitch = document.getElementById('agents-switch');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  modelSelect.value = currentModel;
  loadConversations();
  if (!currentChatId) createNewChat();

  // Event listeners
  modelSelect.addEventListener('change', (e) => currentModel = e.target.value);
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
  newChatBtn.addEventListener('click', createNewChat);
  skillsMenu.addEventListener('click', (e) => {
    if (e.target.classList.contains('dropdown-item')) {
      const skillId = e.target.dataset.skillId;
      activeSkill = SKILLS.find(s => s.id === skillId);
      skillsMenu.classList.add('hidden');
      skillsBtn.textContent = `Skills: ${activeSkill.name} ▾`;
    }
  });
  skillsBtn.addEventListener('click', () => skillsMenu.classList.toggle('hidden'));
  document.addEventListener('click', (e) => {
    if (!skillsBtn.contains(e.target) && !skillsMenu.contains(e.target))
      skillsMenu.classList.add('hidden');
  });

  // Suggestion chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      userInput.value = chip.dataset.prompt;
      sendMessage();
    });
  });
});

function loadConversations() {
  convList.innerHTML = '';
  conversations.forEach(conv => {
    const li = document.createElement('li');
    li.textContent = conv.title || 'New Chat';
    li.dataset.id = conv.id;
    li.addEventListener('click', () => switchConversation(conv.id));
    if (conv.id === currentChatId) li.classList.add('active');
    convList.appendChild(li);
  });
}

function createNewChat() {
  const id = Date.now().toString();
  conversations.unshift({ id, title: 'New Chat', messages: [] });
  currentChatId = id;
  saveConversations();
  loadConversations();
  clearChat();
  activeSkill = null;
  skillsBtn.textContent = 'Skills ▾';
}

function switchConversation(id) {
  currentChatId = id;
  loadConversations();
  clearChat();
  const conv = conversations.find(c => c.id === id);
  if (conv) {
    conv.messages.forEach(msg => addMessageToChat(msg.role, msg.content, false));
  }
}

function saveConversations() {
  localStorage.setItem('bradai_conversations', JSON.stringify(conversations));
}

function clearChat() {
  chatContainer.innerHTML = '';
  const welcome = document.createElement('div');
  welcome.className = 'welcome-screen';
  welcome.innerHTML = `<h1>BradAI</h1><p class="suggestions-title">Try these prompts</p>
    <div class="suggestion-chips">
      <div class="chip" data-prompt="Explain quantum computing in simple terms">Explain quantum computing</div>
      <div class="chip" data-prompt="Write a Python script to sort a list of numbers">Python sorting script</div>
      <div class="chip" data-prompt="Draft a polite email declining a meeting">Draft an email</div>
      <div class="chip" data-prompt="Solve: x^2 - 5x + 6 = 0">Math: x² - 5x + 6 = 0</div>
    </div>`;
  chatContainer.appendChild(welcome);
  // Rebind chip clicks
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      userInput.value = chip.dataset.prompt;
      sendMessage();
    });
  });
}

function sendMessage() {
  const text = userInput.value.trim();
  if (!text && selectedFiles.length === 0) return;
  
  // Hide welcome screen
  const welcome = chatContainer.querySelector('.welcome-screen');
  if (welcome) welcome.remove();

  // Add user message to chat
  addMessageToChat('user', text, true);
  userInput.value = '';

  // Save to current conversation
  const conv = conversations.find(c => c.id === currentChatId);
  if (conv) {
    conv.messages.push({ role: 'user', content: text });
    if (conv.messages.length === 1) conv.title = text.substring(0, 30);
    saveConversations();
    loadConversations();
  }

  // Simulate AI response
  setTimeout(() => {
    if (isAgentsEnabled()) {
      // Multi-agent discussion
      runAgentDiscussion(text, activeSkill ? activeSkill.preprompt : '').then(finalAnswer => {
        const conv = conversations.find(c => c.id === currentChatId);
        if (conv) {
          conv.messages.push({ role: 'assistant', content: finalAnswer });
          saveConversations();
          loadConversations();
        }
        clearFiles();
      });
    } else {
      // Single model response
      const response = generateSingleResponse(text, activeSkill);
      addMessageToChat('assistant', response, true);
      const conv = conversations.find(c => c.id === currentChatId);
      if (conv) {
        conv.messages.push({ role: 'assistant', content: response });
        saveConversations();
        loadConversations();
      }
      clearFiles();
    }
  }, 800);
}

function generateSingleResponse(userMsg, skill) {
  const skillText = skill ? `[${skill.name}] ` : '';
  switch (currentModel) {
    case 'spark': return `${skillText}✨ Spark: Here's a thoughtful response to "${userMsg}".`;
    case 'swift': return `${skillText}⚡ Swift: Fast answer: ${userMsg.toUpperCase()}.`;
    case 'fleet': return `${skillText}🚀 Fleet: Code/math solution: print("Hello, World!") // Result: 42.`;
    default: return `${skillText}🤖 Processing...`;
  }
}

function addMessageToChat(role, content, animate = false) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? 'You' : 'AI';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(contentDiv);

  // TTS for assistant
  if (role === 'assistant') {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'tts-btn';
    ttsBtn.title = 'Read aloud';
    ttsBtn.innerHTML = '🔊';
    ttsBtn.addEventListener('click', () => speakText(content));
    actions.appendChild(ttsBtn);
    msgDiv.appendChild(actions);
  }

  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ElevenLabs TTS
async function speakText(text) {
  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'sk_0410ef75f8c69518bfc180c0f8944f1f5a0ea11eeb6332aa') {
    alert('ElevenLabs API key not configured.');
    return;
  }
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    if (!response.ok) throw new Error('TTS request failed');
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error('TTS error:', error);
    alert('Failed to generate speech. Check API key.');
  }
}
