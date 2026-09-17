/**
 * Nexus AI Brain Concierge Widget for Nilanjan Guest House (Yogabrata.com)
 */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    createNexusWidget();
  });

  function createNexusWidget() {
    const container = document.createElement('div');
    container.id = 'nexus-chat-widget';

    container.innerHTML = `
      <div class="nexus-trigger-btn" id="nexus-toggle-btn">
        <span>🧠 NEXUS AI Concierge</span>
      </div>
      <div class="nexus-chat-window" id="nexus-window">
        <div class="nexus-chat-header">
          <h4>🧠 Nexus AI Concierge</h4>
          <span class="close-btn" id="nexus-close-btn">&times;</span>
        </div>
        <div class="nexus-chat-messages" id="nexus-messages">
          <div class="nexus-msg bot">
            Namaste! Welcome to Nilanjan Guest House (Yogabrata.com). I am Nexus, your AI Concierge. How can I help with your stay or room booking today?
          </div>
        </div>
        <div class="nexus-chat-input-area">
          <input type="text" id="nexus-input" placeholder="Ask about room rates, location, amenities..." />
          <button id="nexus-send-btn">Send</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const toggleBtn = document.getElementById('nexus-toggle-btn');
    const closeBtn = document.getElementById('nexus-close-btn');
    const chatWindow = document.getElementById('nexus-window');
    const sendBtn = document.getElementById('nexus-send-btn');
    const input = document.getElementById('nexus-input');
    const messages = document.getElementById('nexus-messages');

    toggleBtn.addEventListener('click', function() {
      if (chatWindow.style.display === 'flex') {
        chatWindow.style.display = 'none';
      } else {
        chatWindow.style.display = 'flex';
        input.focus();
      }
    });

    closeBtn.addEventListener('click', function() {
      chatWindow.style.display = 'none';
    });

    function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      // Add user message
      const userDiv = document.createElement('div');
      userDiv.className = 'nexus-msg user';
      userDiv.textContent = text;
      messages.appendChild(userDiv);

      input.value = '';
      messages.scrollTop = messages.scrollHeight;

      // Call Nexus API
      fetch('/api/nexus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      .then(res => res.json())
      .then(data => {
        const botDiv = document.createElement('div');
        botDiv.className = 'nexus-msg bot';
        botDiv.textContent = data.reply || 'Thank you for reaching out to Nilanjan Guest House!';
        messages.appendChild(botDiv);
        messages.scrollTop = messages.scrollHeight;
      })
      .catch(err => {
        const botDiv = document.createElement('div');
        botDiv.className = 'nexus-msg bot';
        botDiv.textContent = 'Nexus AI is active. Please call our front desk directly at +91 9231580965 for immediate assistance.';
        messages.appendChild(botDiv);
        messages.scrollTop = messages.scrollHeight;
      });
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
  }
})();
