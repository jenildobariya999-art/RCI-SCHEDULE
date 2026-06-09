# 📚 CA Study Board

A private notice board + group chat for CA students. Admin-only posting, OTP-verified registration, push notifications.

---

## 📁 File Structure

```
ca-noticeboard/
├── index.html        ← Main notice board (All, Meet Up, Urgent, Notice tabs)
├── register.html     ← Register with OTP verification
├── chat.html         ← Group chat (approved members only)
├── admin.html        ← Admin panel (post, manage members, see raise-hand)
├── pending.html      ← Shown to users waiting for approval
├── css/
│   └── style.css     ← Shared styles
└── js/
    ├── app.js        ← Shared logic (auth, storage, OTP, notifications)
    ├── board.js      ← Notice board logic
    ├── chat.js       ← Chat logic
    └── admin.js      ← Admin panel logic
```

---

## 🚀 Deploy on GitHub Pages (Free)

1. Create a new GitHub repo (e.g. `ca-board`)
2. Upload all files keeping the folder structure
3. Go to **Settings → Pages → Source → main branch → / (root)**
4. Your site will be live at: `https://yourusername.github.io/ca-board/`

---

## 🔐 Default Admin Password

```
admin123
```

> **Change it immediately** after first login via Admin Panel → Settings → Change Password

---

## 📲 Fast2SMS Setup (for real OTP)

1. Go to [fast2sms.com](https://fast2sms.com) and create a free account
2. Go to **Dashboard → Dev API** and copy your API key
3. In Admin Panel → **Settings → Fast2SMS API Key** → paste it → Save
4. Now real OTPs will be sent via SMS to Indian numbers

> Without API key, the app runs in **Demo Mode** — OTP is shown on screen (good for testing)

---

## 🔔 Push Notifications

- Friends click **"Enable Notifications"** on the board page
- Every time admin posts, they get an instant browser notification
- Works on Chrome, Edge, Firefox (not Safari on iOS)

---

## ✋ Raise Hand Feature

- Members see a ✋ button on the board
- They can send a support request with a message
- **Only admin sees it** in Admin Panel → Raise Hand section
- Admin can mark it as resolved

---

## 👥 How Member Access Works

1. Friend opens the site → **Register** with name + phone
2. OTP verification (proves real phone number)
3. Sent to **"Pending Approval"** screen
4. Admin opens **Admin Panel → Members** → clicks **Approve**
5. Friend can now access board and chat

---

## 💡 Notes

- All data stored in **localStorage** (browser storage)
- Works 100% on GitHub Pages — no server needed
- If friends use different devices, they won't see each other's data (localStorage is per-device per-browser)
- For shared real-time data across devices, you'd need Firebase (can be added later)

---

## 🛠 Quick Customization

- **Change group name**: Edit `CA <span>Board</span>` in all HTML files
- **Change default password**: In `js/app.js`, replace `DEFAULT_PW_HASH` with SHA-256 hash of your password
- **Add more tabs**: Edit the `.tabs` section in `index.html` and update `board.js`
