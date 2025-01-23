// Chat functionality
const socket = io('http://localhost:3000'); // Adjust the URL as needed

document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('input', notifyTyping);
document.getElementById('file-input').addEventListener('change', sendFile);
document.getElementById('message-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

socket.on('message', handleIncomingMessage);
socket.on('typing', showTypingIndicator);
socket.on('activeUsers', updateActiveUsers);
socket.on('notification', showNotification);

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', { user: 'You', content: message, timestamp: new Date() });
        displayMessage({ user: 'You', content: message, timestamp: new Date(), type: 'me' });
        messageInput.value = '';
    }
}

function notifyTyping() {
    socket.emit('typing');
}

function sendFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            socket.emit('file', { content: e.target.result, filename: file.name, timestamp: new Date() });
        };
        reader.readAsDataURL(file);
    }
}

function handleIncomingMessage(data) {
    displayMessage(data);
    markAsUnread(data.user);
}

function displayMessage(data) {
    const chatContainer = document.getElementById('chat-container');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${data.type}`;
    messageElement.innerHTML = `<div class="message-content"><strong>${data.user}</strong>: ${data.content} <small class="text-muted">${new Date(data.timestamp).toLocaleTimeString()}</small></div>`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.style.display = 'block';
    setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 3000);
}

function updateActiveUsers(users) {
    const activeUsersList = document.getElementById('active-users-list');
    activeUsersList.innerHTML = '';
    users.forEach(user => {
        const userElement = document.createElement('li');
        userElement.className = 'list-group-item';
        userElement.textContent = user;
        activeUsersList.appendChild(userElement);
    });
}

function showNotification(data) {
    if (document.hidden) {
        new Notification('New message', { body: `${data.user}: ${data.content}` });
    }
}

document.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        this.classList.remove('unread');
        loadChat(this.textContent);
    });
});

function loadChat(user) {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = ''; // Clear current chat
    // Load chat messages for the selected user (this is just a placeholder)
    const messageElement = document.createElement('div');
    messageElement.className = 'message received';
    messageElement.innerHTML = `<div class="message-content"><strong>${user}</strong>: This is a placeholder message. <small class="text-muted">${new Date().toLocaleTimeString()}</small></div>`;
    chatContainer.appendChild(messageElement);
}

function markAsUnread(user) {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        if (item.textContent.includes(user)) {
            item.classList.add('unread');
        }
    });
}

function sortChats() {
    const chatSidebar = document.getElementById('chat-sidebar');
    const chatItems = Array.from(chatSidebar.getElementsByClassName('chat-item'));
    chatItems.sort((a, b) => {
        const aUnread = a.classList.contains('unread');
        const bUnread = b.classList.contains('unread');
        if (aUnread && !bUnread) return -1;
        if (!aUnread && bUnread) return 1;
        return 0;
    });
    chatItems.forEach(item => chatSidebar.appendChild(item));
}

document.addEventListener('DOMContentLoaded', () => {
    sortChats();
});
