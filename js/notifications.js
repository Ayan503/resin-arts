'use strict';
/* ══════════════════════════════════════════════
   NOTIFICATION SYSTEM — Resin Aura
   Types: like_post, comment_post, share_post,
          like_story, comment_story, new_product,
          offer, admin_news
══════════════════════════════════════════════ */

const NDB = {
  get:    (email, limit=50) => sb(`notifications?recipient_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=${limit}`),
  add:    (n)               => sb('notifications', {method:'POST', body:JSON.stringify(n)}),
  markRead: (id)            => sb(`notifications?id=eq.${id}`, {method:'PATCH', body:JSON.stringify({is_read:true})}),
  markAllRead: (email)      => sb(`notifications?recipient_email=eq.${encodeURIComponent(email)}`, {method:'PATCH', body:JSON.stringify({is_read:true})}),
  getUnreadCount: (email)   => sb(`notifications?recipient_email=eq.${encodeURIComponent(email)}&is_read=eq.false&select=id`),
};

/* Create a notification */
async function createNotif(recipientEmail, type, data){
  if(!recipientEmail) return;
  const me = getSession();
  // don't notify yourself
  if(me && me.email === recipientEmail) return;
  try {
    await NDB.add({
      recipient_email: recipientEmail,
      type,
      actor_name:    me?.name || 'Someone',
      actor_avatar:  me?.avatar || null,
      actor_email:   me?.email || null,
      ref_id:        data.ref_id || null,    // post_id or story_id
      ref_type:      data.ref_type || null,  // 'post' or 'story'
      message:       data.message || '',
      is_read:       false,
      created_at:    new Date().toISOString(),
    });
    // update badge for recipient if they're online (best-effort)
  } catch(e){ console.log('Notif error:', e); }
}

/* Notification panel state */
let notifPanelOpen = false;
let notifData = [];

async function openNotifPanel(){
  const me = getSession(); if(!me){ openAuth(); return; }
  notifPanelOpen = true;
  document.getElementById('notifPanel').classList.add('open');
  document.getElementById('notifOverlay').classList.add('show');
  await loadNotifs(me.email);
}
function closeNotifPanel(){
  notifPanelOpen = false;
  document.getElementById('notifPanel').classList.remove('open');
  document.getElementById('notifOverlay').classList.remove('show');
}

async function loadNotifs(email){
  const list = document.getElementById('notifList');
  list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted)">⏳ Loading...</div>';
  try {
    notifData = await NDB.get(email);
    renderNotifs();
    // mark all read after viewing
    setTimeout(()=>{ NDB.markAllRead(email).then(()=>updateNotifBadge(email)); }, 1500);
  } catch(e){
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted)">Could not load notifications</div>`;
  }
}

function renderNotifs(){
  const list = document.getElementById('notifList');
  if(!notifData.length){
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:40px;margin-bottom:12px">🔔</div><p>No notifications yet</p></div>';
    return;
  }
  list.innerHTML = notifData.map(n => {
    const icon = notifIcon(n.type);
    const av   = n.actor_avatar ? `<img src="${n.actor_avatar}" alt="">` : (n.actor_name ? n.actor_name[0].toUpperCase() : '?');
    const time = timeAgoN(n.created_at);
    const unread = !n.is_read;
    const linkFn = n.ref_id && n.ref_type ? `onclick="goToNotif('${n.ref_id}','${n.ref_type}','${n.id}')"` : '';
    return `<div class="notif-item ${unread?'unread':''}" ${linkFn} style="${linkFn?'cursor:pointer':''}">
      <div class="notif-av">
        ${av}
        <div class="notif-type-icon">${icon}</div>
      </div>
      <div class="notif-body">
        <div class="notif-text"><strong>${escHN(n.actor_name)}</strong> ${escHN(n.message)}</div>
        <div class="notif-time">${time}</div>
      </div>
      ${unread?'<div class="notif-dot"></div>':''}
    </div>`;
  }).join('');
}

function notifIcon(type){
  const m = {
    like_post:'❤️', comment_post:'💬', share_post:'↗️',
    like_story:'❤️', comment_story:'💬',
    new_product:'🎨', offer:'🏷️', admin_news:'📢',
  };
  return m[type]||'🔔';
}

async function goToNotif(refId, refType, notifId){
  closeNotifPanel();
  await NDB.markRead(notifId).catch(()=>{});
  if(refType==='post'){
    // scroll to post in feed
    const el = document.getElementById('post-'+refId);
    if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.boxShadow='0 0 0 3px var(--amber)'; setTimeout(()=>el.style.boxShadow='',2000); }
    else { await loadPosts(); setTimeout(()=>{ const el2=document.getElementById('post-'+refId); if(el2) el2.scrollIntoView({behavior:'smooth',block:'center'}); },500); }
  } else if(refType==='story'){
    await loadStories();
    const grpIdx = storyGroups.findIndex(g=>g.items.some(s=>s.id==refId));
    if(grpIdx!==-1){ const sI=storyGroups[grpIdx].items.findIndex(s=>s.id==refId); sgIdx=grpIdx; sIdx=Math.max(0,sI); openStoryViewer(grpIdx); }
  }
}

async function updateNotifBadge(email){
  if(!email) return;
  try {
    const unread = await NDB.getUnreadCount(email);
    const badge  = document.getElementById('notifBadge');
    if(badge){ badge.textContent=unread.length||''; badge.style.display=unread.length?'flex':'none'; }
  } catch(e){}
}

/* Poll for new notifications every 30s */
function startNotifPolling(){
  const me = getSession(); if(!me) return;
  updateNotifBadge(me.email);
  setInterval(()=>{ const s=getSession(); if(s) updateNotifBadge(s.email); }, 30000);
}

function timeAgoN(iso){
  if(!iso) return '';
  const m=Math.floor((Date.now()-new Date(iso))/60000);
  if(m<1) return 'Just now';
  if(m<60) return m+'m ago';
  const h=Math.floor(m/60);
  if(h<24) return h+'h ago';
  return Math.floor(h/24)+'d ago';
}
function escHN(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
