/* ========================================
   CONFIGURATION
   ======================================== */

const API_BASE_URL = 'PASTE_YOUR_API_GATEWAY_INVOKE_URL_HERE';

/* ========================================
   STATE MANAGEMENT
   ======================================== */

let sessionId = sessionStorage.getItem('chatSessionId') || null;
const RECENT_KEY = 'chatRecentSessions';

/* ========================================
   DOM ELEMENTS
   ======================================== */

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const newChatBtn = document.getElementById('newChatBtn');
const mobileNewChatBtn = document.getElementById('mobileNewChatBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const recentList = document.getElementById('recentList');
const welcomeScreen = document.getElementById('welcomeScreen');
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const html = document.documentElement;

/* ========================================
   THEME MANAGEMENT
   ======================================== */

function initTheme() {
  const savedTheme = localStorage.getItem('chatTheme') || 'light';
  setTheme(savedTheme);
}

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('chatTheme', theme);
}

function toggleTheme() {
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

themeToggleBtn.addEventListener('click', toggleTheme);

/* ========================================
   SIDEBAR MANAGEMENT
   ======================================== */

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('visible');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
}

hamburgerBtn.addEventListener('click', openSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Close sidebar when clicking a recent item on mobile
recentList.addEventListener('click', (e) => {
  if (e.target.classList.contains('recent-item')) {
    closeSidebar();
  }
});

// Close sidebar on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar.classList.contains('open')) {
    closeSidebar();
  }
});

/* ========================================
   TEXTAREA AUTO-RESIZE
   ======================================== */

function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
}

messageInput.addEventListener('input', autoResizeTextarea);

/* ========================================
   MESSAGE INPUT HANDLING
   ======================================== */

function handleKeydown(e) {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // Shift+Enter: new line
      return;
    } else {
      // Enter: send message
      e.preventDefault();
      sendMessage();
    }
  }
}

messageInput.addEventListener('keydown', handleKeydown);

sendBtn.addEventListener('click', sendMessage);

/* ========================================
   RECENT CHATS MANAGEMENT
   ======================================== */

function getRecentSessions() {
  return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
}

function saveRecentSession(sid, firstMessage) {
  if (!sid || !firstMessage) return;

  let sessions = getRecentSessions().filter(s => s.sessionId !== sid);
  sessions.unshift({
    sessionId: sid,
    title: firstMessage.slice(0, 40),
    timestamp: Date.now()
  });

  sessions = sessions.slice(0, 20); // keep last 20 conversations
  localStorage.setItem(RECENT_KEY, JSON.stringify(sessions));
  renderRecentList();
}

function renderRecentList() {
  const listEl = document.getElementById('recentList');
  listEl.innerHTML = '';

  getRecentSessions().forEach(s => {
    const item = document.createElement('button');
    item.className = 'recent-item';
    if (s.sessionId === sessionId) item.classList.add('active');
    item.textContent = s.title;
    item.setAttribute('aria-label', `Open conversation: ${s.title}`);
    item.addEventListener('click', () => loadSession(s.sessionId));
    listEl.appendChild(item);
  });
}

/* ========================================
   MESSAGE RENDERING
   ======================================== */

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function addMessage(role, content, timestamp = null) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;

  const avatarEl = document.createElement('div');
  avatarEl.className = 'message-avatar';
  avatarEl.textContent = role === 'user' ? '👤' : '🤖';

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';

  const headerEl = document.createElement('div');
  headerEl.className = 'message-header';

  const authorEl = document.createElement('span');
  authorEl.className = 'message-author';
  authorEl.textContent = role === 'user' ? 'You' : 'AlumniX AI';

  headerEl.appendChild(authorEl);

  if (timestamp) {
    const timeEl = document.createElement('span');
    timeEl.className = 'message-time';
    const date = new Date(timestamp);
    timeEl.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    headerEl.appendChild(timeEl);
  }

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'message-bubble';
  bubbleEl.textContent = content;

  contentEl.appendChild(headerEl);
  contentEl.appendChild(bubbleEl);

  messageEl.appendChild(avatarEl);
  messageEl.appendChild(contentEl);

  messagesArea.appendChild(messageEl);
  scrollToBottom();
}

