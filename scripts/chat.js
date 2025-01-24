const socket = io('http://localhost:3000');

// Chat State Management
const chatState = {
    contacts: [
        {
            id: 1,
            name: 'Jane Smith',
            avatar: 'img/42907.jpg',
            status: 'online',
            lastMessage: 'Thanks for the Python session!',
            timestamp: new Date(),
            unread: 2,
            isTyping: false
        },
        {
            id: 2,
            name: 'Mike Johnson',
            avatar: 'img/2151100279.jpg',
            status: 'offline',
            lastMessage: 'See you tomorrow at the session',
            timestamp: new Date(Date.now() - 3600000),
            unread: 0,
            isTyping: false
        },
        {
            id: 3,
            name: 'Sarah Lee',
            avatar: 'img/42907.jpg',
            status: 'online',
            lastMessage: 'Can we schedule another session?',
            timestamp: new Date(Date.now() - 7200000),
            unread: 3,
            isTyping: false
        }
    ],
    activeChat: null,
    sortBy: 'recent', // 'recent' | 'unread' | 'name'
    filterBy: 'all' // 'all' | 'unread' | 'online'
};

// Initialize Chat
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    setupEventListeners();
    renderContacts();
});

function initializeChat() {
    chatState.activeChat = chatState.contacts[0];
    setupSocketListeners();
}

function setupEventListeners() {
    // Chat tabs
    document.querySelectorAll('.chat-tab').forEach(tab => {
        tab.addEventListener('click', () => handleTabClick(tab));
    });

    // Message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        messageInput.addEventListener('input', handleTyping);
    }

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterContacts(e.target.value));
    }
}

function setupSocketListeners() {
    socket.on('message_received', handleIncomingMessage);
    socket.on('typing_indicator', handleTypingIndicator);
    socket.on('user_status', updateUserStatus);
}

// UI Rendering Functions
function renderContacts() {
    const contactsList = document.querySelector('.chat-list');
    if (!contactsList) return;

    // Sort contacts based on current sort method
    const sortedContacts = sortContacts(chatState.contacts);
    
    contactsList.innerHTML = sortedContacts
        .filter(contact => filterContact(contact))
        .map(contact => `
            <div class="chat-item ${contact.unread ? 'unread' : ''} ${contact.id === chatState.activeChat?.id ? 'active' : ''}" 
                 onclick="selectChat(${contact.id})">
                <div class="d-flex align-items-center">
                    <div class="chat-avatar position-relative">
                        <img src="${contact.avatar}" alt="${contact.name}" class="rounded-circle" width="50" height="50">
                        <span class="position-absolute bottom-0 end-0 bg-${contact.status === 'online' ? 'success' : 'secondary'} rounded-circle p-1"
                              style="width: 12px; height: 12px;"></span>
                    </div>
                    <div class="ms-3 flex-grow-1">
                        <h6 class="mb-1">${contact.name}</h6>
                        <p class="mb-0 text-muted small ${contact.isTyping ? 'text-primary' : ''}">
                            ${contact.isTyping ? 'Typing...' : contact.lastMessage}
                        </p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${formatTimestamp(contact.timestamp)}</small>
                            ${contact.unread ? `<span class="badge bg-primary rounded-pill">${contact.unread}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
}

function selectChat(contactId) {
    const contact = chatState.contacts.find(c => c.id === contactId);
    if (contact) {
        chatState.activeChat = contact;
        contact.unread = 0; // Mark messages as read
        renderContacts();
        loadChatHistory(contact);
        updateChatHeader(contact);
    }
}

// Message Handling
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message && chatState.activeChat) {
        const messageData = {
            id: Date.now(),
            content: message,
            sender: 'me',
            timestamp: new Date(),
            status: 'sent'
        };

        addMessageToChat(messageData);
        socket.emit('message', {
            recipientId: chatState.activeChat.id,
            ...messageData
        });

        input.value = '';
        updateLastMessage(chatState.activeChat.id, message);
    }
}

function handleIncomingMessage(data) {
    const contact = chatState.contacts.find(c => c.id === data.senderId);
    if (contact) {
        if (contact.id !== chatState.activeChat?.id) {
            contact.unread++;
        }
        updateLastMessage(contact.id, data.content);
        if (contact.id === chatState.activeChat?.id) {
            addMessageToChat({
                ...data,
                sender: 'them'
            });
        }
        renderContacts();
    }
}

// Utility Functions
function sortContacts(contacts) {
    switch(chatState.sortBy) {
        case 'unread':
            return [...contacts].sort((a, b) => b.unread - a.unread);
        case 'name':
            return [...contacts].sort((a, b) => a.name.localeCompare(b.name));
        case 'recent':
        default:
            return [...contacts].sort((a, b) => b.timestamp - a.timestamp);
    }
}

function filterContact(contact) {
    switch(chatState.filterBy) {
        case 'unread':
            return contact.unread > 0;
        case 'online':
            return contact.status === 'online';
        case 'all':
        default:
            return true;
    }
}

function formatTimestamp(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
}

function handleTyping() {
    if (chatState.activeChat) {
        socket.emit('typing_start', chatState.activeChat.id);
    }
}

function updateLastMessage(contactId, message) {
    const contact = chatState.contacts.find(c => c.id === contactId);
    if (contact) {
        contact.lastMessage = message;
        contact.timestamp = new Date();
        renderContacts();
    }
}

// Export functions for use in HTML
window.selectChat = selectChat;
window.sendMessage = sendMessage;
