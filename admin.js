/* admin.js */
let selectedType = 'meet';
let activeSectionTab = null;

window.addEventListener('load', () => {
  if(isAdmin()){
    showDashboard();
  } else {
    document.getElementById('login-view').style.display='flex';
    document.getElementById('dashboard-view').style.display='none';
    setTimeout(()=>document.getElementById('pw-input').focus(),100);
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
async function doAdminLogin(){
  const pw = document.getElementById('pw-input').value;
  const ok = await adminLogin(pw);
  if(ok){
    setSession({role:'admin', phone:'admin'});
    document.getElementById('pw-input').value='';
    showDashboard();
  } else {
    document.getElementById('pw-err').style.display='block';
    document.getElementById('pw-input').value='';
    document.getElementById('pw-input').focus();
    setTimeout(()=>document.getElementById('pw-err').style.display='none', 2000);
  }
}

function adminLogout(){
  clearSession();
  document.getElementById('dashboard-view').style.display='none';
  document.getElementById('login-view').style.display='flex';
  showToast('👋 Logged out');
}

function togglePw(){
  const i = document.getElementById('pw-input');
  i.type = i.type==='password' ? 'text' : 'password';
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function showDashboard(){
  document.getElementById('login-view').style.display='none';
  document.getElementById('dashboard-view').style.display='block';

  const name = getAdminName();
  document.getElementById('adm-name').textContent = name;
  document.getElementById('adm-avatar').textContent = name[0].toUpperCase();
  document.getElementById('s-name').value = name;
  document.getElementById('s-f2s').value = getF2SKey();

  // default date = tomorrow
  const t = new Date(); t.setDate(t.getDate()+1);
  document.getElementById('c-date').value = t.toISOString().split('T')[0];

  updateStats();
  renderRecentPosts();
  renderUsers();
  renderHands();
  setInterval(()=>{ updateStats(); renderHands(); renderUsers(); }, 5000);
}

function updateStats(){
  const posts   = getPosts();
  const users   = getUsers();
  const pending = users.filter(u=>!u.approved && !u.blocked).length;
  const hands   = getHands().filter(h=>!h.resolved).length;
  document.getElementById('s-posts').textContent   = posts.length;
  document.getElementById('s-members').textContent = users.filter(u=>u.approved).length;
  document.getElementById('s-pending').textContent = pending;
  document.getElementById('s-hands').textContent   = hands;
  // highlight pending
  document.getElementById('s-pending').style.color = pending>0 ? 'var(--accent)' : 'var(--accent)';
  document.getElementById('s-hands').style.color   = hands>0   ? 'var(--red)'    : 'var(--accent)';
}

// ── SECTIONS ──────────────────────────────────────────────────────────────────
function showSection(name, tabEl){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('sec-'+name).classList.add('active');
  if(tabEl){
    document.querySelectorAll('.section-tabs .tab').forEach(t=>t.classList.remove('active'));
    tabEl.classList.add('active');
  }
  if(name==='members') renderUsers();
  if(name==='hands')   renderHands();
}

// ── POST ──────────────────────────────────────────────────────────────────────
function selType(type, el){
  selectedType = type;
  document.querySelectorAll('.type-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('meet-fields').style.display = (type==='meet') ? 'block' : 'none';
}

function postAnnouncement(){
  const title = document.getElementById('c-title').value.trim();
  if(!title){ showToast('⚠️ Add a title'); return; }

  addPost({
    type:  selectedType,
    title,
    date:  document.getElementById('c-date').value,
    time:  document.getElementById('c-time').value,
    place: document.getElementById('c-place').value.trim(),
    body:  document.getElementById('c-body').value.trim(),
    from:  getAdminName(),
  });

  // reset
  document.getElementById('c-title').value='';
  document.getElementById('c-body').value='';
  document.getElementById('c-place').value='';

  showToast('📢 Posted!');
  updateStats();
  renderRecentPosts();
}

function renderRecentPosts(){
  const posts = getPosts().slice().reverse().slice(0,5);
  const c = document.getElementById('recent-posts');
  if(!posts.length){ c.innerHTML=`<div class="empty-state"><div class="big">📭</div>No posts yet</div>`; return; }
  const icons = {meet:'📍',urgent:'🚨',notice:'📋'};
  c.innerHTML = posts.map(p=>`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:.9rem 1rem;margin-bottom:8px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">${icons[p.type]||'📢'}</span>
      <div style="flex:1">
        <strong style="font-size:14px">${esc(p.title)}</strong>
        <p style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-top:2px">${timeAgo(p.ts)}</p>
      </div>
      <button onclick="confirmDeletePost(${p.id})" style="font-size:12px;color:var(--red);background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);padding:4px 10px;border-radius:6px;cursor:pointer;font-family:var(--font)">Delete</button>
    </div>
  `).join('');
}

function confirmDeletePost(id){
  if(confirm('Delete this post?')){ deletePost(id); renderRecentPosts(); updateStats(); showToast('🗑 Deleted'); }
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function renderUsers(){
  const users = getUsers();
  const approved = users.filter(u=>u.approved);
  const pending  = users.filter(u=>!u.approved && !u.blocked);
  const blocked  = users.filter(u=>u.blocked);
  document.getElementById('member-summary').textContent =
    `${approved.length} approved · ${pending.length} pending · ${blocked.length} blocked`;

  const c = document.getElementById('user-list');
  if(!users.length){ c.innerHTML=`<div class="empty-state"><div class="big">👥</div>No registrations yet</div>`; return; }

  // sort: pending first, then approved, then blocked
  const sorted = [...pending, ...approved, ...blocked];
  c.innerHTML = sorted.map(u=>{
    const statusBadge = u.approved
      ? `<span class="badge online" style="font-size:10px">Approved</span>`
      : u.blocked
      ? `<span class="badge urgent" style="font-size:10px">Blocked</span>`
      : `<span class="badge hand" style="font-size:10px">Pending</span>`;
    return `
      <div class="user-row">
        <div class="avatar" style="width:36px;height:36px;font-size:14px">${(u.name||'?')[0].toUpperCase()}</div>
        <div class="user-info">
          <strong>${esc(u.name)} ${statusBadge}</strong>
          <p>+91 ${esc(u.phone)}</p>
        </div>
        <div class="user-actions">
          ${!u.approved && !u.blocked ? `<button class="btn-approve" onclick="doApprove('${u.phone}')">✓ Approve</button>` : ''}
          ${u.approved ? `<button class="btn-block" onclick="doBlock('${u.phone}')">Block</button>` : ''}
          ${u.blocked  ? `<button class="btn-approve" onclick="doApprove('${u.phone}')">Unblock</button>` : ''}
          <button class="btn-remove" onclick="doRemove('${u.phone}')">✕</button>
        </div>
      </div>`;
  }).join('');
}

function doApprove(phone){
  approveUser(phone);
  renderUsers(); updateStats();
  showToast('✅ User approved!');
  // push notification to admin
  if(Notification.permission==='granted'){
    const u = findUser(phone);
    new Notification('✅ User Approved', { body: `${u?.name} (+91 ${phone}) can now access the board.` });
  }
}
function doBlock(phone){
  if(!confirm('Block this user?')) return;
  blockUser(phone); renderUsers(); updateStats(); showToast('🚫 User blocked');
}
function doRemove(phone){
  if(!confirm('Remove this user permanently?')) return;
  removeUser(phone); renderUsers(); updateStats(); showToast('🗑 User removed');
}

// ── RAISE HAND ────────────────────────────────────────────────────────────────
function renderHands(){
  const hands = getHands().filter(h=>!h.resolved).slice().reverse();
  const c = document.getElementById('hand-list');
  if(!hands.length){ c.innerHTML=`<div class="empty-state"><div class="big">✋</div>No pending requests</div>`; return; }
  c.innerHTML = hands.map(h=>`
    <div class="hand-row">
      <div style="font-size:24px">✋</div>
      <div class="hand-body">
        <div class="hand-name">${esc(h.name)} <span style="color:var(--text3);font-size:12px;font-family:var(--mono)">+91 ${esc(h.phone)}</span></div>
        ${h.note?`<div class="hand-note">${esc(h.note)}</div>`:'<div class="hand-note" style="color:var(--text3);font-style:italic">No message</div>'}
        <div class="hand-time">${timeAgo(h.ts)}</div>
      </div>
      <button class="resolve-btn" onclick="doResolve(${h.id})">✓ Resolve</button>
    </div>
  `).join('');
}

function doResolve(id){
  resolveHand(id); renderHands(); updateStats(); showToast('✅ Resolved');
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────
function saveProfile(){
  const name = document.getElementById('s-name').value.trim();
  if(!name){ showToast('⚠️ Enter a name'); return; }
  setAdminName(name);
  document.getElementById('adm-name').textContent = name;
  document.getElementById('adm-avatar').textContent = name[0].toUpperCase();
  showToast('✅ Name saved');
}
async function savePassword(){
  const pw  = document.getElementById('s-pw').value;
  const pw2 = document.getElementById('s-pw2').value;
  if(pw !== pw2){ document.getElementById('pw-match-err').style.display='block'; return; }
  if(pw.length < 6){ showToast('⚠️ Min 6 characters'); return; }
  document.getElementById('pw-match-err').style.display='none';
  await setAdminPw(pw);
  document.getElementById('s-pw').value='';
  document.getElementById('s-pw2').value='';
  showToast('🔐 Password changed!');
}
function saveF2S(){
  const key = document.getElementById('s-f2s').value.trim();
  setF2SKey(key);
  showToast('✅ API key saved');
}
function clearAllPosts(){
  if(!confirm('Delete ALL posts? Cannot be undone.')) return;
  sset(K.POSTS, []); renderRecentPosts(); updateStats(); showToast('🗑 All posts deleted');
}
function clearAllMessages(){
  if(!confirm('Clear all chat messages?')) return;
  sset(K.MESSAGES, []); showToast('🗑 Chat cleared');
}
