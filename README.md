# Wallet Bot Mini App Setup Guide

## Files Included
1. `index.html` - Main app interface
2. `style.css` - App styling
3. `app.js` - App logic
4. `mini_app_data.py` - TBC bot TPY command

## Setup Steps

### 1. Host the Web Files
Upload `index.html`, `style.css`, and `app.js` to any HTTPS host:
- **GitHub Pages** (Free)
- **Vercel** (Free)
- **Netlify** (Free)
- Your own server

### 2. Add Command to TBC Bot
1. Go to your TBC Dashboard2. Create a new command: `/mini_app_data`
3. Paste the TPY code from `mini_app_data.py`
4. Save the command

### 3. Configure BotFather
1. Open Telegram → @BotFather
2. Send `/setmenubutton`
3. Select your bot
4. Enter your Mini App URL (e.g., `https://your-domain.com/index.html`)

### 4. Test Your Mini App
- Open your bot on Telegram
- Click the menu button (bottom right)
- The Mini App should load

## Features

### User Features
- ✅ View balance
- ✅ View referral stats
- ✅ View purchased channels
- ✅ Recent activity log
- ✅ Deposit/Withdraw buttons
- ✅ Recharge button

### Admin Features
- 📊 Bot statistics
- 📢 Broadcast
- 📡 Channel management
- 👮 Admin management
- 🏆 Top balance leaderboard

## Customization

### Colors
Edit in `style.css`:
```css
:root {
    --bg-color: #0a0a1a;      /* Background */
    --card-bg: #141428;       /* Card background */
    --accent: #7c3aed;        /* Primary accent */
    --gradient-start: #7c3aed;
    --gradient-end: #3b82f6;
}