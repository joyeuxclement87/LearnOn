const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Initialize Express and Socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data stores
const UserStore = {
    users: new Map(),         // All connected users
    typing: new Map(),        // Users currently typing
    status: new Map(),        // User online status
    sessions: new Map(),      // Active learning sessions
    unread: new Map(),        // Unread message counts
};

const MessageStore = {
    history: new Map(),       // Chat history
    notifications: new Map(), // User notifications
};

// Socket.io Event Handlers
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User Authentication
    socket.on('auth', (userData) => {
        const user = {
            id: userData.userId,
            name: userData.username,
            avatar: userData.avatar,
            socketId: socket.id,
            lastSeen: new Date(),
            status: 'online'
        };
        
        UserStore.users.set(socket.id, user);
        UserStore.status.set(user.id, 'online');
        
        // Join user's personal room
        socket.join(`user_${user.id}`);
        
        // Broadcast user online status
        broadcastUserStatus(user.id, 'online');
        
        // Send initial data to user
        sendInitialData(socket, user.id);
    });

    // Message Handling
    socket.on('message', async (data) => {
        const sender = UserStore.users.get(socket.id);
        if (!sender) return;

        const message = {
            id: Date.now(),
            sender: sender.id,
            recipient: data.recipientId,
            content: data.content,
            timestamp: new Date(),
            type: data.type || 'text',
            status: 'sent'
        };

        // Store message
        storeMessage(message);

        // Send to recipient if online
        const recipientSocket = findUserSocket(data.recipientId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('new_message', {
                ...message,
                senderName: sender.name,
                senderAvatar: sender.avatar
            });
        } else {
            // Store notification for offline user
            storeNotification(data.recipientId, {
                type: 'message',
                from: sender.id,
                content: 'New message from ' + sender.name,
                timestamp: new Date()
            });
        }

        // Confirm delivery to sender
        socket.emit('message_sent', {
            messageId: message.id,
            timestamp: message.timestamp
        });
    });

    // Typing Indicators
    socket.on('typing_start', (recipientId) => {
        const user = UserStore.users.get(socket.id);
        if (!user) return;

        UserStore.typing.set(`${user.id}_${recipientId}`, Date.now());
        
        const recipientSocket = findUserSocket(recipientId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('user_typing', {
                userId: user.id,
                name: user.name
            });
        }
    });

    socket.on('typing_end', (recipientId) => {
        const user = UserStore.users.get(socket.id);
        if (!user) return;

        UserStore.typing.delete(`${user.id}_${recipientId}`);
        notifyTypingEnded(user.id, recipientId);
    });

    // Read Receipts
    socket.on('mark_read', ({ chatId, messageIds }) => {
        const user = UserStore.users.get(socket.id);
        if (!user) return;

        messageIds.forEach(messageId => {
            const message = findMessage(chatId, messageId);
            if (message) {
                message.status = 'read';
                message.readAt = new Date();
            }
        });

        // Notify message sender
        const otherUser = chatId.split('_').find(id => id !== user.id);
        const otherSocket = findUserSocket(otherUser);
        if (otherSocket) {
            io.to(otherSocket).emit('messages_read', {
                chatId,
                messageIds,
                readBy: user.id,
                timestamp: new Date()
            });
        }
    });

    // Session Management
    socket.on('start_session', (sessionData) => {
        const user = UserStore.users.get(socket.id);
        if (!user) return;

        const session = createSession(user.id, sessionData);
        notifySessionParticipants(session);
    });

    // Disconnect Handling
    socket.on('disconnect', () => {
        const user = UserStore.users.get(socket.id);
        if (user) {
            UserStore.users.delete(socket.id);
            UserStore.status.set(user.id, 'offline');
            broadcastUserStatus(user.id, 'offline');
        }
        console.log('Client disconnected:', socket.id);
    });
});

// Utility Functions
function findUserSocket(userId) {
    for (const [socketId, user] of UserStore.users.entries()) {
        if (user.id === userId) return socketId;
    }
    return null;
}

function storeMessage(message) {
    const chatId = getChatId(message.sender, message.recipient);
    if (!MessageStore.history.has(chatId)) {
        MessageStore.history.set(chatId, []);
    }
    MessageStore.history.get(chatId).push(message);
}

function getChatId(user1Id, user2Id) {
    return [user1Id, user2Id].sort().join('_');
}

function sendInitialData(socket, userId) {
    // Send unread messages
    const unreadMessages = getUnreadMessages(userId);
    if (unreadMessages.length > 0) {
        socket.emit('unread_messages', unreadMessages);
    }

    // Send pending notifications
    const notifications = MessageStore.notifications.get(userId) || [];
    if (notifications.length > 0) {
        socket.emit('pending_notifications', notifications);
    }

    // Send active sessions
    const activeSessions = getActiveSessions(userId);
    if (activeSessions.length > 0) {
        socket.emit('active_sessions', activeSessions);
    }
}

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Clean up typing indicators periodically
    setInterval(cleanupTypingIndicators, 5000);
});

// Periodic cleanup
function cleanupTypingIndicators() {
    const now = Date.now();
    for (const [key, timestamp] of UserStore.typing.entries()) {
        if (now - timestamp > 5000) {
            const [userId, recipientId] = key.split('_');
            UserStore.typing.delete(key);
            notifyTypingEnded(userId, recipientId);
        }
    }
}


