/* ═══════════════════════════════════════════════════════════════
   app.js  –  shared auth, storage, utilities
   ═══════════════════════════════════════════════════════════════ */

// ── KEYS ──────────────────────────────────────────────────────────────────────
const K = {
  ADMIN_PW:   'cab_admin_pw',
  ADMIN_NAME: 'cab_admin_name',
  POSTS:      'cab_posts',
  USERS:      'cab_users',       // {phone, name, approved, blocked}
  MESSAGES:   'cab_messages',
  HANDS:      'cab_hands',       // raise-hand requests
  SESSION:    'cab_session',     // sessionStorage: {role:'admin'|'member', phone}
  NOTIF_SUB:  'cab_notif',
};

// ── CRYPTO ────────────────────────────────────────────────────────────────────
async function sha256(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Default admin password hash = "admin123"
const DEFAULT_PW_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

// ── STORAGE HELPERS ───────────────────────────────────────────────────────────
function sget(key, def=[]) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; }
  catch { return def; }
}
function sset(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── SESSION ───────────────────────────────────────────────────────────────────
function getSession() {
  try { return JSON.parse(sessionStorage.getItem(K.SESSION)) || null; }
  catch { return null; }
}
function setSession(data) { sessionStorage.setItem(K.SESSION, JSON.stringify(data)); }
function clearSession() { sessionStorage.removeItem(K.SESSION); }
function isAdmin()  { const s=getSession(); return s?.role==='admin'; }
function isMember() { const s=getSession(); return s?.role==='member'; }
function isLoggedIn(){ return isAdmin() || isMember(); }
function currentPhone(){ return getSession()?.phone || null; }
function currentName(){
  if(isAdmin()) return sget(K.ADMIN_NAME,'Admin');
  const u = getUsers().find(u=>u.phone===currentPhone());
  return u?.name || 'Member';
}

// ── ADMIN AUTH ────────────────────────────────────────────────────────────────
function getAdminPwHash(){ return localStorage.getItem(K.ADMIN_PW) || DEFAULT_PW_HASH; }
async function adminLogin(pw) {
  const h = await sha256(pw);
  return h === getAdminPwHash();
}
async function setAdminPw(pw){ localStorage.setItem(K.ADMIN_PW, await sha256(pw)); }
function getAdminName(){ return sget(K.ADMIN_NAME, 'Admin'); }
function setAdminName(n){ localStorage.setItem(K.ADMIN_NAME, n); }

// ── USERS ─────────────────────────────────────────────────────────────────────
function getUsers(){ return sget(K.USERS, []); }
function saveUsers(arr){ sset(K.USERS, arr); }

function findUser(phone){ return getUsers().find(u=>u.phone===phone) || null; }

function registerUser(phone, name){
  const users = getUsers();
  if(users.find(u=>u.phone===phone)) return 'exists';
  users.push({ phone, name, approved: false, blocked: false, joinedAt: Date.now() });
  saveUsers(users);
  return 'ok';
}

function approveUser(phone){
  const users = getUsers();
  const u = users.find(u=>u.phone===phone);
  if(u){ u.approved = true; saveUsers(users); return true; }
  return false;
}

function blockUser(phone){
  const users = getUsers();
  const u = users.find(u=>u.phone===phone);
  if(u){ u.blocked = true; u.approved = false; saveUsers(users); return true; }
  return false;
}

function removeUser(phone){
  saveUsers(getUsers().filter(u=>u.phone!==phone));
}

// ── POSTS ─────────────────────────────────────────────────────────────────────
function getPosts(){ return sget(K.POSTS, []); }
function addPost(post){
  const posts = getPosts();
  post.id = Date.now();
  post.ts = Date.now();
  posts.push(post);
  sset(K.POSTS, posts);
  triggerNotification(post);
  dispatchEvent(new Event('cab:newpost'));
  return post;
}
function deletePost(id){ sset(K.POSTS, getPosts().filter(p=>p.id!==id)); }

// ── MESSAGES ──────────────────────────────────────────────────────────────────
function getMessages(){ return sget(K.MESSAGES, []); }
function addMessage(msg){
  const msgs = getMessages();
  msg.id = Date.now();
  msg.ts = Date.now();
  msgs.push(msg);
  // keep last 200 messages
  if(msgs.length > 200) msgs.splice(0, msgs.length-200);
  sset(K.MESSAGES, msgs);
  dispatchEvent(new Event('cab:newmsg'));
  return msg;
}

// ── RAISE HAND ────────────────────────────────────────────────────────────────
function getHands(){ return sget(K.HANDS, []); }
function raiseHand(phone, name, note){
  const hands = getHands();
  // prevent spam: only one active per user
  if(hands.find(h=>h.phone===phone && !h.resolved)) return 'already';
  hands.push({ id:Date.now(), phone, name, note, resolved:false, ts:Date.now() });
  sset(K.HANDS, hands);
  dispatchEvent(new Event('cab:hand'));
  return 'ok';
}
function resolveHand(id){
  const hands = getHands();
  const h = hands.find(h=>h.id===id);
  if(h){ h.resolved=true; sset(K.HANDS, hands); }
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
async function requestNotifPermission(){
  if(!('Notification' in window)) return false;
  if(Notification.permission==='granted') return true;
  const p = await Notification.requestPermission();
  return p === 'granted';
}

function triggerNotification(post){
  if(Notification.permission !== 'granted') return;
  const icons = { meet:'📍', urgent:'🚨', notice:'📋' };
  const emoji = icons[post.type] || '📢';
  new Notification(`${emoji} ${post.title}`, {
    body: post.place ? `${post.place}` : (post.body || 'New announcement'),
    icon: './favicon.ico',
    badge: './favicon.ico',
  });
}

// ── FAST2SMS OTP ──────────────────────────────────────────────────────────────
// Store OTPs locally (for demo / GitHub Pages — no server needed)
const OTP_STORE = {};

function generateOTP(){ return String(Math.floor(100000 + Math.random()*900000)); }

async function sendOTP(phone, apiKey){
  const otp = generateOTP();
  OTP_STORE[phone] = { otp, ts: Date.now(), verified: false };

  // If admin has configured Fast2SMS API key, use it
  if(apiKey && apiKey.length > 10){
    try {
      await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&variables_values=${otp}&route=otp&numbers=${phone}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
    } catch(e) {
      console.warn('Fast2SMS failed, using demo mode');
    }
  }

  // Always return otp so admin can set up properly; in demo mode shown on screen
  return otp;
}

function verifyOTP(phone, enteredOtp){
  const stored = OTP_STORE[phone];
  if(!stored) return false;
  if(Date.now() - stored.ts > 10 * 60 * 1000) return false; // 10 min expiry
  if(stored.otp !== enteredOtp.trim()) return false;
  stored.verified = true;
  return true;
}

// ── FAST2SMS CONFIG ───────────────────────────────────────────────────────────
function getF2SKey(){ return localStorage.getItem('cab_f2s') || ''; }
function setF2SKey(k){ localStorage.setItem('cab_f2s', k); }

// ── FORMAT HELPERS ────────────────────────────────────────────────────────────
function fmtDate(d){
  if(!d) return '';
  const [y,mo,day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const date = new Date(y, parseInt(mo)-1, parseInt(day));
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return `${days[date.getDay()]}, ${parseInt(day)} ${months[parseInt(mo)-1]}`;
}
function fmtTime(t){
  if(!t) return '';
  const [h,m] = t.split(':');
  const hh = parseInt(h);
  return `${hh%12||12}:${m} ${hh>=12?'PM':'AM'}`;
}
function timeAgo(ts){
  const s = Math.floor((Date.now()-ts)/1000);
  if(s<60)  return 'just now';
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── TOAST ─────────────────────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, dur=2800){
  let t = document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>t.classList.remove('show'), dur);
}

// ── GUARD: require login ──────────────────────────────────────────────────────
function requireLogin(redirectTo='register.html'){
  if(!isLoggedIn()){ window.location.href = redirectTo; }
}
function requireAdmin(redirectTo='index.html'){
  if(!isAdmin()){ window.location.href = redirectTo; }
}
function requireMember(){
  if(!isLoggedIn()){ window.location.href='register.html'; return false; }
  const u = findUser(currentPhone());
  if(u && u.blocked){ clearSession(); window.location.href='register.html'; return false; }
  if(u && !u.approved){ window.location.href='pending.html'; return false; }
  if(!isAdmin() && !u?.approved){ window.location.href='pending.html'; return false; }
  return true;
}
