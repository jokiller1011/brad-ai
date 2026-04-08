// Supabase Configuration - REPLACE WITH YOUR OWN
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Initialize Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
let currentUser = null;
let currentTheme = 'light';
let sidebarOpen = true;
let messages = [];
let usage = {
    swift: 0,
    spark: 0,
    fleet: 0,
    agents: 0,
    video: 0,
    uploads: 0
};
let subscriptionTier = 'free'; // 'free', 'pro', 'xtreme', 'enterprise'

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authTabs = document.querySelectorAll('.auth-tab');
const googleSigninBtn = document.getElementById('google-signin');
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

// Auth Mode (signin or signup)
let authMode = 'signin';

// Initialize Lucide icons
lucide.createIcons();

// --- Authentication Logic ---
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        authMode = tab.dataset.tab;
        authSubmitBtn.textContent = authMode === 'signin' ? 'Sign In' : 'Sign Up';
    });
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    authError.textContent = '';
    
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
});

googleSigninBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    } catch (error) {
        authError.textContent = error.message;
    }
});

signoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// --- Auth State Listener ---
supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        currentUser = session.user;
        showApp();
        loadUserProfile();
        loadUsageData();
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
    lucide.createIcons();
}

function showAuth() {
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
}

async function loadUserProfile() {
    // In a real implementation, fetch profile from Supabase 'profiles' table
    // For now, set default tier
    subscriptionTier = 'free';
    updateUsageDisplay();
}

async function loadUsageData() {
    // Fetch usage counts from Supabase 'usage' table
    // For demo, we'll use local state initialized to 0
    updateUsageDisplay();
}

function updateUsageDisplay() {
    const limits = {
        free: { swift: 15, spark: 20, fleet: 4 },
        pro: { swift: Infinity, spark: Infinity, fleet: Infinity },
        xtreme: { swift: Infinity, spark: Infinity, fleet: Infinity },
        enterprise: { swift: Infinity, spark: Infinity, fleet: Infinity }
    };
    const limit = limits[subscriptionTier]?.swift || 15;
    usageBadge.innerHTML = `<span>${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} · Swift ${usage.swift}/${limit === Infinity ? '∞' : limit}</span>`;
}

// --- Theme Toggle ---
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

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

// --- Sidebar Toggle ---
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    sidebarOpen = !sidebarOpen;
    const icon = sidebarOpen ? 'panel-left-open' : 'panel-left-close';
    sidebarToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
    lucide.createIcons();
});

// --- New Chat ---
newChatBtn.addEventListener('click', () => {
    messages = [];
    renderMessages();
    welcomeScreen.style.display = 'flex';
});

// --- Send Message (Placeholder for AI Integration) ---
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    
    // Check usage limits (simplified)
    const model = modelSelect.value;
    if (subscriptionTier === 'free') {
        const limits = { swift: 15, spark: 20, fleet: 4 };
        if (usage[model] >= limits[model]) {
            alert(`You've reached your ${model} limit. Upgrade to continue.`);
            return;
        }
    }
    
    // Add user message
    addMessage('user', text);
    userInput.value = '';
    welcomeScreen.style.display = 'none';
    
    // Increment usage
    usage[model]++;
    updateUsageDisplay();
    
    // Simulate AI response (replace with actual model inference)
    setTimeout(() => {
        addMessage('assistant', `This is a simulated response from the ${model} model. In the next phase, we'll integrate Transformers.js to run real AI models locally in your browser.`);
    }, 1000);
}

function addMessage(role, content) {
    messages.push({ role, content });
    renderMessages();
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
            <div class="message ${msg.role}">
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

// --- File Upload ---
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
    
    // In production, process files here (extract text, create embeddings, etc.)
    console.log('Files selected:', files.map(f => f.name));
    usage.uploads++;
    updateUsageDisplay();
    fileInput.value = '';
}

// --- Agent Toggle ---
agentToggle.addEventListener('click', () => {
    alert('Agent collaboration will be available in the next update.');
});

// --- Auto-resize textarea ---
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

// Check initial auth state
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        currentUser = session.user;
        showApp();
        loadUserProfile();
        loadUsageData();
    } else {
        showAuth();
    }
});
