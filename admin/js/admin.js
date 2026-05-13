'use strict';
let allProducts=[], allOrders=[], adminCreds=null;

/* ── CREDS ── */
async function loadAdminCreds(){
  try{
    const r=await DB.getAdminCreds();
    const o={}; r.forEach(x=>o[x.key]=x.value);
    adminCreds={id:o.admin_id||'admin',password:o.admin_password||'resign123'};
  }catch(e){adminCreds={id:'admin',password:'resign123'};}
}

/* ── LOGIN / SESSION ── */
async function doAdminLogin(){
  const id=document.getElementById('adminId').value.trim();
  const pass=document.getElementById('adminPass').value;
  if(!adminCreds) await loadAdminCreds();
  if(id===adminCreds.id && pass===adminCreds.password){
    saveAdminSess(true); showAdminApp();
  }else{
    document.getElementById('loginErr').style.display='block';
    setTimeout(()=>document.getElementById('loginErr').style.display='none',3000);
  }
}
document.getElementById('adminPass').addEventListener('keydown',e=>{if(e.key==='Enter')doAdminLogin();});

function showAdminApp(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('adminApp').style.display='block';
  initAdmin();
}
async function checkAdminSession(){
  if(getAdminSess()){await loadAdminCreds();showAdminApp();}
}
function adminLogout(){
  if(!confirm('Logout?'))return;
  saveAdminSess(false);
  document.getElementById('adminApp').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('adminId').value='';
  document.getElementById('adminPass').value='';
}

/* ── NAV ── */
function showPage(name,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  el&&el.classList.add('active');
  const titles={dashboard:'Dashboard',products:'Products',orders:'Orders',reviews:'Reviews',settings:'Settings',community:'🌸 Community Feed',media:'🗂 Media Library',games:'🎮 Games Management'};
  document.getElementById('topbarTitle').textContent=titles[name]||name;
  if(name==='products')  renderProductTable();
  if(name==='orders')    renderOrderTable();
  if(name==='reviews')   renderReviewsTable();
  if(name==='dashboard') renderDashboard();
  if(name==='settings')  renderSettingsPage();
  if(name==='community') renderCommunityPage();
  if(name==='media')     renderMediaPage();
  if(name==='games')     renderGamesPage();
  closeSidebar();
}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('mobOverlay').classList.toggle('show');}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('mobOverlay').classList.remove('show');}

/* ── INIT ── */
async function initAdmin(){
  [allProducts,allOrders]=await Promise.all([
    DB.getProducts().catch(()=>[]),
    DB.getOrders().catch(()=>[])
  ]);
  renderDashboard();updatePendingBadge();
}
function updatePendingBadge(){
  document.getElementById('pendingBadge').textContent=allOrders.filter(o=>o.status==='Pending').length;
}

/* ── DASHBOARD ── */
function renderDashboard(){
  const rev=allOrders.filter(o=>o.status==='Delivered').reduce((s,o)=>s+(o.total||0),0);
  const pend=allOrders.filter(o=>o.status==='Pending').length;
  const payV=allOrders.filter(o=>o.payment_status&&o.payment_status.includes('Pending Verification')).length;
  document.getElementById('statsGrid').innerHTML=`
    <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-num">${allProducts.length}</div><div class="stat-label">Products</div></div>
    <div class="stat-card"><div class="stat-icon">🛍</div><div class="stat-num">${allOrders.length}</div><div class="stat-label">Total Orders</div><div class="stat-sub">${pend} Pending</div></div>
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-num">₹${rev.toLocaleString('en-IN')}</div><div class="stat-label">Revenue</div></div>
    <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-num">${payV}</div><div class="stat-label">Pending Payment Verify</div></div>`;
  const tbody=document.getElementById('recentBody');
  const recent=allOrders.slice(0,7);
  if(!recent.length){tbody.innerHTML=`<tr><td colspan="5"><div class="empty-state"><div class="icon">🛍</div><p>No orders yet</p></div></td></tr>`;return;}
  tbody.innerHTML=recent.map(o=>`<tr>
    <td><strong style="font-size:12px">${o.id}</strong></td>
    <td>${o.customer_name}</td><td><strong>₹${o.total}</strong></td>
    <td><span class="tag tag-${o.status.toLowerCase()}">${o.status}</span></td>
    <td style="color:var(--muted);font-size:12px">${o.date||''}</td>
  </tr>`).join('');
}

