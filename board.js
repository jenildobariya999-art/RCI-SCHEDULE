/* board.js */
let currentFilter = 'all';

window.addEventListener('load', () => {
  // allow admin OR approved member
  if(!isLoggedIn()){ window.location.href='register.html'; return; }
  if(!isAdmin()){
    const u = findUser(currentPhone());
    if(!u || !u.approved){ window.location.href='register.html'; return; }
  }

  if(isAdmin()) document.body.classList.add('admin-view');

  // nav
  const name = currentName();
  document.getElementById('nav-avatar').textContent = name[0].toUpperCase();
  document.getElementById('nav-name').textContent = name;

  // notif bar
  if(Notification.permission==='granted'){
    const b = document.getElementById('notif-bar');
    b.className='notif-bar granted';
    b.innerHTML='<span class="dot pulse"></span> Push notifications are enabled';
  }

  renderPosts();

  // hide raise hand for admin
  if(isAdmin()) document.getElementById('hand-fab').style.display='none';

  // auto refresh every 10s
  setInterval(renderPosts, 10000);
  window.addEventListener('cab:newpost', renderPosts);
});

function setFilter(f, el){
  currentFilter = f;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderPosts();
}

function renderPosts(){
  let posts = getPosts();
  if(currentFilter !== 'all') posts = posts.filter(p=>p.type===currentFilter);
  posts = posts.slice().reverse();

  const c = document.getElementById('posts-container');
  if(!posts.length){
    c.innerHTML=`<div class="empty"><div class="big">📭</div><p>No announcements yet.<br/>Stay tuned!</p></div>`;
    return;
  }

  const labels = { meet:'📍 MEET UP', urgent:'🚨 URGENT', notice:'📋 NOTICE' };
  c.innerHTML = posts.map(p=>`
    <div class="post ${p.type}">
      <div class="post-top">
        <div>
          <span class="badge ${p.type}" style="margin-bottom:6px;display:inline-flex">${labels[p.type]||p.type.toUpperCase()}</span>
          <div class="post-title">${esc(p.title)}</div>
        </div>
        <span class="post-age">${timeAgo(p.ts)}</span>
      </div>
      ${(p.date||p.time||p.place)?`
      <div class="post-meta">
        ${p.date?`<span class="meta-chip"><span class="mi">📅</span>${fmtDate(p.date)}</span>`:''}
        ${p.time?`<span class="meta-chip"><span class="mi">🕐</span>${fmtTime(p.time)}</span>`:''}
        ${p.place?`<span class="meta-chip"><span class="mi">📍</span>${esc(p.place)}</span>`:''}
      </div>`:''}
      ${p.body?`<div class="post-body">${esc(p.body)}</div>`:''}
      <div class="post-footer">
        <span class="post-from">— ${esc(p.from)}</span>
        <button class="delete-btn" onclick="confirmDelete(${p.id})">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

function confirmDelete(id){
  if(confirm('Delete this announcement?')){ deletePost(id); renderPosts(); showToast('🗑 Deleted'); }
}

async function enableNotif(){
  const ok = await requestNotifPermission();
  if(ok){
    const b = document.getElementById('notif-bar');
    b.className='notif-bar granted';
    b.innerHTML='<span class="dot pulse"></span> Push notifications are enabled';
    showToast('🔔 Notifications enabled!');
    new Notification('CA Board', { body:'You will now get notified for new announcements!' });
  } else {
    showToast('❌ Permission denied. Allow in browser settings.');
  }
}

function openHandModal(){
  document.getElementById('hand-note').value='';
  openOverlay('hand-overlay');
}

function submitHand(){
  const note = document.getElementById('hand-note').value.trim();
  const phone = currentPhone();
  const name  = currentName();
  const res = raiseHand(phone, name, note);
  if(res==='already'){
    showToast('⚠️ You already have a pending request');
    closeOverlay('hand-overlay'); return;
  }
  closeOverlay('hand-overlay');
  showToast('✋ Your request has been sent to admin!');
}

function logout(){
  clearSession();
  window.location.href='register.html';
}

// overlay helpers
function openOverlay(id){ document.getElementById(id).classList.add('open'); }
function closeOverlay(id){ document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e=>{
  if(e.target.classList.contains('overlay')) e.target.classList.remove('open');
});
