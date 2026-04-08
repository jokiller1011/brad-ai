// ============================================
// BRAD AI - MAIN APPLICATION
// ============================================

const SUPABASE_URL = 'https://fjxcmnyeipwequaxmdlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeGNtbnllaXB3ZXF1YXhtZGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODM2NjAsImV4cCI6MjA5MTI1OTY2MH0.2d5ax1fYJtQIF0Ne0xhbH9tzQivS9M-WBN5WaVOSbBA';

// Fix for GitHub Pages subpath redirect
if (window.location.hash.includes('access_token') && window.location.pathname !== '/brad-ai/') {
    window.location.replace('/brad-ai/' + window.location.hash);
}

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { aiService } from './ai-service.js';
import { agentService } from './agent-service.js';
import { fileService } from './file-service.js';

// State
let currentUser = null;
let currentTheme = 'light';
let messages = [];
let usage = {
    swift: 0,
    spark: 0,
    fleet: 0,
    agents: 0,
    uploads: 0
};
let subscriptionTier = 'free';
let agentEnabled = false;
const currentWorkflow = 'research-writer';

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authTabs = document.querySelectorAll('.auth-tab');
const githubSigninBtn = document.getElementById('github-signin');
const signoutBtn = document.getElementById('signout-btn');
const userEmailDisplay = document.getElementById('user-email-display');
const userAvatar = document.getElementById('user-avatar');
const themeToggle = document.getElementById('theme-toggle');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const newChatBtn = document.getElementById('new-chat-btn');
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const messagesContainer = document.getElementById('messages-container');
const welcomeScreen = document.getElementById('welcome-screen');
const modelSelect = document.getElementById('model-select');
const usageBadge = document.getElementById('usage-badge');
const agentToggle = document.getElementById('agent-toggle');
const fileInput = document.getElementById('file-input');
const fileUploadBtn = document.getElementById('file-upload-btn');

// Settings Modal Elements
const settingsModal = document.getElementById('settings-modal');
const userProfileBtn = document.getElementById('user-profile');
const closeSettingsBtn = document.getElementById('close-settings-modal');
const settingsEmail = document.getElementById('settings-email');
const settingsUserId = document.getElementById('settings-user-id');
const settingsPlan = document.getElementById('settings-plan');
const settingsSwiftUsage = document.getElementById('settings-swift-usage');
const settingsSparkUsage = document.getElementById('settings-spark-usage');
const settingsFleetUsage = document.getElementById('settings-fleet-usage');
const settingsAgentUsage = document.getElementById('settings-agent-usage');
const settingsUploadUsage = document.getElementById('settings-upload-usage');
const manageSubscriptionBtn = document.getElementById('manage-subscription-btn');
const upgradePlanBtn = document.getElementById('upgrade-plan-btn');

let authMode = 'signin';

lucide.createIcons();

// ============================================
// AUTHENTICATION
// ============================================
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        authMode = tab.dataset.tab;
        authSubmitBtn.textContent = authMode === 'signin' ? 'Sign In' : 'Sign Up';
    });
});

// Shared email authentication function
async function handleEmailAuth() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    authError.textContent = '';
    
    if (!email || !password) {
        authError.textContent = 'Please enter email and password.';
        return;
    }
    
    try {
        let result;
        if (authMode === 'signin') {
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            result = await supabase.auth.signUp({ email, password });
        }
        if (result.error) throw result.error;
        if (authMode === 'signup') {
            authError.textContent = 'Check your email for confirmation link.';
        }
    } catch (error) {
        authError.textContent = error.message;
    }
}

// Form submit handler
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleEmailAuth();
});

// Fallback click handler for Chromebook
authSubmitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleEmailAuth();
});

// GitHub OAuth with correct redirect
githubSigninBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: { 
                redirectTo: 'https://jokiller1011.github.io/brad-ai/' 
            }
        });
        if (error) throw error;
    } catch (error) {
        authError.textContent = error.message;
    }
});

signoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        currentUser = session.user;
        showApp();
        loadUserProfile();
        loadUsageData();
        initializeAgents();
    } else {
        currentUser = null;
        showAuth();
    }
});

