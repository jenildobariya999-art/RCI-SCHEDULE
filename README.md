# 📚 CA Study Board — v6 (Firebase Edition)

This version fixes the **biggest problem**: data now syncs across **everyone's phones** in real-time using a free Firebase database.

---

## ⚠️ IMPORTANT — One-time setup (3 minutes)

Before uploading to GitHub, you MUST set up a free Firebase project:

### Step 1 — Create Firebase project
1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Give it any name (e.g. `ca-board`) → Continue → Continue → **Create project**

### Step 2 — Add a Web App
1. On the project home page, click the **`</>`** (web) icon
2. Nickname it anything (e.g. `ca-board-web`) → **Register app**
3. You'll see a code block like this:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ca-board-xxxx.firebaseapp.com",
  databaseURL: "https://ca-board-xxxx-default-rtdb.firebaseio.com",
  projectId: "ca-board-xxxx",
  storageBucket: "ca-board-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```
4. **Copy these values**

### Step 3 — Enable Realtime Database
1. In the left sidebar, click **Build → Realtime Database**
2. Click **Create Database**
3. Choose any location → click **Next**
4. Select **"Start in test mode"** → **Enable**

### Step 4 — Set permanent rules (important!)
Test mode rules expire after 30 days. To keep it working forever:
1. In Realtime Database, click the **Rules** tab
2. Replace with:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
3. Click **Publish**

> ⚠️ This makes your database publicly readable/writable. That's fine for a small private study group, but **don't store sensitive personal data** beyond names/phone numbers.

### Step 5 — Paste your config
1. Open **`firebase-config.js`** in this folder
2. Replace the placeholder values with YOUR config from Step 2
3. Save

---

## 📁 Files to upload to GitHub

```
register.html
index.html
chat.html
admin.html
firebase-config.js   ← MUST edit this with your keys first!
```

---

## 🔐 Admin Login
- Go to `yoursite.com/admin.html`
- Default password: **`admin123`**
- Change it in **Admin → Settings → Change Password**

---

## ✅ What's Fixed in v6

1. **OTP** — Uses Fast2SMS with `no-cors` mode (SMS fires silently) + always shows OTP on screen as backup, so registration never gets stuck
2. **Post format** — WhatsApp-style: 📢 *MEET UP* / 📅 Date / 🕐 Time / 📍 Place / — Name
3. **Persistent login** — Uses `localStorage` (not session storage), so you stay logged in even after closing the browser/tab. Logout button still works when you want to switch accounts
4. **Real-time sync** — Registrations, approvals, posts, and chat now sync **instantly across all devices** via Firebase
5. **Live notifications** — When admin posts, all members with notifications enabled get a push notification immediately
6. **Auto-redirect on approval** — The "pending" screen automatically detects when admin approves and lets the member in — no need to refresh

---

## 👥 Member Flow
1. Friend opens `register.html` → enters name + phone
2. Gets OTP (SMS + shown on screen) → verifies
3. Sees "Waiting for approval" screen (auto-updates)
4. **You** open `admin.html` → Members tab → tap **Approve**
5. Friend's screen automatically redirects to the board ✅

---

## 🆓 Firebase Free Tier
The free "Spark" plan includes:
- 1 GB stored data
- 10 GB/month data transfer
- Unlimited Realtime Database connections (within usage limits)

This is more than enough for a small study group (dozens of users, hundreds of posts/messages).
