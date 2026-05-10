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
  const titles={dashboard:'Dashboard',products:'Products',orders:'Orders',reviews:'Reviews',settings:'Settings',community:'🌸 Community Feed'};
  document.getElementById('topbarTitle').textContent=titles[name]||name;
  if(name==='products')  renderProductTable();
  if(name==='orders')    renderOrderTable();
  if(name==='reviews')   renderReviewsTable();
  if(name==='dashboard') renderDashboard();
  if(name==='settings')  renderSettingsPage();
  if(name==='community') renderCommunityPage();
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