function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    userEmailDisplay.textContent = currentUser.email;
    userAvatar.textContent = currentUser.email.charAt(0).toUpperCase();
    updateSettingsModal();
    lucide.createIcons();
}

function showAuth() {
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
}

async function loadUserProfile() {
    subscriptionTier = 'free';
    updateUsageDisplay();
}

async function loadUsageData() {
    updateUsageDisplay();
}

function updateUsageDisplay() {
    const limits = {
        free: { swift: 15, spark: 20, fleet: 4, agents: 5, uploads: 10 }
    };
    const limit = limits[subscriptionTier]?.swift || 15;
    usageBadge.innerHTML = `<span>${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} · Swift ${usage.swift}/${limit === Infinity ? '∞' : limit}</span>`;
    updateSettingsModal();
}

// ============================================
// THEME
// ============================================
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    const icon = theme === 'dark' ? 'sun' : 'moon';
    themeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
    lucide.createIcons();
    localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

// ============================================
// UI INTERACTIONS
// ============================================
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const icon = sidebar.classList.contains('collapsed') ? 'panel-left-close' : 'panel-left-open';
    sidebarToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
    lucide.createIcons();
});

newChatBtn.addEventListener('click', () => {
    messages = [];
    renderMessages();
    welcomeScreen.style.display = 'flex';
});

agentToggle.addEventListener('click', () => {
    agentEnabled = !agentEnabled;
    agentToggle.classList.toggle('active', agentEnabled);
    const icon = agentToggle.querySelector('i');
    icon.setAttribute('data-lucide', agentEnabled ? 'users' : 'user');
    lucide.createIcons();
});

// ============================================
// SETTINGS MODAL
// ============================================
userProfileBtn.addEventListener('click', () => {
    updateSettingsModal();
    settingsModal.style.display = 'flex';
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

manageSubscriptionBtn.addEventListener('click', () => {
    window.open('https://billing.stripe.com/p/login/test_123', '_blank');
});

upgradePlanBtn.addEventListener('click', () => {
    window.open('https://buy.stripe.com/test_123', '_blank');
});

function updateSettingsModal() {
    if (!currentUser) return;
    
    settingsEmail.textContent = currentUser.email;
    settingsUserId.textContent = currentUser.id.substring(0, 16) + '...';
    settingsPlan.textContent = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);
    
    const limits = {
        free: { swift: 15, spark: 20, fleet: 4, agents: 5, uploads: 10 }
    };
    const limit = limits[subscriptionTier] || limits.free;
    
    settingsSwiftUsage.textContent = `${usage.swift} / ${limit.swift === Infinity ? '∞' : limit.swift}`;
    settingsSparkUsage.textContent = `${usage.spark} / ${limit.spark === Infinity ? '∞' : limit.spark}`;
    settingsFleetUsage.textContent = `${usage.fleet} / ${limit.fleet === Infinity ? '∞' : limit.fleet}`;
    settingsAgentUsage.textContent = `${usage.agents} / ${limit.agents === Infinity ? '∞' : limit.agents}`;
    settingsUploadUsage.textContent = `${usage.uploads} / ${limit.uploads === Infinity ? '∞' : limit.uploads}`;
}

// ============================================
// MESSAGING & AI
// ============================================
function addMessage(role, content, id = null) {
    const messageId = id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    messages.push({ role, content, id: messageId });
    renderMessages();
    return messageId;
}

function renderMessages() {
    if (messages.length === 0) {
        welcomeScreen.style.display = 'flex';
        messagesContainer.innerHTML = '';
        messagesContainer.appendChild(welcomeScreen);
        return;
    }
    
    welcomeScreen.style.display = 'none';
    let html = '';
    messages.forEach(msg => {
        html += `
            <div class="message ${msg.role}" id="${msg.id}">
                <div class="message-content">${escapeHtml(msg.content)}</div>
            </div>
        `;
    });
    messagesContainer.innerHTML = html;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    lucide.createIcons();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addLoadingMessage() {
    const loadingId = `loading-${Date.now()}`;
    const loadingHtml = `
        <div class="message assistant" id="${loadingId}">
            <div class="message-content">
                <span class="loading-spinner"></span> Thinking...
            </div>
        </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', loadingHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return loadingId;
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    
    const model = modelSelect.value;
    
    if (subscriptionTier === 'free') {
        const limits = { swift: 15, spark: 20, fleet: 4 };
        if (usage[model] >= limits[model]) {
            alert(`You've reached your ${model} limit. Upgrade to continue.`);
            return;
        }
    }
    
    addMessage('user', text);
    userInput.value = '';
    welcomeScreen.style.display = 'none';
    
    try {
        const loadingId = addLoadingMessage();
        
        if (aiService.getCurrentModelType() !== model) {
            const originalBadgeText = usageBadge.innerHTML;
            usageBadge.innerHTML = `<span>Loading ${model}... 0%</span>`;
            
            await aiService.loadModel(model, (progress) => {
                if (progress.status === 'loading') {
                    usageBadge.innerHTML = `<span>Loading ${model}: ${progress.progress}%</span>`;
                } else if (progress.status === 'ready') {
                    usageBadge.innerHTML = originalBadgeText;
                }
            });
        }
        
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        
        const assistantMessageId = addMessage('assistant', '');
        const messageDiv = document.getElementById(assistantMessageId);
        const assistantElement = messageDiv ? messageDiv.querySelector('.message-content') : null;
        
        if (!assistantElement) {
            throw new Error('Could not find message element');
        }
        
        if (agentEnabled) {
            if (subscriptionTier === 'free' && usage.agents >= 5) {
                alert('Agent usage limit reached. Upgrade for unlimited agent runs.');
                return;
            }
            
            const result = await agentService.executeWorkflow(
                currentWorkflow,
                text,
                (progress) => console.log(`${progress.step}: ${progress.message}`)
            );
            assistantElement.textContent = result.finalOutput;
            usage.agents++;
        } else {
            await aiService.generateResponse(text, null, (token) => {
                assistantElement.textContent += token;
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            });
            usage[model]++;
        }
        
        updateUsageDisplay();
        
    } catch (error) {
        console.error('AI Error:', error);
        addMessage('assistant', `Sorry, an error occurred: ${error.message}`);
    }
}

