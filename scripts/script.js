// Initialize WebSocket connection
const socket = io('http://localhost:3000'); // Ensure this matches your server URL

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeChatListeners();
    initializeBrowseListeners();
    initializeDashboardListeners();
    sortChats();
    changePage(1);
});

// Notifications functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeNotifications();
});

function initializeNotifications() {
    const filterButtons = document.querySelectorAll('.notification-filters .list-group-item');
    const dismissButtons = document.querySelectorAll('.dismiss-btn');
    const markAllReadBtn = document.getElementById('markAllRead');

    // Filter notifications
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterType = button.getAttribute('data-filter');
            filterNotifications(filterType);
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Dismiss individual notifications
    dismissButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.notification-card');
            dismissNotification(card);
        });
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }

    // Initialize real-time updates
    initializeRealTimeUpdates();
}

function filterNotifications(type) {
    const notifications = document.querySelectorAll('.notification-card');
    notifications.forEach(notification => {
        if (type === 'all' || notification.getAttribute('data-type') === type) {
            notification.style.display = 'flex';
        } else {
            notification.style.display = 'none';
        }
    });
}

function dismissNotification(card) {
    card.style.opacity = '0';
    setTimeout(() => {
        card.remove();
        updateNotificationCounts();
    }, 300);
}

function markAllNotificationsAsRead() {
    const unreadNotifications = document.querySelectorAll('.notification-card.unread');
    unreadNotifications.forEach(notification => {
        notification.classList.remove('unread');
    });
    updateNotificationCounts();
}

function updateNotificationCounts() {
    const types = ['all', 'messages', 'skills', 'sessions', 'feedback'];
    types.forEach(type => {
        const count = document.querySelectorAll(
            type === 'all' 
                ? '.notification-card' 
                : `.notification-card[data-type="${type}"]`
        ).length;
        const badge = document.querySelector(`[data-filter="${type}"] .badge`);
        if (badge) {
            badge.textContent = count;
        }
    });
}

function initializeRealTimeUpdates() {
    // Simulating real-time updates (replace with actual WebSocket implementation)
    setInterval(() => {
        // Check for new notifications
        checkNewNotifications();
    }, 30000); // Check every 30 seconds
}

function checkNewNotifications() {
    // This would be replaced with actual API calls in production
    console.log('Checking for new notifications...');
}

// Chat Functionality
function initializeChatListeners() {
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const fileInput = document.getElementById('file-input');

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('input', notifyTyping);
        messageInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') sendMessage();
        });
    }
    if (fileInput) fileInput.addEventListener('change', sendFile);

    socket.on('message', handleIncomingMessage);
    socket.on('typing', showTypingIndicator);
    socket.on('activeUsers', updateActiveUsers);
    socket.on('notification', showNotification);

    socket.on('connect_error', (err) => {
        console.error('WebSocket connection failed:', err);
        alert('Unable to connect to the server. Please try again later.');
    });

    socket.on('disconnect', () => {
        alert('Disconnected from server. Please check your connection.');
    });
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('message', { user: 'You', content: message, timestamp: new Date() });
            displayMessage({ user: 'You', content: message, timestamp: new Date(), type: 'me' });
            messageInput.value = '';
        }
    }
}

function notifyTyping() {
    socket.emit('typing');
}

function sendFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
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
    if (chatContainer) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${data.type}`;
        messageElement.innerHTML = `<div class="message-content"><strong>${data.user}</strong>: ${data.content} <small class="text-muted">${new Date(data.timestamp).toLocaleTimeString()}</small></div>`;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function showTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'block';
        setTimeout(() => {
            typingIndicator.style.display = 'none';
        }, 3000);
    }
}

function updateActiveUsers(users) {
    const activeUsersList = document.getElementById('active-users-list');
    if (activeUsersList) {
        activeUsersList.innerHTML = '';
        users.forEach(user => {
            const userElement = document.createElement('li');
            userElement.className = 'list-group-item';
            userElement.textContent = user;
            activeUsersList.appendChild(userElement);
        });
    }
}

function showNotification(data) {
    if (document.hidden) {
        new Notification('New message', { body: `${data.user}: ${data.content}` });
    }
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
    if (chatSidebar) {
        const chatItems = Array.from(chatSidebar.getElementsByClassName('chat-item'));
        chatItems.sort((a, b) => {
            const aUnread = a.classList.contains('unread');
            const bUnread = b.classList.contains('unread');
            return aUnread === bUnread ? 0 : aUnread ? -1 : 1;
        });
        chatItems.forEach(item => chatSidebar.appendChild(item));
    }
}

// Browse Functionality
function initializeBrowseListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const levelFilter = document.getElementById('levelFilter');
    const availabilityFilter = document.getElementById('availabilityFilter');

    if (searchInput) searchInput.addEventListener('input', searchSkills);
    if (categoryFilter || levelFilter || availabilityFilter) {
        [categoryFilter, levelFilter, availabilityFilter].forEach(filter => {
            if (filter) filter.addEventListener('change', filterSkills);
        });
    }
}

function searchSkills() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach(card => {
        const skillTitle = card.querySelector('.card-title').textContent.toLowerCase();
        const skillDescription = card.querySelector('.card-text').textContent.toLowerCase();
        const userName = card.querySelector('span').textContent.toLowerCase();
        card.style.display = (skillTitle.includes(searchInput) || skillDescription.includes(searchInput) || userName.includes(searchInput)) ? 'block' : 'none';
    });
}

function filterSkills() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const levelFilter = document.getElementById('levelFilter').value;
    const availabilityFilter = document.getElementById('availabilityFilter').value;
    const skillCards = document.querySelectorAll('.skill-card');

    skillCards.forEach(card => {
        const category = card.getAttribute('data-category');
        const level = card.getAttribute('data-level');
        const availability = card.getAttribute('data-availability');
        card.style.display = (categoryFilter === 'All Categories' || category === categoryFilter) &&
            (levelFilter === 'All Levels' || level === levelFilter) &&
            (availabilityFilter === 'All Times' || availability === availabilityFilter) ? 'block' : 'none';
    });
}

function changePage(page) {
    const skillCards = document.querySelectorAll('.skill-card');
    const totalPages = Math.ceil(skillCards.length / skillsPerPage);

    if (page < 1 || page > totalPages) return;

    currentPage = page;

    skillCards.forEach((card, index) => {
        card.style.display = (index >= (currentPage - 1) * skillsPerPage && index < currentPage * skillsPerPage) ? 'block' : 'none';
    });

    document.getElementById('prevPage').classList.toggle('disabled', currentPage === 1);
    document.getElementById('nextPage').classList.toggle('disabled', currentPage === totalPages);
}

// Dashboard Functionality
function initializeDashboardListeners() {
    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.toggle('bg-blur', window.scrollY > 50);
        }
    });
}

// Landing Page Functions
function initializeLandingPage() {
    initializeSmoothScrolling();
    initializeScrollToTop();
    initializeNavbarScroll();
    initializeCounters();
    initializeImageLoading();
}

function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

function initializeScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            scrollToTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function initializeNavbarScroll() {
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.custom-navbar');
        if (navbar) {
            navbar.classList.toggle('navbar-scrolled', window.scrollY > 50);
        }
    });
}

function initializeCounters() {
    const counters = document.querySelectorAll('.stat strong');
    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-count');
            const count = +counter.innerText;
            const increment = target / 200;

            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCount, 10);
            } else {
                counter.innerText = target;
            }
        };
        updateCount();
    });
}

function initializeImageLoading() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {

        img.addEventListener('load', function() {
            const loader = this.closest('.img-loader');
            if (loader) {
                loader.classList.remove('img-loader');
            }
        });
    });
}

// Initialize landing page functions when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeLandingPage);
