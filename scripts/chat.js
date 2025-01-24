// Initialize WebSocket connection
const socket = io('http://localhost:3000'); // Ensure this matches your server URL

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeChatListeners();
});

// Chat Functionality
function initializeChatListeners() {
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('input', notifyTyping);
        messageInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') sendMessage();
        });
    }

    socket.on('message', handleIncomingMessage);
    socket.on('typing', showTypingIndicator);
}

// Send Message
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('message', { user: 'You', content: message, timestamp: new Date() });
            displayMessage({ user: 'You', content: message, timestamp: new Date(), type: 'me' });
            messageInput.value = ''; // Clear input after sending
        }
    }
}

// Show Typing Indicator
function notifyTyping() {
    socket.emit('typing');
}

// Handle Incoming Messages
function handleIncomingMessage(data) {
    displayMessage(data);
}

// Display Message
function displayMessage(data) {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${data.type}`;
        messageElement.innerHTML = `<div class="message-content"><strong>${data.user}</strong>: ${data.content} <small class="text-muted">${new Date(data.timestamp).toLocaleTimeString()}</small></div>`;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom
    }
}

// Show Typing Indicator
function showTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'block';
        setTimeout(() => {
            typingIndicator.style.display = 'none';
        }, 3000);
    }
}