// ============================================
// FILE UPLOAD
// ============================================
fileUploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);

async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (subscriptionTier === 'free' && usage.uploads >= 10) {
        alert('File upload limit reached. Upgrade for more.');
        fileInput.value = '';
        return;
    }
    
    for (const file of files) {
        try {
            addMessage('assistant', `Processing ${file.name}...`);
            const extractedText = await fileService.extractTextFromFile(file);
            if (extractedText) {
                addMessage('user', `[File: ${file.name}]\n${extractedText.substring(0, 500)}${extractedText.length > 500 ? '...' : ''}`);
            }
            usage.uploads++;
            updateUsageDisplay();
        } catch (error) {
            addMessage('assistant', `Couldn't process ${file.name}: ${error.message}`);
        }
    }
    fileInput.value = '';
}

// ============================================
// AGENT INITIALIZATION
// ============================================
function initializeAgents() {
    agentService.registerAgent(
        'researcher',
        'Research Specialist',
        'fleet',
        'You are a research agent. Gather and summarize factual information concisely.'
    );
    agentService.registerAgent(
        'writer',
        'Creative Writer',
        'spark',
        'You are a writer. Turn research notes into engaging content.'
    );
    agentService.registerAgent(
        'editor',
        'Editor',
        'swift',
        'You are an editor. Polish text for grammar and clarity.'
    );
    
    agentService.defineWorkflow('research-writer', [
        {
            name: 'research',
            agent: 'researcher',
            preparePrompt: (query) => `Research: ${query}\nProvide key facts.`
        },
        {
            name: 'draft',
            agent: 'writer',
            preparePrompt: (_, results) => {
                const research = results.find(r => r.agent === 'researcher').output;
                return `Using these notes, write a short blog post:\n\n${research}`;
            }
        },
        {
            name: 'edit',
            agent: 'editor',
            preparePrompt: (_, results) => {
                const draft = results.find(r => r.agent === 'writer').output;
                return `Edit for grammar and clarity:\n\n${draft}`;
            }
        }
    ]);
}

// Check initial auth
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        currentUser = session.user;
        showApp();
        loadUserProfile();
        loadUsageData();
        initializeAgents();
    } else {
        showAuth();
    }
});
