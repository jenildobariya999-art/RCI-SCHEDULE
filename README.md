# 📚 CA Study Board v2

**Each file is 100% self-contained — no external CSS/JS files needed.**
Works perfectly on GitHub Pages, Vercel, Netlify, or any static host.

---

## 📁 Files (just 4 HTML files!)

| File | Page |
|------|------|
| `index.html` | 📋 Notice Board — All / Meet Up / Urgent / Notice |
| `register.html` | 📲 Register + OTP Verification |
| `chat.html` | 💬 Group Chat |
| `admin.html` | 🔐 Admin Panel |

---

## 🚀 Deploy on GitHub Pages

1. Create a new GitHub repo (e.g. `ca-board`)
2. Upload these **4 HTML files** directly (no folders needed)
3. Go to **Settings → Pages → Source → Branch: main → Save**
4. Live at: `https://yourusername.github.io/ca-board/`

> Share `register.html` link with friends to join

---

## 🔐 Admin Login

- Go to `yoursite.com/admin.html`
- Default password: **`admin123`**
- Change it in **Admin → Settings → Change Password**

---

## 📲 OTP — Two Modes

### Demo Mode (default, no setup needed)
- OTP is shown on screen when registering
- Good for testing or small trusted groups

### Real SMS via Fast2SMS (recommended)
1. Go to [fast2sms.com](https://fast2sms.com) → Sign up free
2. Dashboard → Dev API → Copy your API key
3. Admin Panel → Settings → Fast2SMS API Key → Paste → Save
4. Now friends get real OTP via SMS ✅

---

## 🔔 Push Notifications
- Friends click **"Enable"** on the board page
- Every time you post, they get a browser notification instantly
- Works on Chrome + Android (not Safari iOS)

---

## ✋ Raise Hand
- Members tap ✋ button → send message to admin
- **Only admin sees it** in Admin → Hands section
- Admin marks it resolved when done

---

## 👥 Member Flow
1. Friend opens `register.html`
2. Enters name + phone → gets OTP
3. Verifies → goes to "Pending" screen
4. You open Admin → Members → **Approve** their number
5. They tap "Check Approval" → get access to board + chat ✅
