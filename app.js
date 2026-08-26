// Telegram Mini App Initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// App State
const state = {
    user: null,
    isAdmin: false,
    data: null,
    isLoading: false,
    timeoutId: null
};

// DOM Elements
const elements = {
    userName: document.getElementById('userName'),
    userId: document.getElementById('userId'),
    userStatus: document.getElementById('userStatus'),
    userBalance: document.getElementById('userBalance'),
    refCount: document.getElementById('refCount'),
    verifiedRef: document.getElementById('verifiedRef'),
    totalWithdraw: document.getElementById('totalWithdraw'),
    userRank: document.getElementById('userRank'),
    purchasedChannels: document.getElementById('purchasedChannels'),
    activityList: document.getElementById('activityList'),
    adminPanel: document.getElementById('adminPanel'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Initialize App
function initApp() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        state.user = user;
        elements.userName.textContent = user.first_name || 'User';
        elements.userId.textContent = `ID: ${user.id}`;
        const avatar = document.querySelector('.user-avatar');
        avatar.textContent = user.first_name?.charAt(0) || '👤';
    } else {
        elements.userName.textContent = 'Demo User';
        elements.userId.textContent = 'ID: 123456789';
    }

    // Send initial request
    requestData('init');
}

// Send Data to Bot
function sendToBot(action, data = {}) {
    const message = JSON.stringify({
        action: action,
        user_id: state.user?.id || 'demo',
        ...data,
        timestamp: Date.now()
    });
    
    try {
        tg.sendData(message);
        showLoading(true);
        // Set timeout to hide loading if no response after 10 seconds
        if (state.timeoutId) clearTimeout(state.timeoutId);
        state.timeoutId = setTimeout(() => {
            showLoading(false);
            showToast('⏳ Bot not responding. Please try again.', 'error');
        }, 10000);
    } catch (error) {
        console.error('Error sending data:', error);
        showLoading(false);
        showToast('Error sending request', 'error');
    }
}

// Request Data from Bot
function requestData(action) {
    const data = {
        action: action,
        user_id: state.user?.id || 'demo'
    };
    sendToBot(action, data);
}

// Refresh Data
function refreshData() {
    requestData('refresh');
    const btn = document.querySelector('.refresh-btn');
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        btn.style.transform = 'rotate(0deg)';
    }, 500);
}

// Update UI with Data
function updateUI(data) {
    if (!data) return;

    if (data.balance !== undefined) {
        elements.userBalance.textContent = formatCurrency(data.balance);
        animateValue(elements.userBalance);
    }
    if (data.refCount !== undefined) {
        elements.refCount.textContent = data.refCount;
    }
    if (data.verifiedRef !== undefined) {
        elements.verifiedRef.textContent = data.verifiedRef;
    }
    if (data.totalWithdraw !== undefined) {
        elements.totalWithdraw.textContent = formatCurrency(data.totalWithdraw);
    }
    if (data.rank !== undefined) {
        elements.userRank.textContent = `#${data.rank}`;
    }
    if (data.isVerified !== undefined) {
        elements.userStatus.textContent = data.isVerified ? '✅ Verified' : '⏳ Pending';
        elements.userStatus.style.color = data.isVerified ? 'var(--success)' : 'var(--warning)';
    }
    if (data.isAdmin !== undefined) {
        state.isAdmin = data.isAdmin;
        elements.adminPanel.style.display = data.isAdmin ? 'block' : 'none';
    }
    if (data.channels && data.channels.length > 0) {
        renderChannels(data.channels);
    }
    if (data.activities && data.activities.length > 0) {
        renderActivities(data.activities);
    }
    if (data.message) {
        showToast(data.message, 'success');
    }
}

// Render Purchased Channels
function renderChannels(channels) {
    const container = elements.purchasedChannels;
    container.innerHTML = '';
    channels.forEach(channel => {
        const item = document.createElement('div');
        item.className = 'purchased-channel';
        item.innerHTML = `
            <span class="channel-name">${channel.title || 'Channel'}</span>
            <span class="channel-price">₹${channel.price || 0}</span>
            <span class="channel-status">${channel.status || 'Active'}</span>
        `;
        container.appendChild(item);
    });
}

// Render Activities
function renderActivities(activities) {
    const list = elements.activityList;
    list.innerHTML = '';
    if (activities.length === 0) {
        list.innerHTML = '<div class="activity-item"><span class="activity-text">No recent activity</span></div>';
        return;
    }
    activities.slice(0, 5).forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <span class="activity-text">${activity.text || activity}</span>
            <span class="activity-time">${activity.time || 'Just now'}</span>
        `;
        list.appendChild(item);
    });
}

// Show/Hide Loading
function showLoading(show) {
    state.isLoading = show;
    elements.loadingOverlay.classList.toggle('active', show);
}

// Toast Messages
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Utility
function formatCurrency(num) {
    if (num === undefined || num === null) return '0.00';
    return Number(num).toFixed(2);
}

function animateValue(element) {
    element.style.transition = 'transform 0.2s ease';
    element.style.transform = 'scale(1.2)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

// Handle Bot Response
function handleBotResponse(response) {
    // Clear timeout since we got a response
    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
    }
    showLoading(false);
    
    try {
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        if (data.error) {
            showToast('Error: ' + data.error, 'error');
            return;
        }
        if (data.status === 'success') {
            updateUI(data);
            if (data.message) showToast(data.message, 'success');
        } else if (data.status === 'error') {
            showToast(data.message || 'An error occurred', 'error');
        } else {
            updateUI(data);
        }
    } catch (error) {
        console.error('Error handling response:', error);
        showToast('Error processing data', 'error');
    }
}

// Listen for data from Telegram
tg.onEvent('mainButtonClicked', () => {
    requestData('main');
});

// Listen for data from the bot
tg.onEvent('data', (data) => {
    handleBotResponse(data);
});

// Initialize
document.addEventListener('DOMContentLoaded', initApp);

// Export for debugging
window.requestData = requestData;
window.refreshData = refreshData;
window.handleBotResponse = handleBotResponse;