/* ── PRODUCTS ── */
function renderProductTable(){
  const q=(document.getElementById('pSearch')?.value||'').toLowerCase();
  const list=q?allProducts.filter(p=>p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)):allProducts;
  const tbody=document.getElementById('productBody');
  if(!list.length){tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><div class="icon">📦</div><p>No products</p></div></td></tr>`;return;}
  tbody.innerHTML=list.map(p=>{
    const vars=p.variants||[];
    const imgSrc=p.image?(p.image.startsWith('data:')?p.image:'../'+p.image):'';
    return `<tr>
      <td>${imgSrc?`<img class="product-thumb" src="${imgSrc}" alt="${p.name}" onerror="this.style.display='none'">`:'—'}</td>
      <td><strong>${p.name}</strong></td><td><strong>₹${p.price}</strong></td>
      <td style="max-width:160px">${vars.length?vars.map(v=>`<span class="tag tag-cat" style="margin:2px;display:inline-block">${v.label}: ₹${v.price}</span>`).join(''):'<span style="color:var(--muted);font-size:12px">No variants</span>'}</td>
      <td><span class="tag tag-cat">${p.category}</span></td>
      <td style="white-space:nowrap">
        <button class="btn-sm btn-edit" onclick="editProduct(${p.id})">Edit</button>
        <button class="btn-sm btn-danger" onclick="deleteProduct(${p.id})" style="margin-left:6px">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

let editingId=null,imgData=null;
function openProductModal(id){
  editingId=id||null;imgData=null;
  document.getElementById('imgPreview').classList.remove('show');
  document.getElementById('pImage').value='';
  document.getElementById('variantList').innerHTML='';
  const cats=[...new Set(allProducts.map(p=>p.category))];
  document.getElementById('catList').innerHTML=cats.map(c=>`<option value="${c}">`).join('');
  if(id){
    const p=allProducts.find(x=>x.id===id);
    document.getElementById('productModalTitle').textContent='Edit Product';
    document.getElementById('pName').value=p.name;
    document.getElementById('pPrice').value=p.price;
    document.getElementById('pCat').value=p.category;
    document.getElementById('pDesc').value=p.description||'';
    (p.variants||[]).forEach(v=>addVariantRow(v.label,v.price));
    if(p.image){const img=document.getElementById('imgPreview');img.src=p.image.startsWith('data:')?p.image:'../'+p.image;img.classList.add('show');}
  }else{
    document.getElementById('productModalTitle').textContent='Add Product';
    ['pName','pPrice','pCat','pDesc'].forEach(i=>document.getElementById(i).value='');
  }
  document.getElementById('productModal').classList.add('show');
}
function editProduct(id){openProductModal(id);}
function closeProductModal(){document.getElementById('productModal').classList.remove('show');}
function previewImg(input){
  const f=input.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{imgData=e.target.result;const img=document.getElementById('imgPreview');img.src=imgData;img.classList.add('show');};
  r.readAsDataURL(f);
}
function addVariantRow(label='',price=''){
  const div=document.createElement('div');div.className='variant-row';
  div.innerHTML=`<input type="text" placeholder="Label (e.g. 4 inch / With Tassel)" value="${label}">
    <input type="number" placeholder="₹ Price" value="${price}" min="0" style="max-width:100px">
    <button class="btn-rm-var" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('variantList').appendChild(div);
}
async function saveProduct(){
  const name=document.getElementById('pName').value.trim();
  const price=parseInt(document.getElementById('pPrice').value)||0;
  const cat=document.getElementById('pCat').value.trim();
  const desc=document.getElementById('pDesc').value.trim();
  if(!name||!cat){showToast('Please fill Name and Category','error');return;}
  const vars=[];
  document.querySelectorAll('#variantList .variant-row').forEach(row=>{
    const ins=row.querySelectorAll('input');
    const l=ins[0].value.trim(),p=parseInt(ins[1].value);
    if(l&&p)vars.push({label:l,price:p});
  });
  try{
    if(editingId){
      const upd={name,price,category:cat,description:desc,variants:vars};
      if(imgData)upd.image=imgData;
      await DB.updateProduct(editingId,upd);
      const idx=allProducts.findIndex(p=>p.id===editingId);
      if(idx!==-1)allProducts[idx]={...allProducts[idx],...upd};
    }else{
      const res=await DB.addProduct({name,price,category:cat,description:desc,variants:vars,image:imgData||''});
      if(res&&res[0])allProducts.push(res[0]);
    }
    closeProductModal();renderProductTable();renderDashboard();
    showToast(editingId?'Product updated ✓':'Product added ✓');
  }catch(e){showToast('Error saving product','error');}
}
async function deleteProduct(id){
  if(!confirm('Delete this product?'))return;
  try{
    await DB.deleteProduct(id);
    allProducts=allProducts.filter(p=>p.id!==id);
    renderProductTable();renderDashboard();showToast('Product deleted');
  }catch(e){showToast('Error deleting','error');}
}

/* ── ORDERS ── */
async function renderOrderTable(){
  try{allOrders=await DB.getOrders();}catch(e){}
  const q=(document.getElementById('oSearch')?.value||'').toLowerCase();
  const sf=document.getElementById('statusFilter')?.value||'';
  const pf=document.getElementById('payFilter')?.value||'';
  let list=allOrders;
  if(q)list=list.filter(o=>o.id.toLowerCase().includes(q)||(o.customer_name||'').toLowerCase().includes(q)||(o.phone||'').includes(q));
  if(sf)list=list.filter(o=>o.status===sf);
  if(pf==='paid')list=list.filter(o=>o.payment_status&&o.payment_status.includes('Paid'));
  if(pf==='pending')list=list.filter(o=>!o.payment_status||o.payment_status==='Pending');
  if(pf==='verify')list=list.filter(o=>o.payment_status&&o.payment_status.includes('Pending Verification'));
  const tbody=document.getElementById('orderBody');
  if(!list.length){tbody.innerHTML=`<tr><td colspan="8"><div class="empty-state"><div class="icon">🛍</div><p>No orders</p></div></td></tr>`;return;}
  tbody.innerHTML=list.map(o=>{
    const pc=o.payment_status?.includes('Verified')?'tag-paid':o.payment_status?.includes('Verification')?'tag-pending':'tag-unpaid';
    return `<tr>
      <td><strong style="font-size:11px">${o.id}</strong></td>
      <td>${o.customer_name}<br><span style="font-size:11px;color:var(--muted)">${o.phone}</span></td>
      <td style="font-size:12px;color:var(--muted);max-width:150px">${(o.items||[]).map(i=>`${i.name}${i.variant?' ('+i.variant+')':''} ×${i.qty}`).join(', ')}</td>
      <td><strong>₹${o.total}</strong></td>
      <td><select class="status-select" onchange="updateStatus('${o.id}',this.value)">
        ${['Pending','Confirmed','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
      </select></td>
      <td><span class="tag ${pc}" style="font-size:10px">${o.payment_status||'Pending'}</span>
        ${o.utr?`<br><span style="font-size:10px;color:var(--muted)">UTR: ${o.utr}</span>`:''}
        ${o.payment_status?.includes('Pending Verification')?`<br><button class="btn-verify" style="margin-top:4px" onclick="verifyPayment('${o.id}')">✓ Verify</button>`:''}
      </td>
      <td style="font-size:11px;color:var(--muted)">${o.date||''}</td>
      <td style="white-space:nowrap">
        <button class="btn-sm btn-view" onclick="viewOrder('${o.id}')">Details</button>
        <button class="btn-sm btn-danger" onclick="deleteOrder('${o.id}')" style="margin-left:4px">Del</button>
      </td>
    </tr>`;
  }).join('');
  updatePendingBadge();
}

async function updateStatus(orderId,status){
  try{
    const o=allOrders.find(x=>x.id===orderId);if(!o)return;
    const logs=[...(o.order_logs||[]),{time:new Date().toLocaleString('en-IN'),action:`Status changed to "${status}"`}];
    await DB.updateOrder(orderId,{status,order_logs:logs});
    o.status=status;o.order_logs=logs;
    updatePendingBadge();renderDashboard();showToast(`Order → ${status} ✓`);
  }catch(e){showToast('Error updating status','error');}
}
async function verifyPayment(orderId){
  if(!confirm('Mark payment as verified?'))return;
  try{
    const o=allOrders.find(x=>x.id===orderId);if(!o)return;
    const logs=[...(o.order_logs||[]),{time:new Date().toLocaleString('en-IN'),action:'Payment verified by admin'}];
    await DB.updateOrder(orderId,{payment_status:'Paid (Verified)',order_logs:logs});
    o.payment_status='Paid (Verified)';o.order_logs=logs;
    renderOrderTable();showToast('Payment verified ✓');
  }catch(e){showToast('Error verifying','error');}
}
async function deleteOrder(id){
  if(!confirm('Delete this order?'))return;
  try{
    await DB.deleteOrder(id);
    allOrders=allOrders.filter(o=>o.id!==id);
    renderOrderTable();updatePendingBadge();renderDashboard();showToast('Order deleted');
  }catch(e){showToast('Error deleting','error');}
}
function viewOrder(id){
  const o=allOrders.find(x=>x.id===id);if(!o)return;
  const logs=o.order_logs||[];
  document.getElementById('orderModalBox').innerHTML=`
    <div class="modal-header"><h3>Order Details</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>
    <div class="order-detail-row"><span class="odl">Order ID</span><span class="odv">${o.id}</span></div>
    <div class="order-detail-row"><span class="odl">Date</span><span class="odv">${o.date||''}</span></div>
    <div class="order-detail-row"><span class="odl">Customer</span><span class="odv">${o.customer_name}</span></div>
    <div class="order-detail-row"><span class="odl">Phone</span><span class="odv">${o.phone}</span></div>
    <div class="order-detail-row"><span class="odl">Email</span><span class="odv">${o.email||'—'}</span></div>
    <div class="order-detail-row"><span class="odl">Address</span><span class="odv">${o.address}</span></div>
    <div class="order-detail-row"><span class="odl">Items</span><span class="odv">${(o.items||[]).map(i=>`${i.name}${i.variant?' ('+i.variant+')':''} ×${i.qty} = ₹${i.price*i.qty}`).join('<br>')}</span></div>
    <div class="order-detail-row"><span class="odl">Total</span><span class="odv" style="color:var(--amber);font-size:16px">₹${o.total}</span></div>
    ${o.note?`<div class="order-detail-row"><span class="odl">Note</span><span class="odv">${o.note}</span></div>`:''}
    <div class="payment-row">
      <div class="p-label">Payment</div>
      <div class="p-val">${o.payment_status||'Pending'}</div>
      ${o.utr?`<div class="p-label" style="margin-top:6px">UTR</div><div class="utr-val">${o.utr}</div>`:''}
      ${o.payment_status?.includes('Pending Verification')?`<button class="btn-verify" style="margin-top:8px" onclick="verifyPayment('${o.id}');closeOrderModal()">✓ Verify Payment</button>`:''}
    </div>
    <div class="order-detail-row">
      <span class="odl">Status</span>
      <select class="status-select" onchange="updateStatus('${o.id}',this.value)">
        ${['Pending','Confirmed','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="log-section">
      <div class="log-title">📋 Activity Log</div>
      ${logs.length?logs.map(l=>`<div class="log-entry-a"><div class="log-dot-a"></div><div><div class="log-action-a">${l.action}</div><div class="log-time-a">${l.time}</div></div></div>`).join(''):'<p style="font-size:13px;color:var(--muted)">No activity yet.</p>'}
      <div class="log-note-form">
        <label>Add Note</label>
        <textarea id="logNote" placeholder="e.g. Called customer, dispatched via DTDC..."></textarea>
        <button class="btn-log" onclick="addLog('${o.id}')">Add Note</button>
      </div>
    </div>`;
  document.getElementById('orderModal').classList.add('show');
}
async function addLog(orderId){
  const note=document.getElementById('logNote')?.value.trim();
  if(!note){showToast('Please type a note','error');return;}
  const o=allOrders.find(x=>x.id===orderId);if(!o)return;
  const logs=[...(o.order_logs||[]),{time:new Date().toLocaleString('en-IN'),action:note}];
  try{
    await DB.updateOrder(orderId,{order_logs:logs});
    o.order_logs=logs;closeOrderModal();showToast('Note added ✓');
  }catch(e){showToast('Error adding note','error');}
}
function closeOrderModal(){document.getElementById('orderModal').classList.remove('show');}

/* ── REVIEWS ── */
async function renderReviewsTable(){
  const tbody=document.getElementById('reviewBody');
  tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><div class="icon">⏳</div><p>Loading...</p></div></td></tr>`;
  try{
    const reviews=await sb('reviews?order=created_at.desc').catch(()=>[]);
    if(!reviews.length){tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><div class="icon">⭐</div><p>No reviews yet</p></div></td></tr>`;return;}
    tbody.innerHTML=reviews.map(r=>`<tr>
      <td>${r.photo?`<img src="${r.photo}" style="width:50px;height:50px;border-radius:8px;object-fit:cover">`:
        `<div style="width:50px;height:50px;border-radius:8px;background:var(--warm);display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>`}</td>
      <td><strong>${r.customer_name}</strong></td>
      <td>${'⭐'.repeat(r.rating||5)}</td>
      <td style="max-width:200px;font-size:13px">${r.comment||''}</td>
      <td><span class="tag ${r.approved?'tag-delivered':'tag-pending'}">${r.approved?'Published':'Pending'}</span></td>
      <td style="white-space:nowrap">
        ${!r.approved?`<button class="btn-sm btn-verify" onclick="approveReview(${r.id})">Approve</button> `:''}
        <button class="btn-sm btn-danger" onclick="deleteReview(${r.id})">Delete</button>
      </td>
    </tr>`).join('');
  }catch(e){tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><p>Could not load</p></div></td></tr>`;}
}
async function approveReview(id){
  try{await sb('reviews?id=eq.'+id,{method:'PATCH',body:JSON.stringify({approved:true})});showToast('Review approved ✓');renderReviewsTable();}
  catch(e){showToast('Error','error');}
}
async function deleteReview(id){
  if(!confirm('Delete this review?'))return;
  try{await sb('reviews?id=eq.'+id,{method:'DELETE',prefer:'return=minimal'});showToast('Review deleted');renderReviewsTable();}
  catch(e){showToast('Error','error');}
}

/* ── SETTINGS — fully JS rendered ── */
function renderSettingsPage(){
  document.getElementById('settingsContent').innerHTML=`
    <!-- QR CODES -->
    <div class="section-card" style="margin-bottom:20px">
      <div class="section-card-header"><span class="section-card-title">UPI QR Codes</span></div>
      <div style="padding:20px">
        <p style="font-size:13px;color:var(--muted);margin-bottom:18px">Upload your UPI QR codes. They show automatically to customers during checkout.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px" id="qrGrid">
          <div style="text-align:center;padding:20px;color:var(--muted)">⏳ Loading QR codes...</div>
        </div>
      </div>
    </div>

    <!-- PASSWORD -->
    <div class="section-card" style="margin-bottom:20px">
      <div class="section-card-header"><span class="section-card-title">Change Admin Password</span></div>
      <div style="padding:20px;max-width:400px">
        <div class="form-group"><label>Current Password</label><input type="password" id="currPass" placeholder="Current password"></div>
        <div class="form-group"><label>New Password</label><input type="password" id="newPass" placeholder="Min 6 characters"></div>
        <div class="form-group"><label>Confirm New Password</label><input type="password" id="confPass" placeholder="Confirm new password"></div>
        <button class="btn-primary" onclick="changePassword()">Update Password</button>
        <p style="font-size:12px;color:var(--muted);margin-top:10px">Saved permanently in Supabase.</p>
      </div>
    </div>

    <!-- DANGER -->
    <div class="section-card">
      <div class="section-card-header"><span class="section-card-title" style="color:var(--danger)">Danger Zone</span></div>
      <div style="padding:20px">
        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Permanent actions — cannot be undone.</p>
        <button class="btn-sm btn-danger" style="padding:9px 18px;font-size:13px" onclick="clearAllOrders()">🗑 Clear All Orders</button>
      </div>
    </div>`;

  loadQRGrid();
}

async function loadQRGrid(){
  const QRS=[{id:'phonepe',label:'PhonePe',color:'#5f259f'},{id:'gpay',label:'Google Pay',color:'#1a73e8'},{id:'paytm',label:'Paytm',color:'#002970'}];
  const grid=document.getElementById('qrGrid');
  if(!grid)return;

  // Build grid first
  grid.innerHTML=QRS.map(q=>`
    <div style="background:var(--cream);border-radius:12px;padding:16px;text-align:center">
      <div style="font-weight:700;color:${q.color};margin-bottom:10px;font-size:14px">${q.label}</div>
      <div id="qr-wrap-${q.id}" style="width:130px;height:130px;margin:0 auto 12px;border-radius:10px;border:2px dashed #e0d0c0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff">
        <span style="font-size:12px;color:var(--muted)">No QR yet</span>
      </div>
      <label style="display:inline-block;background:var(--amber);color:#fff;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;transition:background .2s" onmouseover="this.style.background='#a85a24'" onmouseout="this.style.background='var(--amber)'">
        📷 Upload QR
        <input type="file" accept="image/*" style="display:none" onchange="uploadQR(this,'${q.id}','${q.label}')">
      </label>
    </div>`).join('');

  // Load existing QRs
  for(const q of QRS){
    try{
      const val=await DB.getQR(q.id);
      if(val){
        const wrap=document.getElementById('qr-wrap-'+q.id);
        if(wrap) wrap.innerHTML=`<img src="${val}" style="width:100%;height:100%;object-fit:contain" alt="${q.label} QR">`;
      }
    }catch(e){}
  }
}

function uploadQR(input,name,label){
  const f=input.files[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=async(e)=>{
    const data=e.target.result;
    try{
      await DB.setQR(name,data);
      const wrap=document.getElementById('qr-wrap-'+name);
      if(wrap) wrap.innerHTML=`<img src="${data}" style="width:100%;height:100%;object-fit:contain" alt="${label} QR">`;
      showToast(label+' QR uploaded ✓');
    }catch(err){showToast('Error saving QR','error');}
  };
  reader.readAsDataURL(f);
}

/* ── PASSWORD ── */
async function changePassword(){
  const curr=document.getElementById('currPass')?.value;
  const nw=document.getElementById('newPass')?.value;
  const conf=document.getElementById('confPass')?.value;
  if(!curr||!nw||!conf){alert('Please fill all fields.');return;}
  if(!adminCreds)await loadAdminCreds();
  if(curr!==adminCreds.password){alert('Current password is incorrect.');return;}
  if(nw.length<6){alert('New password must be at least 6 characters.');return;}
  if(nw!==conf){alert('Passwords do not match.');return;}
  try{
    await DB.updateAdminPass(nw);
    adminCreds.password=nw;
    document.getElementById('currPass').value='';
    document.getElementById('newPass').value='';
    document.getElementById('confPass').value='';
    showToast('Password updated permanently ✓');
  }catch(e){showToast('Error updating password','error');}
}

async function clearAllOrders(){
  if(!confirm('Delete ALL orders permanently? Cannot be undone!'))return;
  try{
    await DB.deleteAllOrders();
    allOrders=[];updatePendingBadge();renderDashboard();showToast('All orders cleared');
  }catch(e){showToast('Error clearing','error');}
}

/* ── TOAST ── */
function showToast(msg,type='success'){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.style.background=type==='error'?'#c0392b':type==='info'?'#2980b9':'#2d7a4f';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

document.getElementById('productModal').addEventListener('click',function(e){if(e.target===this)closeProductModal();});
document.getElementById('orderModal').addEventListener('click',function(e){if(e.target===this)closeOrderModal();});

checkAdminSession();
loadAdminCreds();
/* ══════════════════════════════
   COMMUNITY FEED ADMIN
══════════════════════════════ */
let allCommunityPosts = [];
let allCommunityComments = {};

async function renderCommunityPage() {
  const content = document.getElementById('communityContent');
  content.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">⏳ Loading posts...</div>';
  try {
    allCommunityPosts = await sb('community_posts?order=created_at.desc');
    content.innerHTML = `
      <div class="section-card">
        <div class="section-card-header">
          <span class="section-card-title">Community Posts (${allCommunityPosts.length})</span>
          <a href="../community.html" target="_blank" class="btn-add" style="text-decoration:none">🌸 Open Feed</a>
        </div>
        ${allCommunityPosts.length === 0 ? `<div class="empty-state"><div class="icon">🌸</div><p>No posts yet</p></div>` : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Author</th><th>Post</th><th>Image</th><th>Likes</th><th>Comments</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody id="communityBody">${renderCommunityRows()}</tbody>
          </table>
        </div>`}
      </div>`;
  } catch(e) {
    content.innerHTML = `<div class="section-card"><div class="empty-state"><div class="icon">⚠️</div><p>Error loading community posts.<br><small>${e.message}</small></p></div></div>`;
  }
}

function renderCommunityRows() {
  return allCommunityPosts.map(post => {
    const date = post.created_at ? new Date(post.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'2-digit'}) : '—';
    const textPreview = post.text ? post.text.substring(0, 80) + (post.text.length > 80 ? '...' : '') : '<em style="color:var(--muted)">No text</em>';
    const imgCell = post.image ? `<img src="${post.image}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;cursor:pointer" onclick="adminViewImg('${post.image.replace(/'/g,"\\'")}')">` : '—';
    return `<tr>
      <td>
        <strong style="font-size:13px">${escAdm(post.author_name || 'Unknown')}</strong>
        <div style="font-size:11px;color:var(--muted)">${escAdm(post.author_email || '')}</div>
      </td>
      <td style="max-width:200px;font-size:13px">${textPreview}</td>
      <td>${imgCell}</td>
      <td style="text-align:center"><strong>${post.likes || 0}</strong></td>
      <td style="text-align:center"><strong>${post.comments_count || 0}</strong>
        <button onclick="viewPostComments('${post.id}')" style="background:none;border:none;color:var(--amber);cursor:pointer;font-size:11px;display:block;margin-top:2px">view</button>
      </td>
      <td style="font-size:12px;color:var(--muted)">${date}</td>
      <td><button class="btn-delete" onclick="adminDeletePost('${post.id}')">Delete</button></td>
    </tr>`;
  }).join('');
}

async function adminDeletePost(postId) {
  if (!confirm('Delete this post and all its comments?')) return;
  try {
    // Delete comments first
    await sb('community_comments?post_id=eq.' + postId, { method: 'DELETE', prefer: 'return=minimal' });
    await sb('community_posts?id=eq.' + postId, { method: 'DELETE', prefer: 'return=minimal' });
    showToast('Post deleted');
    renderCommunityPage();
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function viewPostComments(postId) {
  try {
    const comments = await sb('community_comments?post_id=eq.' + postId + '&order=created_at.asc');
    const post = allCommunityPosts.find(p => p.id == postId);
    const modal = document.getElementById('orderModal');
    const box = document.getElementById('orderModalBox');
    box.innerHTML = `
      <div class="modal-header">
        <h3>Comments on: ${escAdm((post?.text || 'Post').substring(0,40))}...</h3>
        <button class="btn-close" onclick="closeOrderModal()">×</button>
      </div>
      ${comments.length === 0 ? '<p style="text-align:center;color:var(--muted);padding:24px">No comments yet</p>' : comments.map(c => `
        <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--warm)">
          <div style="flex:1">
            <strong style="font-size:13px">${escAdm(c.author_name || 'User')}</strong>
            <span style="font-size:11px;color:var(--muted);margin-left:8px">${escAdm(c.author_email || '')}</span>
            <p style="font-size:13px;margin-top:4px;color:var(--text)">${escAdm(c.text)}</p>
          </div>
          <button class="btn-delete" onclick="adminDeleteComment('${c.id}','${postId}')" style="align-self:flex-start;flex-shrink:0">Del</button>
        </div>`).join('')}`;
    modal.classList.add('show');
  } catch(e) { showToast('Error loading comments', 'error'); }
}

async function adminDeleteComment(commentId, postId) {
  if (!confirm('Delete this comment?')) return;
  try {
    await sb('community_comments?id=eq.' + commentId, { method: 'DELETE', prefer: 'return=minimal' });
    // Update comment count
    const post = allCommunityPosts.find(p => p.id == postId);
    if (post) post.comments_count = Math.max(0, (post.comments_count || 0) - 1);
    showToast('Comment deleted');
    await viewPostComments(postId);
  } catch(e) { showToast('Error', 'error'); }
}

function adminViewImg(src) {
  const modal = document.getElementById('orderModal');
  const box = document.getElementById('orderModalBox');
  box.innerHTML = `
    <div class="modal-header"><h3>Post Image</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>
    <div style="text-align:center;padding:12px"><img src="${src}" style="max-width:100%;max-height:60vh;border-radius:12px;object-fit:contain"></div>`;
  modal.classList.add('show');
}

function escAdm(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════
   MEDIA LIBRARY + OFFICIAL POSTS
══════════════════════════════ */
let mediaItems = [];   // from DB: community_media
let officialPosts = [];

async function renderMediaPage() {
  const el = document.getElementById('mediaContent');
  el.innerHTML = `
  <div class="section-card" style="margin-bottom:20px">
    <div class="section-card-header">
      <span class="section-card-title">📤 Upload Media</span>
    </div>
    <div style="padding:0 0 16px">
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Upload images, videos, or audio files. You can then post them directly to the Community feed as official posts.</p>
      <div id="uploadDropzone" style="border:2px dashed var(--warm);border-radius:14px;padding:36px;text-align:center;cursor:pointer;transition:border-color .2s;position:relative">
        <input type="file" id="mediaFileInput" accept="image/*,video/*,audio/*" multiple style="position:absolute;inset:0;opacity:0;cursor:pointer" onchange="handleMediaUpload(this)">
        <div style="font-size:40px;margin-bottom:10px">📁</div>
        <div style="font-weight:600;color:var(--text);margin-bottom:4px">Click or drag files here</div>
        <div style="font-size:12px;color:var(--muted)">Images (JPG, PNG), Videos (MP4), Audio (MP3) • Max 30MB per file</div>
      </div>
      <div id="uploadProgress" style="display:none;margin-top:12px">
        <div style="background:var(--warm);border-radius:10px;overflow:hidden;height:8px">
          <div id="uploadBar" style="height:100%;background:var(--amber);width:0%;transition:width .3s;border-radius:10px"></div>
        </div>
        <div id="uploadStatus" style="text-align:center;font-size:13px;color:var(--muted);margin-top:6px">Uploading...</div>
      </div>
    </div>
  </div>

  <div class="section-card" style="margin-bottom:20px">
    <div class="section-card-header">
      <span class="section-card-title">📝 Post to Community Feed</span>
      <span style="font-size:12px;color:var(--muted)">Official posts (from admin)</span>
    </div>
    <div style="padding:0 0 16px">
      <textarea id="officialPostText" placeholder="Write your post caption..." maxlength="1000"
        style="width:100%;border:1.5px solid var(--warm);border-radius:12px;padding:12px;font-size:14px;font-family:'DM Sans',sans-serif;resize:none;min-height:80px;outline:none;margin-bottom:12px"></textarea>
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <label style="cursor:pointer;display:flex;align-items:center;gap:6px;background:var(--cream);border:1.5px solid var(--warm);border-radius:10px;padding:8px 14px;font-size:13px;color:var(--muted)">
          📷 Attach Image
          <input type="file" id="officialImgInput" accept="image/*" style="display:none" onchange="previewOfficialMedia(this,'image')">
        </label>
        <label style="cursor:pointer;display:flex;align-items:center;gap:6px;background:var(--cream);border:1.5px solid var(--warm);border-radius:10px;padding:8px 14px;font-size:13px;color:var(--muted)">
          🎬 Attach Video
          <input type="file" id="officialVideoInput" accept="video/*" style="display:none" onchange="previewOfficialMedia(this,'video')">
        </label>
      </div>
      <div id="officialMediaPreview" style="display:none;margin-bottom:12px;position:relative;display:inline-block"></div>
      <div>
        <button onclick="submitOfficialPost()" style="background:var(--amber);color:#fff;border:none;border-radius:20px;padding:10px 28px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif" id="officialPostBtn">
          Post to Feed 🌸
        </button>
      </div>
    </div>
  </div>

  <div class="section-card">
    <div class="section-card-header">
      <span class="section-card-title">🖼 Uploaded Media</span>
      <span id="mediaCount" style="font-size:13px;color:var(--muted)"></span>
    </div>
    <div id="mediaGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;padding:4px 0 8px">
      <div style="text-align:center;padding:24px;color:var(--muted);grid-column:1/-1">⏳ Loading media...</div>
    </div>
  </div>

  <div class="section-card" style="margin-top:20px">
    <div class="section-card-header">
      <span class="section-card-title">📋 Official Posts</span>
    </div>
    <div id="officialPostsTable">
      <div style="text-align:center;padding:24px;color:var(--muted)">⏳ Loading...</div>
    </div>
  </div>`;

  // drag-drop style
  const dz = document.getElementById('uploadDropzone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor='var(--amber)'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor='var(--warm)'; });
  dz.addEventListener('drop', e => { e.preventDefault(); dz.style.borderColor='var(--warm)'; handleMediaFileDrop(e.dataTransfer.files); });

  await loadMedia();
  await loadOfficialPosts();
}

let officialMediaData = { img: null, video: null };

function previewOfficialMedia(input, type) {
  const f = input.files[0]; if(!f) return;
  if(f.size > 30*1024*1024) { alert('File must be under 30MB'); input.value=''; return; }
  const r = new FileReader();
  r.onload = e => {
    const data = e.target.result;
    if(type==='image') { officialMediaData.img=data; officialMediaData.video=null; document.getElementById('officialVideoInput').value=''; }
    else { officialMediaData.video=data; officialMediaData.img=null; document.getElementById('officialImgInput').value=''; }
    const prev = document.getElementById('officialMediaPreview');
    prev.style.display = 'inline-block';
    prev.innerHTML = type==='image'
      ? `<img src="${data}" style="max-width:200px;max-height:140px;border-radius:10px;object-fit:cover;display:block">
         <button onclick="clearOfficialMedia()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:13px">×</button>`
      : `<video src="${data}" style="max-width:220px;max-height:140px;border-radius:10px;display:block" controls></video>
         <button onclick="clearOfficialMedia()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:13px">×</button>`;
    prev.style.position='relative';
  };
  r.readAsDataURL(f);
}
function clearOfficialMedia(){officialMediaData={img:null,video:null};document.getElementById('officialMediaPreview').style.display='none';document.getElementById('officialMediaPreview').innerHTML='';document.getElementById('officialImgInput').value='';document.getElementById('officialVideoInput').value='';}

async function submitOfficialPost() {
  const txt = document.getElementById('officialPostText').value.trim();
  if(!txt && !officialMediaData.img && !officialMediaData.video) { showToast('Add text or media','error'); return; }
  const btn = document.getElementById('officialPostBtn');
  btn.disabled=true; btn.textContent='Posting...';
  try {
    await sb('community_posts', { method:'POST', body:JSON.stringify({
      author_email: 'admin@resinaurabypryia.com',
      author_name: '✨ Resin Aura By Priya',
      author_avatar: null,
      text: txt||null,
      image: officialMediaData.img||null,
      video: officialMediaData.video||null,
      likes:0, shares:0, comments_count:0,
      is_official: true,
      created_at: new Date().toISOString()
    })});
    document.getElementById('officialPostText').value='';
    clearOfficialMedia();
    showToast('Post published to community! 🌸');
    await loadOfficialPosts();
  } catch(e) { showToast('Error: '+e.message,'error'); }
  finally { btn.disabled=false; btn.textContent='Post to Feed 🌸'; }
}

async function loadOfficialPosts() {
  try {
    officialPosts = await sb('community_posts?is_official=eq.true&order=created_at.desc&limit=30');
    renderOfficialPosts();
  } catch(e) { document.getElementById('officialPostsTable').innerHTML='<div style="text-align:center;padding:16px;color:var(--muted)">Could not load posts</div>'; }
}

function renderOfficialPosts() {
  const el = document.getElementById('officialPostsTable');
  if(!officialPosts.length) { el.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted)">No official posts yet</div>'; return; }
  el.innerHTML=`<div class="table-wrap"><table>
    <thead><tr><th>Preview</th><th>Caption</th><th>Type</th><th>Likes</th><th>Comments</th><th>Date</th><th>Action</th></tr></thead>
    <tbody>${officialPosts.map(p=>{
      const date=new Date(p.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'});
      const preview=p.video?`<video src="${p.video}" style="width:60px;height:44px;border-radius:6px;object-fit:cover"></video>`
        :p.image?`<img src="${p.image}" style="width:60px;height:44px;border-radius:6px;object-fit:cover">`
        :`<div style="width:60px;height:44px;background:var(--warm);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px">📝</div>`;
      const type=p.video?'🎬 Video':p.image?'📷 Photo':'📝 Text';
      const cap=p.text?p.text.substring(0,60)+(p.text.length>60?'...':''):'—';
      return `<tr>
        <td>${preview}</td>
        <td style="font-size:13px;max-width:180px">${escAdm(cap)}</td>
        <td style="font-size:12px">${type}</td>
        <td style="text-align:center">${p.likes||0}</td>
        <td style="text-align:center">${p.comments_count||0}</td>
        <td style="font-size:12px;color:var(--muted)">${date}</td>
        <td><button class="btn-delete" onclick="adminDeleteOfficialPost('${p.id}')">Delete</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

async function adminDeleteOfficialPost(id) {
  if(!confirm('Delete this official post?')) return;
  try {
    await sb('community_posts?id=eq.'+id,{method:'DELETE',prefer:'return=minimal'});
    showToast('Post deleted');
    await loadOfficialPosts();
  } catch(e) { showToast('Error','error'); }
}

/* ── MEDIA LIBRARY ── */
async function loadMedia() {
  try {
    mediaItems = await sb('community_media?order=created_at.desc');
    renderMediaGrid();
  } catch(e) {
    // table might not exist yet — show empty state
    mediaItems=[];
    document.getElementById('mediaGrid').innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);grid-column:1/-1">No media yet. Upload your first file! 📁</div>';
    document.getElementById('mediaCount').textContent='0 files';
  }
}

function renderMediaGrid() {
  const grid = document.getElementById('mediaGrid');
  document.getElementById('mediaCount').textContent = mediaItems.length + ' files';
  if(!mediaItems.length) {
    grid.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);grid-column:1/-1">No media yet. Upload your first file! 📁</div>';
    return;
  }
  grid.innerHTML = mediaItems.map(m => {
    const isVideo = m.type==='video';
    const isAudio = m.type==='audio';
    const thumb = isVideo
      ? `<video src="${m.url}" style="width:100%;height:120px;object-fit:cover;border-radius:10px 10px 0 0;display:block;background:#000"></video>`
      : isAudio
      ? `<div style="width:100%;height:120px;background:linear-gradient(135deg,var(--brown),var(--amber));border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:center;font-size:36px">🎵</div>`
      : `<img src="${m.url}" style="width:100%;height:120px;object-fit:cover;border-radius:10px 10px 0 0;display:block">`;
    return `<div style="background:#fff;border-radius:12px;border:1px solid var(--warm);overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.06)">
      ${thumb}
      <div style="padding:8px">
        <div style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:6px" title="${escAdm(m.name)}">${escAdm(m.name)}</div>
        ${isAudio ? `<audio src="${m.url}" controls style="width:100%;height:28px;margin-bottom:6px"></audio>` : ''}
        <div style="display:flex;gap:4px">
          <button onclick="useMediaInPost('${m.url}','${m.type}')" style="flex:1;background:var(--amber-pale);color:var(--amber);border:1px solid var(--amber);border-radius:8px;padding:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Use in Post</button>
          <button onclick="deleteMedia('${m.id}')" style="background:none;border:1px solid #eee;border-radius:8px;padding:5px 8px;font-size:13px;cursor:pointer;color:var(--muted)">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function useMediaInPost(url, type) {
  // scroll up to official post section, pre-fill media
  document.getElementById('officialPostText').scrollIntoView({behavior:'smooth',block:'center'});
  if(type==='image') {
    officialMediaData={img:url,video:null};
    const prev=document.getElementById('officialMediaPreview');
    prev.style.cssText='display:inline-block;position:relative';
    prev.innerHTML=`<img src="${url}" style="max-width:200px;max-height:140px;border-radius:10px;object-fit:cover;display:block">
      <button onclick="clearOfficialMedia()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:13px">×</button>`;
  } else if(type==='video') {
    officialMediaData={img:null,video:url};
    const prev=document.getElementById('officialMediaPreview');
    prev.style.cssText='display:inline-block;position:relative';
    prev.innerHTML=`<video src="${url}" style="max-width:220px;max-height:140px;border-radius:10px;display:block" controls></video>
      <button onclick="clearOfficialMedia()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:13px">×</button>`;
  }
  showToast('Media selected for post ✓','info');
}

async function handleMediaFileDrop(files) { await uploadFiles(files); }
async function handleMediaUpload(input) { await uploadFiles(input.files); input.value=''; }

async function uploadFiles(files) {
  const prog = document.getElementById('uploadProgress');
  const bar  = document.getElementById('uploadBar');
  const stat = document.getElementById('uploadStatus');
  prog.style.display='block'; bar.style.width='0%';
  let done=0;
  for (const f of files) {
    if(f.size > 30*1024*1024) { showToast(f.name+' is over 30MB — skipped','error'); done++; continue; }
    stat.textContent = `Uploading ${done+1}/${files.length}: ${f.name}`;
    const type = f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'image';
    const b64 = await readFileB64(f);
    try {
      await sb('community_media', { method:'POST', body:JSON.stringify({
        name: f.name, type, url: b64, size: f.size, created_at: new Date().toISOString()
      })});
    } catch(e) { showToast('Upload failed: '+f.name,'error'); }
    done++;
    bar.style.width = Math.round(done/files.length*100)+'%';
  }
  stat.textContent = 'Done! ' + done + ' file(s) uploaded.';
  setTimeout(()=>{ prog.style.display='none'; bar.style.width='0%'; },2000);
  await loadMedia();
}

function readFileB64(file) {
  return new Promise((res,rej)=>{ const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsDataURL(file); });
}

async function deleteMedia(id) {
  if(!confirm('Delete this file?')) return;
  try{await sb('community_media?id=eq.'+id,{method:'DELETE',prefer:'return=minimal'});showToast('Deleted');await loadMedia();}
  catch(e){showToast('Error','error');}
}

/* ══════════════════════════════
   STORY ADMIN — full control
══════════════════════════════ */
let allAdminStories = [];

// Override renderCommunityPage to include stories tab
const _origRenderCommunity = renderCommunityPage;
async function renderCommunityPage() {
  const content = document.getElementById('communityContent');
  content.innerHTML = `
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      <button class="btn-add" onclick="showCommunityTab('posts',this)" id="ctabPosts" style="background:var(--amber)">📝 Posts</button>
      <button class="btn-add" onclick="showCommunityTab('stories',this)" id="ctabStories" style="background:var(--muted)">🌟 Stories</button>
    </div>
    <div id="communityTabContent"><div style="text-align:center;padding:40px;color:var(--muted)">⏳ Loading...</div></div>`;
  showCommunityTab('posts', document.getElementById('ctabPosts'));
}

async function showCommunityTab(tab, btn) {
  document.querySelectorAll('#communityContent .btn-add').forEach(b => b.style.background = 'var(--muted)');
  if(btn) btn.style.background = 'var(--amber)';
  const el = document.getElementById('communityTabContent');
  if(tab === 'posts') await renderAdminPosts(el);
  else await renderAdminStories(el);
}

async function renderAdminPosts(el) {
  el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted)">⏳ Loading posts...</div>';
  try {
    allCommunityPosts = await sb('community_posts?order=created_at.desc');
    if(!allCommunityPosts.length) { el.innerHTML = '<div class="section-card"><div class="empty-state"><div class="icon">🌸</div><p>No posts yet</p></div></div>'; return; }
    el.innerHTML = `<div class="section-card">
      <div class="section-card-header">
        <span class="section-card-title">Community Posts (${allCommunityPosts.length})</span>
        <a href="../community.html" target="_blank" class="btn-add" style="text-decoration:none">🌸 Open Feed</a>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Author</th><th>Post</th><th>Media</th><th>Likes</th><th>Comments</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>${renderCommunityRows()}</tbody>
      </table></div></div>`;
  } catch(e) { el.innerHTML = `<div class="section-card"><p style="color:var(--danger);padding:16px">${e.message}</p></div>`; }
}

async function renderAdminStories(el) {
  el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted)">⏳ Loading stories...</div>';
  try {
    allAdminStories = await sb('community_stories?order=created_at.desc&limit=100');
    if(!allAdminStories.length) { el.innerHTML = '<div class="section-card"><div class="empty-state"><div class="icon">🌟</div><p>No stories yet</p></div></div>'; return; }

    const now = new Date();
    el.innerHTML = `<div class="section-card">
      <div class="section-card-header">
        <span class="section-card-title">All Stories (${allAdminStories.length})</span>
        <span style="font-size:12px;color:var(--muted)">Admin can see all — users see only their own stats</span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Author</th><th>Preview</th><th>Type</th><th>❤️ Likes</th><th>💬 Comments</th><th>👁 Viewers</th><th>Posted</th><th>Expires</th><th>Action</th></tr></thead>
        <tbody>${allAdminStories.map(st => {
          const isExpired = new Date(st.expires_at) < now;
          const date = new Date(st.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'});
          const exp  = new Date(st.expires_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
          const preview = st.image
            ? `<img src="${st.image}" style="width:52px;height:72px;object-fit:cover;border-radius:6px;cursor:pointer" onclick="adminViewImg('${st.image.replace(/'/g,"\\'")}'">`
            : `<div style="width:52px;height:72px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;text-align:center;padding:4px;color:#fff;background:linear-gradient(135deg,#5a3e2b,#c06c2d)">${escAdm((st.text||'').substring(0,30))}</div>`;
          let viewers = []; try{ viewers=JSON.parse(st.viewers||'[]'); }catch(e){}
          return `<tr style="${isExpired?'opacity:.5':''}">
            <td>
              <strong style="font-size:13px">${escAdm(st.author_name||'?')}</strong>
              <div style="font-size:11px;color:var(--muted)">${escAdm(st.author_email||'')}</div>
              ${isExpired?'<span style="font-size:10px;color:#e74c3c;font-weight:600">EXPIRED</span>':'<span style="font-size:10px;color:#27ae60;font-weight:600">ACTIVE</span>'}
            </td>
            <td>${preview}</td>
            <td style="font-size:12px">${st.type==='text'?'✍️ Text':'📷 Photo'}</td>
            <td style="text-align:center">
              <strong>${st.likes||0}</strong>
            </td>
            <td style="text-align:center">
              <button onclick="adminViewStoryComments('${st.id}')" style="background:none;border:none;color:var(--amber);cursor:pointer;font-size:13px;font-weight:600">view →</button>
            </td>
            <td style="text-align:center" id="sv-${st.id}">
              <span style="color:var(--muted);font-size:12px">...</span>
            </td>
            <td style="font-size:11px;color:var(--muted)">${date}</td>
            <td style="font-size:11px;color:${isExpired?'#e74c3c':'var(--muted)'}">${exp}</td>
            <td><button class="btn-delete" onclick="adminDeleteStory('${st.id}')">Delete</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div></div>`;
  } catch(e) { el.innerHTML = `<div class="section-card"><p style="color:var(--danger);padding:16px">${e.message}</p></div>`; }
  // load viewer counts async
  setTimeout(()=>loadAdminStoryViewerCounts(),100);
}

async function adminViewStoryComments(storyId) {
  const modal = document.getElementById('orderModal');
  const box   = document.getElementById('orderModalBox');
  box.innerHTML = `<div class="modal-header"><h3>💬 Story Comments</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>
    <div style="text-align:center;padding:16px;color:var(--muted)">⏳ Loading...</div>`;
  modal.classList.add('show');
  try {
    const cs = await sb('story_comments?story_id=eq.'+storyId+'&order=created_at.asc');
    if(!cs.length) { box.innerHTML += '<p style="text-align:center;color:var(--muted);padding:12px">No comments yet</p>'; return; }
    const rows = cs.map(c => `
      <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--warm)">
        <div style="flex:1">
          <strong style="font-size:13px">${escAdm(c.author_name||'User')}</strong>
          <span style="font-size:11px;color:var(--muted);margin-left:6px">${escAdm(c.author_email||'')}</span>
          <p style="font-size:13px;color:var(--text);margin:4px 0">${escAdm(c.text)}</p>
          <span style="font-size:10px;color:var(--muted)">${new Date(c.created_at).toLocaleString('en-IN')}</span>
        </div>
        <button class="btn-delete" onclick="adminDeleteStoryComment('${c.id}','${storyId}')" style="align-self:flex-start;flex-shrink:0">Del</button>
      </div>`).join('');
    box.innerHTML = `<div class="modal-header"><h3>💬 Story Comments (${cs.length})</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>${rows}`;
  } catch(e) { box.innerHTML += `<p style="color:var(--danger);padding:12px">${e.message}</p>`; }
}

async function adminDeleteStoryComment(cid, storyId) {
  if(!confirm('Delete this comment?')) return;
  try {
    await sb('story_comments?id=eq.'+cid, {method:'DELETE', prefer:'return=minimal'});
    showToast('Comment deleted');
    await adminViewStoryComments(storyId);
  } catch(e) { showToast('Error','error'); }
}

async function adminViewStoryViewers(storyId) {
  const st = allAdminStories.find(s => s.id == storyId);
  let viewers = []; try{ viewers=JSON.parse(st?.viewers||'[]'); }catch(e){}
  const modal = document.getElementById('orderModal');
  const box   = document.getElementById('orderModalBox');
  box.innerHTML = `<div class="modal-header"><h3>👁 Story Viewers (${viewers.length})</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>
    ${!viewers.length ? '<p style="text-align:center;color:var(--muted);padding:16px">No viewers yet</p>' :
    viewers.map(v=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--warm)">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--warm);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--amber);overflow:hidden;flex-shrink:0">
        ${v.avatar?`<img src="${v.avatar}" style="width:100%;height:100%;object-fit:cover">`:v.name?v.name[0].toUpperCase():'?'}
      </div>
      <div><div style="font-size:13px;font-weight:500">${escAdm(v.name||v.email)}</div>
        <div style="font-size:11px;color:var(--muted)">${new Date(v.viewed_at).toLocaleString('en-IN')}</div></div>
    </div>`).join('')}`;
  modal.classList.add('show');
}

async function adminDeleteStory(id) {
  if(!confirm('Delete this story?')) return;
  try {
    await sb('story_comments?story_id=eq.'+id, {method:'DELETE', prefer:'return=minimal'}).catch(()=>{});
    await sb('community_stories?id=eq.'+id, {method:'DELETE', prefer:'return=minimal'});
    showToast('Story deleted');
    document.getElementById('ctabStories')?.click();
    await renderAdminStories(document.getElementById('communityTabContent'));
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

/* ══════════════════════════════
   ADMIN BROADCAST NOTIFICATIONS
══════════════════════════════ */
async function broadcastNotif(type, message, refId, refType){
  // get all users and send notification to each
  try {
    const users = await sb('users?select=email');
    const adminEmail = 'admin@resinaurabypryia.com';
    for(const u of users){
      if(!u.email || u.email === adminEmail) continue;
      await sb('notifications', {method:'POST', body:JSON.stringify({
        recipient_email: u.email,
        type,
        actor_name:   'Resin Aura By Priya ✨',
        actor_avatar: null,
        actor_email:  adminEmail,
        ref_id:       refId || null,
        ref_type:     refType || null,
        message,
        is_read:      false,
        created_at:   new Date().toISOString(),
      })});
    }
    showToast('Notification sent to all users ✓');
  } catch(e){ showToast('Error: '+e.message, 'error'); }
}

// Called when admin adds a new product — auto-broadcast
async function notifyNewProduct(productName, productId){
  await broadcastNotif('new_product', `launched a new product: "${productName}" 🎨`, productId, 'product');
}

// Admin can manually send offer/news from Settings
async function sendAdminBroadcast(){
  const msg   = document.getElementById('broadcastMsg')?.value.trim();
  const type  = document.getElementById('broadcastType')?.value || 'admin_news';
  if(!msg){ showToast('Enter a message','error'); return; }
  await broadcastNotif(type, msg, null, null);
  if(document.getElementById('broadcastMsg')) document.getElementById('broadcastMsg').value = '';
}

// Render broadcast section inside settings or a dedicated tab
function renderBroadcastPanel(){
  return `<div class="section-card" style="margin-top:20px">
    <div class="section-card-header"><span class="section-card-title">📢 Send Notification to All Users</span></div>
    <div style="padding:4px 0 12px">
      <select id="broadcastType" style="width:100%;border:1.5px solid var(--warm);border-radius:10px;padding:10px;font-size:13px;font-family:'DM Sans',sans-serif;margin-bottom:10px;outline:none">
        <option value="admin_news">📢 General News / Announcement</option>
        <option value="offer">🏷️ Offer / Discount</option>
        <option value="new_product">🎨 New Product Launch</option>
      </select>
      <textarea id="broadcastMsg" placeholder="e.g. 20% off on all resin items this weekend! 🎉" maxlength="200"
        style="width:100%;border:1.5px solid var(--warm);border-radius:10px;padding:10px;font-size:14px;font-family:'DM Sans',sans-serif;resize:none;min-height:80px;outline:none;margin-bottom:10px"></textarea>
      <button onclick="sendAdminBroadcast()" style="background:var(--amber);color:#fff;border:none;border-radius:20px;padding:10px 28px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">
        Send to All Users 📢
      </button>
    </div>
  </div>`;
}

// Patch renderSettingsPage to include broadcast
const _origSettings = typeof renderSettingsPage !== 'undefined' ? renderSettingsPage : null;
if(_origSettings){
  window.renderSettingsPage = async function(){
    await _origSettings();
    const sc = document.getElementById('settingsContent');
    if(sc) sc.insertAdjacentHTML('beforeend', renderBroadcastPanel());
  };
}


/* ══════════════════════════════
   STORY VIEWERS — from story_viewers table
══════════════════════════════ */
async function loadAdminStoryViewerCounts(){
  // load viewer counts for all stories in table
  const cells=document.querySelectorAll('[id^="sv-"]');
  for(const cell of cells){
    const storyId=cell.id.replace('sv-','');
    try{
      const res=await sb('story_viewers?story_id=eq.'+storyId+'&select=id,viewer_name,viewer_email,viewer_avatar,viewed_at');
      const count=res?res.length:0;
      cell.innerHTML=`<strong>${count}</strong>
        ${count>0?`<button onclick="adminViewStoryViewersNew('${storyId}')" style="background:none;border:none;color:var(--amber);cursor:pointer;font-size:11px;display:block;margin:2px auto">view →</button>`:''}`;
    }catch(e){ cell.innerHTML='<span style="color:var(--muted)">-</span>'; }
  }
}

async function adminViewStoryViewersNew(storyId){
  const modal=document.getElementById('orderModal');
  const box=document.getElementById('orderModalBox');
  box.innerHTML=`<div class="modal-header"><h3>👁 Story Viewers</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>
    <div style="text-align:center;padding:16px;color:var(--muted)">⏳ Loading...</div>`;
  modal.classList.add('show');
  try{
    const viewers=await sb('story_viewers?story_id=eq.'+storyId+'&order=viewed_at.asc');
    if(!viewers||!viewers.length){
      box.innerHTML=`<div class="modal-header"><h3>👁 Story Viewers (0)</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>
        <p style="text-align:center;color:var(--muted);padding:20px">No viewers yet</p>`;
      return;
    }
    box.innerHTML=`<div class="modal-header"><h3>👁 Story Viewers (${viewers.length})</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>`+
    viewers.map(v=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--warm)">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--warm);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--amber);overflow:hidden;flex-shrink:0">
        ${v.viewer_avatar?`<img src="${v.viewer_avatar}" style="width:100%;height:100%;object-fit:cover">`:v.viewer_name?v.viewer_name[0].toUpperCase():'?'}
      </div>
      <div>
        <div style="font-size:13px;font-weight:500">${escAdm(v.viewer_name||'?')}</div>
        <div style="font-size:11px;color:var(--muted)">${escAdm(v.viewer_email||'')}</div>
        <div style="font-size:10px;color:var(--muted)">${new Date(v.viewed_at).toLocaleString('en-IN')}</div>
      </div>
    </div>`).join('');
  }catch(e){
    box.innerHTML=`<div class="modal-header"><h3>👁 Story Viewers</h3><button class="btn-close" onclick="closeOrderModal()">×</button></div>
      <p style="color:var(--danger);padding:16px">${e.message}</p>`;
  }
}

/* ══════════════════════════════
   GAMES MANAGEMENT ADMIN
══════════════════════════════ */
async function renderGamesPage(){
  const el=document.getElementById('gamesContent');
  if(!el) return;
  
  // Load current prizes
  let prizes=[];
  try{ prizes=await sb('game_prizes?order=id.asc'); }catch(e){}
  
  const defaultPrizes=[
    {label:'5% OFF',weight:30,type:'coupon',value:'RESIN5',emoji:'🎁',active:true},
    {label:'10% OFF',weight:20,type:'coupon',value:'RESIN10',emoji:'🎊',active:true},
    {label:'Free Ship',weight:15,type:'coupon',value:'FREESHIP',emoji:'🚚',active:true},
    {label:'Try Again',weight:25,type:'none',value:'',emoji:'😅',active:true},
    {label:'15% OFF',weight:8,type:'coupon',value:'RESIN15',emoji:'💎',active:true},
    {label:'20% OFF',weight:2,type:'coupon',value:'RESIN20',emoji:'🏆',active:true},
  ];

  el.innerHTML=`
  <div class="section-card" style="margin-bottom:20px">
    <div class="section-card-header">
      <span class="section-card-title">🎯 Spin & Scratch Prizes</span>
      <button class="btn-add" onclick="saveGamePrizes()">Save Changes</button>
    </div>
    <p style="font-size:13px;color:var(--muted);padding:0 0 12px">Control what prizes appear on the Spin wheel and Scratch cards. Toggle active/inactive anytime.</p>
    <div id="prizesTable">
      <table>
        <thead><tr><th>Emoji</th><th>Label</th><th>Type</th><th>Coupon Code</th><th>Weight</th><th>Active</th></tr></thead>
        <tbody id="prizesTbody">
          ${(prizes.length?prizes:defaultPrizes).map((p,i)=>`
          <tr id="prow-${i}">
            <td><input type="text" value="${escAdm(p.emoji||'🎁')}" id="pEmoji-${i}" style="width:44px;text-align:center;border:1px solid var(--warm);border-radius:6px;padding:4px"></td>
            <td><input type="text" value="${escAdm(p.label||'')}" id="pLabel-${i}" style="width:90px;border:1px solid var(--warm);border-radius:6px;padding:4px;font-size:13px"></td>
            <td>
              <select id="pType-${i}" style="border:1px solid var(--warm);border-radius:6px;padding:4px;font-size:12px">
                <option value="coupon" ${p.type==='coupon'?'selected':''}>Coupon</option>
                <option value="none" ${p.type==='none'?'selected':''}>No Prize</option>
              </select>
            </td>
            <td><input type="text" value="${escAdm(p.value||p.code||'')}" id="pValue-${i}" placeholder="e.g. RESIN10" style="width:90px;border:1px solid var(--warm);border-radius:6px;padding:4px;font-size:12px;font-family:monospace"></td>
            <td><input type="number" value="${p.weight||10}" id="pWeight-${i}" min="1" max="100" style="width:50px;border:1px solid var(--warm);border-radius:6px;padding:4px;text-align:center"></td>
            <td style="text-align:center">
              <label style="cursor:pointer">
                <input type="checkbox" id="pActive-${i}" ${p.active!==false?'checked':''} style="width:16px;height:16px;cursor:pointer">
              </label>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:12px">
      <button onclick="addPrizeRow()" style="background:none;border:1.5px dashed var(--warm);border-radius:10px;padding:8px 16px;font-size:13px;color:var(--muted);cursor:pointer">+ Add Prize</button>
    </div>
  </div>

  <div class="section-card" style="margin-bottom:20px">
    <div class="section-card-header">
      <span class="section-card-title">📊 Game Scores</span>
    </div>
    <div id="gameScoresTable"><div style="text-align:center;padding:20px;color:var(--muted)">⏳ Loading...</div></div>
  </div>`;

  loadGameScores();
}

let prizeRowCount=6;
function addPrizeRow(){
  const i=prizeRowCount++;
  const tbody=document.getElementById('prizesTbody');
  const tr=document.createElement('tr');tr.id='prow-'+i;
  tr.innerHTML=`
    <td><input type="text" value="🎁" id="pEmoji-${i}" style="width:44px;text-align:center;border:1px solid var(--warm);border-radius:6px;padding:4px"></td>
    <td><input type="text" value="New Prize" id="pLabel-${i}" style="width:90px;border:1px solid var(--warm);border-radius:6px;padding:4px;font-size:13px"></td>
    <td><select id="pType-${i}" style="border:1px solid var(--warm);border-radius:6px;padding:4px;font-size:12px"><option value="coupon">Coupon</option><option value="none">No Prize</option></select></td>
    <td><input type="text" value="" id="pValue-${i}" placeholder="COUPON" style="width:90px;border:1px solid var(--warm);border-radius:6px;padding:4px;font-size:12px;font-family:monospace"></td>
    <td><input type="number" value="10" id="pWeight-${i}" min="1" max="100" style="width:50px;border:1px solid var(--warm);border-radius:6px;padding:4px;text-align:center"></td>
    <td style="text-align:center"><input type="checkbox" id="pActive-${i}" checked style="width:16px;height:16px"></td>`;
  tbody.appendChild(tr);
}

async function saveGamePrizes(){
  const prizes=[];
  for(let i=0;i<prizeRowCount;i++){
    const el=document.getElementById('prow-'+i);
    if(!el) continue;
    prizes.push({
      emoji:document.getElementById('pEmoji-'+i)?.value||'🎁',
      label:document.getElementById('pLabel-'+i)?.value||'Prize',
      type:document.getElementById('pType-'+i)?.value||'none',
      value:document.getElementById('pValue-'+i)?.value||'',
      weight:parseInt(document.getElementById('pWeight-'+i)?.value||'10'),
      active:document.getElementById('pActive-'+i)?.checked??true,
    });
  }
  try{
    // delete all and reinsert
    await sb('game_prizes?id=gt.0',{method:'DELETE',prefer:'return=minimal'}).catch(()=>{});
    for(const p of prizes){
      await sb('game_prizes',{method:'POST',body:JSON.stringify(p)});
    }
    showToast('Prizes saved! ✓');
  }catch(e){showToast('Error saving: '+e.message,'error');}
}

async function loadGameScores(){
  const el=document.getElementById('gameScoresTable');if(!el)return;
  try{
    const scores=await sb('game_scores?order=created_at.desc&limit=50');
    if(!scores?.length){el.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted)">No scores yet</div>';return;}
    const gameNames={spin:'🎯 Spin',scratch:'🎰 Scratch',catch:'🪣 Catch',quiz:'🔤 Quiz',colormix:'🎨 Color'};
    el.innerHTML=`<div class="table-wrap"><table>
      <thead><tr><th>Player</th><th>Game</th><th>Score</th><th>Date</th></tr></thead>
      <tbody>${scores.map(s=>`<tr>
        <td><strong style="font-size:13px">${escAdm(s.player_name)}</strong><div style="font-size:11px;color:var(--muted)">${escAdm(s.player_email||'Guest')}</div></td>
        <td>${gameNames[s.game]||s.game}</td>
        <td><strong style="color:var(--amber)">${s.score}</strong></td>
        <td style="font-size:11px;color:var(--muted)">${new Date(s.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
      </tr>`).join('')}
      </tbody></table></div>`;
  }catch(e){el.innerHTML=`<div style="color:var(--danger);padding:16px">${e.message}</div>`;}
}
