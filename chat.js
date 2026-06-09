/* chat.js */
let lastMsgCount = 0;

window.addEventListener('load', () => {
  if(!isLoggedIn()){ window.location.href='register.html'; return; }
  if(!isAdmin()){
    const u = findUser(currentPhone());
    if(!u || !u.approved){ window.location.href='register.html'; return; }
  }

  const name = currentName();
  document.getElementById('nav-avatar').textContent = name[0].toUpperCase();

  // member count
  const approved = getUsers().filter(u=>u.approved).length;
  document.getElementById('member-count').textContent = approved + ' members';

  renderMessages();
  scrollToBottom(false);
  setInterval(pollMessages, 3000);
  window.addEventListener('cab:newmsg', ()=>{ renderMessages(); scrollToBottom(true); });
});

function pollMessages(){
  const msgs = getMessages();
  if(msgs.length !== lastMsgCount){
    lastMsgCount = msgs.length;
    const atBottom = isNearBottom();
    renderMessages();
    if(atBottom) scrollToBottom(true);
  }
}

function renderMessages(){
  const msgs = getMessages();
  lastMsgCount = msgs.length;
  const me = currentPhone();
  const container = document.getElementById('messages');

  if(!msgs.length){
    container.innerHTML=`<div class="empty-chat"><div class="big">💬</div><p>No messages yet. Say hi!</p></div>`;
    return;
  }

  let html = '';
  let lastDate = '';
  msgs.forEach(m => {
    const d = new Date(m.ts);
    const dateStr = d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
    if(dateStr !== lastDate){
      html += `<div class="date-divider">${dateStr}</div>`;
      lastDate = dateStr;
    }
    const isMine = m.phone === me;
    const isAdminMsg = m.role === 'admin';
    const timeStr = d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    const initial = (m.name||'?')[0].toUpperCase();
    html += `
      <div class="msg ${isMine?'mine':'other'} ${isAdminMsg?'admin-msg':''}">
        <div class="msg-avatar">${initial}</div>
        <div class="bubble">
          ${!isMine?`<div class="bubble-name">${esc(m.name)}${isAdminMsg?' 👑':''}</div>`:''}
          <div class="bubble-text">${esc(m.text)}</div>
          <div class="bubble-time">${timeStr}</div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function sendMsg(){
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if(!text) return;

  addMessage({
    phone: currentPhone() || 'admin',
    name:  currentName(),
    role:  isAdmin() ? 'admin' : 'member',
    text,
  });

  input.value = '';
  autoResize(input);
  renderMessages();
  scrollToBottom(true);
}

function handleKey(e){
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMsg(); }
}
function autoResize(el){
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,120)+'px';
}

function isNearBottom(){
  const m = document.getElementById('messages');
  return m.scrollHeight - m.scrollTop - m.clientHeight < 80;
}
function scrollToBottom(smooth){
  const m = document.getElementById('messages');
  m.scrollTo({ top: m.scrollHeight, behavior: smooth?'smooth':'instant' });
}
function doLogout(){ clearSession(); window.location.href='register.html'; }
