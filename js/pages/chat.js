/*
 * AlumniX AI Career Mentor Chat Controller
 * Handles chat message rendering, auto-scrolling, history loading, and backend API integration.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const user = window.authService?.requireAuth();
  if (!user) return;

  const contextBadge = document.getElementById("chat-context-badge");
  if (contextBadge) {
    contextBadge.textContent = `${user.department || 'KIT'} • ${user.full_name}`;
  }

  const messagesList = document.getElementById("chat-messages-list");
  const chatForm = document.getElementById("chat-form");
  const inputText = document.getElementById("chat-input-text");
  const sendBtn = document.getElementById("chat-send-btn");
  const typingIndicator = document.getElementById("chat-typing-indicator");

  // Load chat history from backend
  try {
    const res = await window.apiClient.get(`/api/chat-history?user_id=${user.id}`);
    const history = res.messages || [];
    if (history.length > 0) {
      // Clear default initial message if past history exists
      messagesList.innerHTML = "";
      history.forEach(msg => {
        appendBubble(msg.role, msg.content);
      });
      scrollToBottom();
    }
  } catch (err) {
    console.warn("[Chat] Could not fetch chat history:", err);
  }

  // Handle message submission
  chatForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = inputText.value.trim();
    if (!text) return;

    // Append User bubble immediately
    appendBubble("user", text);
    inputText.value = "";
    scrollToBottom();

    // Show typing indicator
    if (typingIndicator) typingIndicator.style.display = "block";
    sendBtn.disabled = true;

    try {
      const response = await window.apiClient.post("/api/chat-message", {
        user_id: user.id,
        message: text,
        department: user.department || "Computer Science & Engineering",
        target_role: "Software Engineer",
        roadmap_percent: 40
      });

      if (typingIndicator) typingIndicator.style.display = "none";
      sendBtn.disabled = false;

      const aiReply = response.reply || "I am here to help you connect with KIT alumni and guide your technical roadmap. How else can I assist?";
      appendBubble("ai", aiReply);
      scrollToBottom();

    } catch (err) {
      console.error("[Chat] Error sending message:", err);
      if (typingIndicator) typingIndicator.style.display = "none";
      sendBtn.disabled = false;
      appendBubble("ai", "I experienced a temporary connection hiccup. Please try asking your question again.");
      scrollToBottom();
    }
  });

  function appendBubble(role, text) {
    const isUser = role === "user";
    const div = document.createElement("div");
    div.className = `chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`;

    if (!isUser) {
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.8rem; margin-bottom: 4px; color: var(--primary-green);">
          <span>🤖 AI Career Mentor</span>
        </div>
        <div>${escapeHtml(text)}</div>
      `;
    } else {
      div.textContent = text;
    }

    messagesList.appendChild(div);
  }

  function scrollToBottom() {
    if (messagesList) {
      messagesList.scrollTop = messagesList.scrollHeight;
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  }
});
