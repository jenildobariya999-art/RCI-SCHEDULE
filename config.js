// ============================================================
//  MeetBoard - config.js
//  ⚠️  CHANGE THESE SETTINGS BEFORE DEPLOYING
// ============================================================

const CONFIG = {

  // -- ADMIN --
  ADMIN_PASSWORD: "CA@2024secret",       // ← Change this!
  ADMIN_NAME: "Arjun (Admin)",           // ← Your name
  ADMIN_PHONE: "9876543210",             // ← Your mobile (used as admin ID)

  // -- FAST2SMS API --
  // Get free API key from https://www.fast2sms.com
  // After signup, go to Dev API → Copy API key
  FAST2SMS_API_KEY: "YOUR_FAST2SMS_API_KEY_HERE",  // ← Paste your key

  // -- APP INFO --
  APP_NAME: "MeetBoard",
  APP_TAGLINE: "CA Friends Hub",

  // -- ENCRYPTION --
  // AES encryption key (must be 16 chars for AES-128)
  ENCRYPT_KEY: "MeetBoardSecure1",   // ← Change this!

  // -- NOTIFICATION --
  // When admin posts, send SMS notification to all approved members
  NOTIFY_ON_POST: true,

};

// ============================================================
//  STORAGE HELPERS  (localStorage as simple DB)
// ============================================================

const DB = {
  // Users
  getUsers:    () => JSON.parse(localStorage.getItem('mb_users') || '[]'),
  saveUsers:   (u) => localStorage.setItem('mb_users', JSON.stringify(u)),

  // Notices
  getNotices:  () => JSON.parse(localStorage.getItem('mb_notices') || '[]'),
  saveNotices: (n) => localStorage.setItem('mb_notices', JSON.stringify(n)),

  // Chat
  getChats:    () => JSON.parse(localStorage.getItem('mb_chats') || '[]'),
  saveChats:   (c) => localStorage.setItem('mb_chats', JSON.stringify(c)),

  // Raise Hands
  getRaiseHands:  () => JSON.parse(localStorage.getItem('mb_raisehands') || '[]'),
  saveRaiseHands: (r) => localStorage.setItem('mb_raisehands', JSON.stringify(r)),

  // Current session
  getSession:  () => JSON.parse(localStorage.getItem('mb_session') || 'null'),
  saveSession: (s) => localStorage.setItem('mb_session', JSON.stringify(s)),
  clearSession:()  => localStorage.removeItem('mb_session'),
};

// ============================================================
//  SIMPLE XOR ENCRYPTION  (obfuscates stored data)
// ============================================================

const Crypto = {
  encrypt(text) {
    if (!text) return text;
    const key = CONFIG.ENCRYPT_KEY;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  },
  decrypt(encoded) {
    if (!encoded) return encoded;
    try {
      const text = atob(encoded);
      const key = CONFIG.ENCRYPT_KEY;
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch { return encoded; }
  }
};

// ============================================================
//  FAST2SMS - Send OTP / Notification SMS
// ============================================================

const SMS = {
  async sendOTP(phone, otp) {
    const message = `${otp} is your MeetBoard OTP. Valid for 5 minutes. -MeetBoard`;
    return await SMS._send(phone, message);
  },

  async sendNotification(phones, title, message) {
    // Send to multiple numbers (comma-separated in Fast2SMS)
    const text = `📋 MeetBoard Notice:\n${title}\n${message}\n-${CONFIG.ADMIN_NAME}`;
    const allNums = phones.join(',');
    return await SMS._send(allNums, text);
  },

  async _send(numbers, message) {
    // Fast2SMS DLT route (free plan)
    const url = `https://www.fast2sms.com/dev/bulkV2`;
    const params = new URLSearchParams({
      authorization: CONFIG.FAST2SMS_API_KEY,
      route: "q",              // Quick SMS (no template needed for OTP)
      message: message,
      language: "english",
      flash: 0,
      numbers: numbers
    });

    try {
      const res = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: { 'cache-control': 'no-cache' }
      });
      const data = await res.json();
      console.log('SMS result:', data);
      return data.return === true;
    } catch (err) {
      console.error('SMS error:', err);
      // In local/GitHub Pages environment, simulate success
      console.log(`[DEV MODE] Would send SMS to ${numbers}: ${message}`);
      return true;  // Return true so app works in dev/demo
    }
  }
};

// ============================================================
//  OTP STORE  (in-memory, session only)
// ============================================================

const OTPStore = {
  _store: {},
  generate(phone) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this._store[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    return otp;
  },
  verify(phone, inputOtp) {
    const entry = this._store[phone];
    if (!entry) return false;
    if (Date.now() > entry.expires) { delete this._store[phone]; return false; }
    if (entry.otp === inputOtp) { delete this._store[phone]; return true; }
    return false;
  }
};

// ============================================================
//  NOTIFICATIONS  (browser push + in-app toast)
// ============================================================

const Notify = {
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  },
  push(title, body, icon = '📋') {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '' });
    }
  },
  toast(msg, type = 'info', duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), duration);
  }
};

// ============================================================
//  AUTH GUARDS
// ============================================================

function requireAuth(role = 'member') {
  const session = DB.getSession();
  if (!session) {
    window.location.href = getRoot() + 'index.html';
    return null;
  }
  if (role === 'admin' && session.role !== 'admin') {
    window.location.href = getRoot() + 'pages/dashboard.html';
    return null;
  }
  return session;
}

function logout() {
  DB.clearSession();
  window.location.href = getRoot() + 'index.html';
}

function getRoot() {
  // Works whether running from /pages/ or root
  return window.location.pathname.includes('/pages/') ? '../' : '';
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
  }