function showTypingIndicator() {
  const messageEl = document.createElement('div');
  messageEl.className = 'message assistant';
  messageEl.id = 'typingIndicator';

  const avatarEl = document.createElement('div');
  avatarEl.className = 'message-avatar';
  avatarEl.textContent = '🤖';

  const typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator';

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    typingEl.appendChild(dot);
  }

  messageEl.appendChild(avatarEl);
  messageEl.appendChild(typingEl);

  messagesArea.appendChild(messageEl);
  scrollToBottom();
}

function removeTypingIndicator() {
  const typingEl = document.getElementById('typingIndicator');
  if (typingEl) {
    typingEl.remove();
  }
}

function scrollToBottom() {
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

/* ========================================
   CHAT FUNCTIONALITY
   ======================================== */

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // Disable send button and clear input
  sendBtn.disabled = true;
  messageInput.value = '';
  autoResizeTextarea();

  // Show welcome screen if first message
  if (!sessionId) {
    welcomeScreen.style.display = 'none';
    messagesArea.style.display = 'block';
  }

  // Add user message to UI
  addMessage('user', message, Date.now());

  // Show typing indicator
  showTypingIndicator();

  try {
    // POST to backend
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      })
    });

    const data = await response.json();

    if (data.success) {
      // Remove typing indicator
      removeTypingIndicator();

      // Save new sessionId if this was the first message
      if (!sessionId) {
        sessionId = data.sessionId;
        sessionStorage.setItem('chatSessionId', sessionId);
        saveRecentSession(sessionId, message);
      }

      // Add assistant response
      addMessage('assistant', data.response, Date.now());
    } else {
      // Structured error
      removeTypingIndicator();
      addMessage('assistant', `Error: ${data.error || 'Unknown error occurred'}`, Date.now());
    }
  } catch (error) {
    // Network/fetch error
    removeTypingIndicator();
    console.error('Chat error:', error);
    addMessage('assistant', "Sorry, I couldn't reach the server. Please try again.", Date.now());
  } finally {
    // Re-enable send button
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

/* ========================================
   SESSION LOADING
   ======================================== */

async function loadSession(sid) {
  sessionId = sid;
  sessionStorage.setItem('chatSessionId', sid);

  try {
    const response = await fetch(`${API_BASE_URL}/history?sessionId=${encodeURIComponent(sid)}`);
    const data = await response.json();

    // Clear messages
    messagesArea.innerHTML = '';
    welcomeScreen.style.display = 'none';
    messagesArea.style.display = 'block';

    // Load history
    if (data.history && Array.isArray(data.history)) {
      data.history.forEach(turn => {
        addMessage('user', turn.userMessage, turn.timestamp);
        addMessage('assistant', turn.aiResponse, turn.timestamp);
      });
    }

    renderRecentList();
  } catch (error) {
    console.error('Failed to load session:', error);
    addMessage('assistant', 'Failed to load conversation history.', Date.now());
  }
}

/* ========================================
   NEW CHAT
   ======================================== */

function startNewChat() {
  sessionId = null;
  sessionStorage.removeItem('chatSessionId');
  messagesArea.innerHTML = '';
  messagesArea.style.display = 'none';
  welcomeScreen.style.display = 'flex';
  messageInput.value = '';
  autoResizeTextarea();
  renderRecentList();
  messageInput.focus();
}

newChatBtn.addEventListener('click', startNewChat);
mobileNewChatBtn.addEventListener('click', () => {
  startNewChat();
  closeSidebar();
});

/* ========================================
   SUGGESTION CARDS
   ======================================== */

document.querySelectorAll('.suggestion-card').forEach(card => {
  card.addEventListener('click', () => {
    const suggestion = card.getAttribute('data-suggestion');
    messageInput.value = suggestion;
    autoResizeTextarea();
    messageInput.focus();
  });
});

/* ========================================
   PAGE LOAD INITIALIZATION
   ======================================== */

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderRecentList();

  // If a sessionId exists, load its history
  if (sessionId) {
    loadSession(sessionId);
  } else {
    // Show welcome screen
    welcomeScreen.style.display = 'flex';
    messagesArea.style.display = 'none';
  }

  messageInput.focus();
});

/* ========================================
   UNLOAD: CLEANUP IF NEEDED
   ======================================== */

window.addEventListener('beforeunload', () => {
  // sessionId is persisted in sessionStorage, so it survives page refresh
  // but is cleared when the tab closes
});
