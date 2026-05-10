// ═══════════════════════════════════════════
// MAIN.JS — Products, Cart, Orders, Profile
// ═══════════════════════════════════════════
'use strict';

let allProducts = [], currentCat = 'all', currentOrderProduct = null;

const STEPS = ['Pending','Confirmed','Shipped','Delivered'];
const STEP_ICONS = { Pending:'🕐', Confirmed:'✅', Shipped:'🚚', Delivered:'🎉' };
const QR_DATA = [
  { id:'phonepe', label:'PhonePe', color:'#5f259f' },
  { id:'gpay',    label:'GPay',    color:'#1a73e8' },
  { id:'paytm',   label:'Paytm',   color:'#002970' },
];
let activeQR = 'phonepe';

/* ══════════════════════════════
   PARTICLES
══════════════════════════════ */
function createParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const wrap = document.createElement('div');
  wrap.className = 'particles';
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const s = Math.random()*10+4;
    p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;bottom:0;animation-duration:${Math.random()*8+7}s;animation-delay:${Math.random()*6}s;opacity:${Math.random()*0.3+0.1};`;
    wrap.appendChild(p);
  }
  hero.insertBefore(wrap, hero.firstChild);
}

/* ══════════════════════════════
   THEME
══════════════════════════════ */
const THEMES = {
  default: { '--amber':'#c06c2d','--amber-light':'#e8956d','--amber-pale':'#fde8d8','--brown':'#5a3e2b','--cream':'#fdf6ee','--warm':'#f5ebe0' },
  rose:    { '--amber':'#c2185b','--amber-light':'#f06292','--amber-pale':'#fce4ec','--brown':'#880e4f','--cream':'#fdf0f5','--warm':'#fce4ec' },
  teal:    { '--amber':'#00796b','--amber-light':'#4db6ac','--amber-pale':'#e0f2f1','--brown':'#004d40','--cream':'#f0faf9','--warm':'#e0f2f1' },
  purple:  { '--amber':'#7b1fa2','--amber-light':'#ce93d8','--amber-pale':'#f3e5f5','--brown':'#4a148c','--cream':'#faf5ff','--warm':'#f3e5f5' },
};

function applyTheme(name) {
  const t = THEMES[name] || THEMES.default;
  Object.entries(t).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
  saveTheme(name);
}
function initTheme() { applyTheme(getTheme()); }

/* ══════════════════════════════
   PRODUCTS
══════════════════════════════ */
async function loadProducts() {
  try {
    let data = await DB.getProducts();
    if (!data || !data.length) { await seedProducts(); data = await DB.getProducts(); }
    allProducts = data;
  } catch(e) { console.error('Products load error:', e); allProducts = []; }
}

async function seedProducts() {
  const list = [
    {name:"Resin Wall Clock",price:1800,category:"Home Décor",description:"Handcrafted resin wall clock with beautiful patterns. A perfect statement piece for your home.",image:"uploads/Resin_Wall_Clock.jpeg",variants:[]},
    {name:"Ocean Frame",price:1200,category:"Frames",description:"Stunning ocean-inspired resin photo frame with blue and gold leaf accents.",image:"uploads/Ocean frame.jpeg",variants:[]},
    {name:"Dried Flower Resin Frame",price:1500,category:"Frames",description:"Elegant frame with real dried flowers preserved in clear resin. A timeless piece of art.",image:"uploads/Dried Flower Resin Frame.jpeg",variants:[]},
    {name:"Resin Flower Frame",price:1400,category:"Frames",description:"Beautiful resin frame featuring delicate flower patterns. Perfect for gifting.",image:"uploads/Resin Flower frame.jpeg",variants:[]},
    {name:"Couple Frame",price:1600,category:"Frames",description:"A romantic resin couple frame — ideal wedding or anniversary gift.",image:"uploads/Couple frame.jpeg",variants:[]},
    {name:"Wedding Photo Frame",price:1800,category:"Frames",description:"Exquisite wedding photo frame with resin floral border.",image:"uploads/Wedding_Photo_Frame.jpeg",variants:[]},
    {name:"Birthday Frame",price:1300,category:"Frames",description:"Colourful birthday frame crafted with resin and glitter.",image:"uploads/Birthday frame.jpeg",variants:[]},
    {name:"Anniversary Frame",price:1500,category:"Frames",description:"Celebrate love with this anniversary resin frame, handcrafted with care.",image:"uploads/Anniversary.jpeg",variants:[]},
    {name:"Photo Frame",price:1100,category:"Frames",description:"Classic handmade resin photo frame with unique textures.",image:"uploads/Photo frame.jpeg",variants:[]},
    {name:"Bracelet",price:650,category:"Jewellery",description:"Lightweight resin bracelet with floral inclusions. Elegant and unique.",image:"uploads/Bracelet.jpeg",variants:[]},
    {name:"Bracelet (Gold Leaf)",price:750,category:"Jewellery",description:"Handmade resin bracelet with shimmer gold leaf inclusions.",image:"uploads/Bracelet1.jpeg",variants:[]},
    {name:"Bracelet (Floral)",price:700,category:"Jewellery",description:"Delicate resin bracelet featuring preserved flower petals.",image:"uploads/Bracelet2.jpeg",variants:[]},
    {name:"Bangles",price:800,category:"Jewellery",description:"Set of handmade resin bangles in vibrant colours.",image:"uploads/Bangles.jpeg",variants:[]},
    {name:"Earrings",price:550,category:"Jewellery",description:"Lightweight resin drop earrings with flower inclusions.",image:"uploads/Earrings.jpeg",variants:[]},
    {name:"Earrings (Coloured)",price:600,category:"Jewellery",description:"Vibrant handmade resin earrings with multi-colour swirls.",image:"uploads/Earrings1.jpeg",variants:[]},
    {name:"Resin Pendant",price:700,category:"Jewellery",description:"Beautifully crafted resin pendant with floral design.",image:"uploads/Resin Pendant.jpeg",variants:[]},
    {name:"Pendent",price:650,category:"Jewellery",description:"Handmade resin pendant with unique abstract design.",image:"uploads/pendent.jpeg",variants:[]},
    {name:"Ring",price:500,category:"Jewellery",description:"Handcrafted resin ring with floral inclusion. Adjustable.",image:"uploads/Ring.jpeg",variants:[]},
    {name:"Name Keychain",price:400,category:"Keychains",description:"Personalised resin keychain with your name.",image:"uploads/Name keychain.jpeg",variants:[]},
    {name:"Resin Letter Keychain",price:450,category:"Keychains",description:"Handmade resin initial letter keychain.",image:"uploads/Resin Letter Keychain.jpeg",variants:[]},
    {name:"Key Holder",price:600,category:"Home Décor",description:"Resin wall key holder with multiple hooks.",image:"uploads/Key holder.jpeg",variants:[]},
    {name:"Resin Tray",price:1200,category:"Home Décor",description:"Elegant resin serving tray with marble-like swirl pattern.",image:"uploads/Resin Tray.jpeg",variants:[]},
    {name:"Coaster",price:700,category:"Home Décor",description:"Set of resin coasters with floral and marble patterns.",image:"uploads/Coaster.jpeg",variants:[]},
    {name:"Pen Stand",price:800,category:"Home Décor",description:"Handmade resin pen stand with elegant design.",image:"uploads/Pen stand.jpeg",variants:[]},
    {name:"Ashtray",price:900,category:"Home Décor",description:"Unique handcrafted resin ashtray.",image:"uploads/Ashtray.jpeg",variants:[]},
    {name:"Resin Table Top",price:3500,category:"Home Décor",description:"Premium resin table top with stunning geode-like design.",image:"uploads/Resin table top.jpeg",variants:[]},
    {name:"Resin Initial Letters",price:600,category:"Home Décor",description:"Decorative resin initial letters. Personalised and beautiful.",image:"uploads/Resin Initial Letters.jpeg",variants:[]},
    {name:"Name Plate",price:850,category:"Home Décor",description:"Custom resin name plate for your home or office.",image:"uploads/Name plate.jpeg",variants:[]},
    {name:"Gold Leaf Resin",price:2200,category:"Home Décor",description:"Premium gold leaf resin art piece.",image:"uploads/Gold leaf resin.jpeg",variants:[]},
    {name:"Book Mark",price:199,category:"Gifts",description:"Handmade resin bookmark with floral design. Perfect for book lovers.",image:"uploads/Book mark.jpeg",variants:[{label:"Normal",price:199},{label:"With Tassel",price:249}]},
  ];
  for (const p of list) { try { await DB.addProduct(p); } catch(e) {} }
}

/* ══════════════════════════════
   CATEGORY BAR
══════════════════════════════ */
function buildCatBar() {
  const cats = ['all', ...new Set(allProducts.map(p => p.category))];
  document.getElementById('catBar').innerHTML = cats.map(c =>
    `<button class="cat-btn${c===currentCat?' active':''}" onclick="filterCat('${c}',this)">${c==='all'?'All':c}</button>`
  ).join('');
}
function filterCat(cat, btn) {
  currentCat = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn && btn.classList.add('active');
  document.getElementById('sectionTitle').textContent = cat==='all' ? 'All Products' : cat;
  renderProducts();
}

/* ══════════════════════════════
   RENDER PRODUCTS
══════════════════════════════ */
function renderProducts() {
  const q = (document.getElementById('searchInput')?.value||'').toLowerCase();
  let list = allProducts;
  if (currentCat !== 'all') list = list.filter(p => p.category === currentCat);
  if (q) list = list.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description||'').toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );
  const grid = document.getElementById('productsGrid');
  if (!list.length) {
    grid.innerHTML = `<div class="no-products"><div style="font-size:44px;margin-bottom:12px">🔍</div><p>No products found</p></div>`;
    return;
  }
  grid.innerHTML = list.map((p, i) => {
    const vars = p.variants || [];
    const minP = vars.length ? Math.min(...vars.map(v=>v.price)) : p.price;
    const priceHtml = vars.length ? `<span class="price-from">from </span>₹${minP}` : `₹${p.price}`;
    return `<div class="product-card" onclick="openDetail(${p.id})" style="animation-delay:${i*0.04}s">
      <div class="product-img-wrap">
        <img class="product-img" src="${p.image||''}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
        <span class="product-cat-tag">${p.category}</span>
        ${vars.length>1 ? `<span class="variant-tag">${vars.length} options</span>` : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description||''}</div>
        <div class="product-footer">
          <span class="product-price">${priceHtml}</span>
          <button class="btn-cart" onclick="event.stopPropagation();quickAdd(${p.id})">+🛒</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════
   PRODUCT DETAIL MODAL
══════════════════════════════ */
function openDetail(id) {
  const p = allProducts.find(x => x.id===id); if (!p) return;
  const vars = p.variants || [];
  document.getElementById('detailModalBox').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <span style="background:var(--amber-pale);color:var(--amber);font-size:10px;font-weight:700;border-radius:8px;padding:3px 12px;text-transform:uppercase">${p.category}</span>
      <button class="btn-close" onclick="closeDetail()">×</button>
    </div>
    <div class="product-detail-grid">
      <img class="product-detail-img" src="${p.image||''}" alt="${p.name}" onerror="this.style.background='var(--warm)'">
      <div class="product-detail-info">
        <div class="product-detail-name">${p.name}</div>
        <div class="product-detail-price" id="dPrice">₹${vars.length ? vars[0].price : p.price}</div>
        <div class="product-detail-desc">${p.description||''}</div>
        ${vars.length ? `
          <div class="variant-section">
            <div class="variant-label">Choose Option:</div>
            <div class="variant-options" id="variantOpts">
              ${vars.map((v,i) => `
                <button class="variant-btn${i===0?' selected':''}" onclick="pickVariant(this,${v.price},'${v.label}')">
                  <span class="v-name">${v.label}</span>
                  <span class="v-price">₹${v.price}</span>
                </button>`).join('')}
            </div>
          </div>` : ''}
        <button class="btn-buynow" onclick="buyNowFromDetail(${p.id})">Buy Now</button>
        <button class="btn-addcart-detail" onclick="addToCartFromDetail(${p.id})">Add to Cart 🛒</button>
      </div>
    </div>`;
  document.getElementById('detailModal').classList.add('show');
  document.getElementById('overlay').classList.add('show');
}

// Get currently selected variant from detail modal
function getDetailVariant(pid) {
  const p = allProducts.find(x => x.id===pid);
  if (!p) return null;
  const vars = p.variants || [];
  if (!vars.length) return null;
  const sel = document.querySelector('#variantOpts .variant-btn.selected');
  if (!sel) return vars[0];
  return { label: sel.querySelector('.v-name').textContent, price: parseInt(sel.querySelector('.v-price').textContent.replace('₹','')) };
}

function pickVariant(btn, price, label) {
  document.querySelectorAll('#variantOpts .variant-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('dPrice').textContent = '₹' + price;
}

function buyNowFromDetail(pid) {
  const p = allProducts.find(x => x.id===pid); if (!p) return;
  const variant = getDetailVariant(pid);
  closeDetail();
  currentOrderProduct = { isCart:false, product:p, variant, total: variant ? variant.price : p.price };
  showOrderModal();
}

function addToCartFromDetail(pid) {
  const p = allProducts.find(x => x.id===pid); if (!p) return;
  const vars = p.variants || [];
  if (vars.length > 1) {
    const variant = getDetailVariant(pid);
    addToCart(pid, variant);
  } else {
    addToCart(pid, vars.length===1 ? vars[0] : null);
  }
  closeDetail();
}

function closeDetail() {
  document.getElementById('detailModal').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

/* ══════════════════════════════
   CART
══════════════════════════════ */
function quickAdd(id) {
  const p = allProducts.find(x => x.id===id); if (!p) return;
  const vars = p.variants || [];
  if (vars.length > 1) {
    openDetail(id);
    showToast('Please choose an option first 👆', 'info');
    return;
  }
  addToCart(id, vars.length===1 ? vars[0] : null);
}

function addToCart(id, variant=null) {
  const p = allProducts.find(x => x.id===id); if (!p) return;
  let cart = getCart();
  const key = `${id}_${variant ? variant.label : 'default'}`;
  const ex = cart.find(c => c.key===key);
  if (ex) ex.qty++;
  else cart.push({ key, id, qty:1, variantLabel: variant ? variant.label : null, price: variant ? variant.price : p.price });
  saveCart(cart);
  updateCartBadge();
  showToast(`${p.name}${variant?' ('+variant.label+')':''} added 🛒`);
}

function updateCartBadge() {
  const total = getCart().reduce((s,c) => s+c.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  badge.textContent = total;
  badge.classList.add('pop');
  setTimeout(() => badge.classList.remove('pop'), 300);
}

function openCart() {
  renderCart();
  document.getElementById('cartDrawer').classList.add('show');
  document.getElementById('overlay').classList.add('show');
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

function renderCart() {
  const cart = getCart();
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>Your cart is empty</p></div>`;
    footer.style.display = 'none';
    return;
  }
  let total = 0;
  body.innerHTML = cart.map(c => {
    const p = allProducts.find(x => x.id===c.id);
    if (!p) return '';
    total += c.price * c.qty;
    return `<div class="cart-item">
      <img class="cart-item-img" src="${p.image||''}" alt="${p.name}" onerror="this.style.display='none'">
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        ${c.variantLabel ? `<div class="cart-item-variant">${c.variantLabel}</div>` : ''}
        <div class="cart-item-price">₹${c.price} × ${c.qty}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${c.key}',-1)">−</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty('${c.key}',1)">+</button>
        </div>
      </div>
      <button class="btn-remove" onclick="rmCart('${c.key}')">🗑</button>
    </div>`;
  }).join('');
  document.getElementById('cartTotal').textContent = '₹' + total;
  footer.style.display = 'block';
}

function changeQty(key, d) {
  let cart = getCart();
  const item = cart.find(c => c.key===key);
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) cart = cart.filter(c => c.key!==key);
  saveCart(cart); updateCartBadge(); renderCart();
}
function rmCart(key) { saveCart(getCart().filter(c => c.key!==key)); updateCartBadge(); renderCart(); }

function checkoutCart() {
  const cart = getCart(); if (!cart.length) return;
  let total = 0;
  const items = cart.map(c => {
    const p = allProducts.find(x => x.id===c.id);
    total += c.price * c.qty;
    return { name: p.name, variant: c.variantLabel||null, price: c.price, qty: c.qty };
  });
  currentOrderProduct = { isCart:true, items, total };
  closeCart();
  showOrderModal();
}

/* ══════════════════════════════
   ORDER MODAL
══════════════════════════════ */
function showOrderModal() {
  const s = getSession();
  let summary = '';
  if (currentOrderProduct.isCart) {
    summary = currentOrderProduct.items.map(i =>
      `<div class="order-summary-row"><span>${i.name}${i.variant?' ('+i.variant+')':''} ×${i.qty}</span><span>₹${i.price*i.qty}</span></div>`
    ).join('') + `<div class="order-summary-row total"><span>Subtotal</span><span>₹${currentOrderProduct.total}</span></div>`;
  } else {
    const p = currentOrderProduct.product, v = currentOrderProduct.variant;
    summary = `<div class="order-summary-row"><span>${p.name}${v?' ('+v.label+')':''}</span><span>₹${currentOrderProduct.total}</span></div>
      <div class="order-summary-row total"><span>Total</span><span>₹${currentOrderProduct.total}</span></div>`;
  }

  const qrTabs = QR_DATA.map(q =>
    `<button class="qr-tab${q.id===activeQR?' active':''}" onclick="switchQR('${q.id}')">${q.label}</button>`
  ).join('');

  document.getElementById('orderModalBox').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <h2>Place Order</h2><button class="btn-close" onclick="closeOrder()">×</button>
    </div>
    <div class="modal-product-name">${currentOrderProduct.isCart?'Cart Order':currentOrderProduct.product.name}</div>
    <div class="order-summary">${summary}</div>
    <div class="delivery-notice">🚚 <strong>Delivery charges not included.</strong> Confirmed based on your location before dispatch.</div>
    <div class="payment-section">
      <div class="payment-title">💳 Pay via UPI <span style="font-weight:400;color:var(--muted);font-size:12px">(optional — pay after confirmation too)</span></div>
      <div class="qr-tabs">${qrTabs}</div>
      <div class="qr-display" id="qrDisplay">${renderQRBox(activeQR)}</div>
      <div class="form-group" style="margin-top:10px">
        <label>UTR / Transaction ID <span style="font-size:11px;font-weight:400;color:var(--muted)">— enter after payment</span></label>
        <input type="text" id="oUTR" placeholder="e.g. 123456789012 (leave blank to pay later)">
      </div>
    </div>
    <div class="booking-note"><strong>📦 How it works</strong>Order → Advance pay(Not Mandatory) → confirm in 24 hrs → handcrafted in 5–7 days → pay UPI or cash on delivery.</div>
    ${s ? `<div class="autofill-note">✅ Logged in as <strong>${s.name}</strong> — details filled automatically.</div>` : ''}
    <div class="form-group"><label>Your Name *</label><input type="text" id="oName" value="${s?s.name:''}" placeholder="Full name"></div>
    <div class="form-group"><label>Phone Number *</label><input type="tel" id="oPhone" value="${s?.phone||''}" placeholder="10-digit number"></div>
    <div class="form-group"><label>Email <span style="font-weight:400;color:var(--muted)">(for order tracking)</span></label><input type="email" id="oEmail" value="${s?.email||''}" placeholder="optional"></div>
    <div class="form-group"><label>Delivery Address *</label><textarea id="oAddress" placeholder="Full delivery address with pin code"></textarea></div>
    <div class="form-group"><label>Special Instructions</label><textarea id="oNote" placeholder="Colour preference, custom text, size, etc."></textarea></div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeOrder()">Cancel</button>
      <button class="btn-place-order" id="placeBtn" onclick="placeOrder()">Confirm Order ✓</button>
    </div>`;
  document.getElementById('orderModal').classList.add('show');
}

// QR cache
const qrCache = {};

async function getQRImage(name) {
  if (qrCache[name] !== undefined) return qrCache[name];
  try {
    const val = await DB.getQR(name);
    qrCache[name] = val || null;
    return qrCache[name];
  } catch(e) { qrCache[name] = null; return null; }
}

function renderQRBox(id) {
  const q = QR_DATA.find(x => x.id===id);
  const amt = currentOrderProduct?.total || '';
  // async load QR
  setTimeout(async () => {
    const img = await getQRImage(id);
    const el = document.getElementById('qrImgWrap');
    if (!el) return;
    if (img) {
      el.innerHTML = `<img src="${img}" alt="${q.label} QR" style="width:160px;height:160px;border-radius:10px;object-fit:contain;background:#fff;border:1px solid #e0d0c0;">`;
    } else {
      el.innerHTML = `<div class="qr-placeholder">
        <div class="qr-icon">📷</div>
        <div style="font-weight:700;color:${q.color};margin-bottom:2px">${q.label} QR</div>
        <div style="font-size:11px;color:var(--muted)">Upload QR in<br>Admin → Settings</div>
      </div>`;
    }
  }, 0);

  return `<div style="text-align:center;padding:12px">
    <div id="qrImgWrap" style="display:flex;justify-content:center;margin-bottom:8px">
      <div class="qr-placeholder">
        <div class="qr-icon">⏳</div>
        <div style="font-size:11px;color:var(--muted)">Loading QR...</div>
      </div>
    </div>
    <div class="utr-note">Scan & pay ₹${amt} • then enter UTR number above</div>
  </div>`;
}
function switchQR(id) {
  activeQR = id;
  document.querySelectorAll('.qr-tab').forEach((t,i) => t.classList.toggle('active', QR_DATA[i].id===id));
  // Clear cache for fresh load when switching
  document.getElementById('qrDisplay').innerHTML = renderQRBox(id);
}
function closeOrder() { document.getElementById('orderModal').classList.remove('show'); }

async function placeOrder() {
  const name    = document.getElementById('oName')?.value.trim();
  const phone   = document.getElementById('oPhone')?.value.trim();
  const email   = document.getElementById('oEmail')?.value.trim();
  const address = document.getElementById('oAddress')?.value.trim();
  const note    = document.getElementById('oNote')?.value.trim();
  const utr     = document.getElementById('oUTR')?.value.trim();

  if (!name)                               { alert('Please enter your name.'); return; }
  if (!phone||!/^[0-9]{10}$/.test(phone)) { alert('Please enter a valid 10-digit phone number.'); return; }
  if (!address)                            { alert('Please enter your delivery address.'); return; }

  const btn = document.getElementById('placeBtn');
  if (btn) { btn.textContent = 'Placing...'; btn.disabled = true; }

  const s = getSession();
  const custEmail = (s ? s.email : '') || email || '';

  const order = {
    id:             'ORD' + Date.now(),
    date:           new Date().toLocaleString('en-IN'),
    customer_name:  name,
    phone,
    email:          email || '',
    address,
    note:           note || '',
    status:         'Pending',
    payment_status: utr ? 'Paid (Pending Verification)' : 'Pending',
    utr:            utr || '',
    customer_email: custEmail,
    items:          currentOrderProduct.isCart
      ? currentOrderProduct.items
      : [{ name: currentOrderProduct.product.name, variant: currentOrderProduct.variant?.label||null, price: currentOrderProduct.total, qty: 1 }],
    total:          currentOrderProduct.total,
    order_logs:     [{ time: new Date().toLocaleString('en-IN'), action: 'Order placed' + (utr ? ' | UPI UTR: '+utr : ' | Payment pending') }]
  };

  try {
    await DB.addOrder(order);
    if (currentOrderProduct.isCart) { saveCart([]); updateCartBadge(); }
    document.getElementById('orderModalBox').innerHTML = `
      <div class="order-success">
        <div class="success-icon">🎉</div>
        <h3>Order Placed!</h3>
        <p>Thank you, <strong>${name}</strong>!<br>
        Order ID: <strong>${order.id}</strong><br><br>
        ${utr ? `Payment noted (UTR: <strong>${utr}</strong>) — we'll verify shortly.` : `We'll contact you on <strong>${phone}</strong> within 24 hours.`} 💛</p>
        ${s ? '<p style="margin-top:10px;font-size:13px;color:var(--amber)">Track your order by tapping 👤 your name in the header!</p>' : '<p style="margin-top:8px;font-size:12px;color:var(--muted)">Register for easy order tracking next time!</p>'}
        <br><button class="btn-place-order" onclick="closeOrder()" style="width:100%">Continue Shopping</button>
      </div>`;
  } catch(e) {
    console.error('Order error:', e);
    alert('Something went wrong. Please try again.');
    if (btn) { btn.textContent = 'Confirm Order ✓'; btn.disabled = false; }
  }
}

/* ══════════════════════════════
   ORDER TRACKING
══════════════════════════════ */
async function openTracking() {
  const s = getSession(); if (!s) return;
  const box = document.getElementById('trackModalBox');
  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2>👤 My Orders</h2><button class="btn-close" onclick="closeTracking()">×</button>
    </div>
    <div style="text-align:center;padding:30px;color:var(--muted)">⏳ Loading your orders...</div>`;
  document.getElementById('trackModal').classList.add('show');
  document.getElementById('overlay').classList.add('show');
  try {
    const orders = await DB.getMyOrders(s.email);
    if (!orders.length) {
      box.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <h2>👤 My Orders</h2><button class="btn-close" onclick="closeTracking()">×</button>
        </div>
        <div style="text-align:center;padding:40px;color:var(--muted)">
          <div style="font-size:44px;margin-bottom:12px">📭</div>
          <p>No orders yet!</p><br>
          <button class="btn-place-order" onclick="closeTracking()" style="width:auto;padding:10px 24px">Start Shopping</button>
          <br><br><button onclick="openProfileModal()" style="background:none;border:none;color:var(--amber);font-size:13px;cursor:pointer;font-weight:600">⚙️ Account Settings</button>
        </div>`;
      return;
    }
    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h2>👤 My Orders</h2>
        <div style="display:flex;gap:8px;align-items:center">
          <button onclick="openProfileModal()" style="background:var(--amber-pale);border:none;color:var(--amber);font-size:12px;cursor:pointer;border-radius:8px;padding:5px 12px;font-weight:600;font-family:'DM Sans',sans-serif">⚙️ Profile</button>
          <button class="btn-close" onclick="closeTracking()">×</button>
        </div>
      </div>
      ${orders.map(o => buildOrderCard(o)).join('')}`;
  } catch(e) {
    box.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">
      <p>Could not load orders.</p><br>
      <button class="btn-place-order" onclick="closeTracking()" style="width:auto;padding:10px 24px">Close</button></div>`;
  }
}

function buildOrderCard(o) {
  const cancelled = o.status === 'Cancelled';
  const curIdx = STEPS.indexOf(o.status);
  const pct = cancelled ? 0 : Math.max(0, curIdx / (STEPS.length-1)) * 100;
  const logs = o.order_logs || [];

  const stepsHtml = STEPS.map((s, i) => {
    let dc='', lc='';
    if (!cancelled && i < curIdx)  { dc='done'; lc='done'; }
    if (!cancelled && i === curIdx) { dc='current'; lc='current'; }
    return `<div class="status-step">
      <div class="step-dot ${dc}">${(!cancelled && i<=curIdx) ? STEP_ICONS[s] : '○'}</div>
      <div class="step-label ${lc}">${s}</div>
    </div>`;
  }).join('');

  const fillStyle = pct===0 ? 'width:0' : pct===100 ? 'width:calc(100% - 40px)' : `width:calc(${pct}% - ${pct/2}px)`;
  const payColor = o.payment_status?.includes('Verified') ? '#2d7a4f' : o.payment_status?.includes('Verification') ? '#e67e22' : '#8c7060';

  return `<div class="order-track-card">
    <div class="order-track-header">
      <div>
        <div class="order-track-id">${o.id}</div>
        <div style="font-size:11px;color:var(--muted)">${o.date||''}</div>
        <div style="font-size:11px;font-weight:600;color:${payColor}">${o.payment_status||'Payment Pending'}</div>
      </div>
      <div class="order-track-total">₹${o.total}</div>
    </div>
    <div class="order-track-items">${(o.items||[]).map(i=>`${i.name}${i.variant?' ('+i.variant+')':''} ×${i.qty}`).join(' • ')}</div>
    ${cancelled
      ? `<div class="cancelled-bar">❌ Order Cancelled</div>`
      : `<div class="status-bar-wrap">
          <div class="status-bar-bg"></div>
          <div class="status-bar-fill" style="${fillStyle}"></div>
          <div class="status-steps">${stepsHtml}</div>
        </div>`}
    ${logs.length ? `
      <div class="order-log-section">
        <div class="order-log-title">📋 Activity</div>
        ${logs.map(l=>`<div class="log-entry"><div class="log-dot"></div>
          <div><span class="log-action">${l.action}</span>
          <span style="font-size:11px;color:var(--muted)"> • ${l.time}</span></div></div>`).join('')}
      </div>` : ''}
  </div>`;
}

function closeTracking() {
  document.getElementById('trackModal').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

/* ══════════════════════════════
   CUSTOMER PROFILE MODAL
══════════════════════════════ */
function openProfileModal() {
  const s = getSession(); if (!s) return;
  closeTracking();
  const theme = getTheme();
  document.getElementById('profileModalBox').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2>⚙️ My Account</h2><button class="btn-close" onclick="closeProfile()">×</button>
    </div>

    <!-- Profile Info -->
    <div style="background:var(--cream);border-radius:12px;padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:14px">
      <div style="position:relative;flex-shrink:0">

  <img 
    src="${s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}`}" 
    id="profileAvatar"
    style="
      width:54px;
      height:54px;
      border-radius:50%;
      object-fit:cover;
      border:2px solid var(--amber-pale);
      background:var(--cream);
    "
  >

  <label for="avatarUpload" style="
    position:absolute;
    bottom:-2px;
    right:-2px;
    width:22px;
    height:22px;
    border-radius:50%;
    background:var(--amber);
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    font-size:12px;
    border:2px solid #fff;
  ">
    ✎
  </label>

  <input 
    type="file" 
    id="avatarUpload" 
    accept="image/*" 
    style="display:none"
    onchange="uploadProfileAvatar(event)"
  >

</div>
      <div>
        <div style="font-weight:700;font-size:16px">${s.name}</div>
        <div style="font-size:12px;color:var(--muted)">${s.email}</div>
        <div style="font-size:12px;color:var(--muted)">${s.phone||''}</div>
      </div>
    </div>

    <!-- TABS -->
    <div style="display:flex;gap:0;border-bottom:2px solid var(--warm);margin-bottom:16px">
      ${['Orders','Reviews','Password','Theme','Account'].map((t,i)=>
        `<button onclick="switchProfileTab('${t.toLowerCase()}')" id="ptab-${t.toLowerCase()}"
          style="flex:1;padding:8px 4px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted);border-bottom:2.5px solid transparent;margin-bottom:-2px;transition:all .18s;${i===0?'color:var(--amber);border-bottom-color:var(--amber)':''}"
        >${t}</button>`).join('')}
    </div>
    <div id="profileContent"></div>`;

  document.getElementById('profileModal').classList.add('show');
  document.getElementById('overlay').classList.add('show');
  switchProfileTab('orders');
}

async function switchProfileTab(tab) {
  document.querySelectorAll('[id^="ptab-"]').forEach(b => {
    b.style.color = 'var(--muted)';
    b.style.borderBottomColor = 'transparent';
  });
  const active = document.getElementById('ptab-'+tab);
  if (active) { active.style.color='var(--amber)'; active.style.borderBottomColor='var(--amber)'; }

  const s = getSession();
  const content = document.getElementById('profileContent');

  if (tab === 'orders') {
    content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted)">⏳ Loading...</div>`;
    try {
      const orders = await DB.getMyOrders(s.email);
      if (!orders.length) { content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted)">📭 No orders yet.</div>`; return; }
      content.innerHTML = orders.map(o => buildOrderCard(o)).join('');
    } catch(e) { content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted)">Could not load orders.</div>`; }
  }

  else if (tab === 'reviews') {
    content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted)">⏳ Loading...</div>`;
    try {
      const reviews = await DB.getMyReviews(s.email);
      if (!reviews.length) {
        content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted)">
          <div style="font-size:36px;margin-bottom:8px">⭐</div>
          <p>You haven't written any reviews yet.</p>
          <br><button onclick="closeProfile();openReviewModal()" class="btn-place-order" style="width:auto;padding:10px 20px">Write a Review</button>
        </div>`;
        return;
      }
      content.innerHTML = reviews.map(r => `
        <div style="background:var(--cream);border-radius:12px;padding:14px;margin-bottom:10px;border:1px solid var(--warm)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div>
              <span style="font-size:14px">${'⭐'.repeat(r.rating||5)}</span>
              ${r.product_name?`<span style="font-size:11px;color:var(--amber);font-weight:600;margin-left:6px">— ${r.product_name}</span>`:''}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;background:${r.approved?'#e8f8f0':'#fef3e2'};color:${r.approved?'#2d7a4f':'#e67e22'}">${r.approved?'Published':'Pending'}</span>
              <button onclick="deleteMyReview(${r.id})" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:16px;line-height:1">🗑</button>
            </div>
          </div>
          ${r.comment?`<div style="font-size:13px;color:var(--text);font-style:italic">"${r.comment}"</div>`:''}
          ${r.photo?`<img src="${r.photo}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;margin-top:8px" onerror="this.style.display='none'">`:''}
        </div>`).join('');
    } catch(e) { content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted)">Could not load reviews.</div>`; }
  }

  else if (tab === 'password') {
    content.innerHTML = `
      <div class="form-group"><label>Current Password</label><input type="password" id="pCurrPass" placeholder="Current password"></div>
      <div class="form-group"><label>New Password</label><input type="password" id="pNewPass" placeholder="New password (min 6 chars)"></div>
      <div class="form-group"><label>Confirm New Password</label><input type="password" id="pConfPass" placeholder="Confirm new password"></div>
      <button class="btn-place-order" onclick="changeMyPassword()" style="width:100%">Update Password</button>`;
  }

  else if (tab === 'theme') {
    const cur = getTheme();
    content.innerHTML = `
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Choose a colour theme for your experience:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${[
          {id:'default',name:'Classic Amber',color:'#c06c2d'},
          {id:'rose',   name:'Rose Pink',   color:'#c2185b'},
          {id:'teal',   name:'Ocean Teal',  color:'#00796b'},
          {id:'purple', name:'Royal Purple',color:'#7b1fa2'},
        ].map(t=>`
          <button onclick="applyThemeAndSave('${t.id}')" style="
            padding:14px;border-radius:12px;border:2.5px solid ${cur===t.id?t.color:'#e0d0c0'};
            background:${cur===t.id?t.color+'20':'#fff'};cursor:pointer;
            font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;
            display:flex;align-items:center;gap:8px;transition:all .2s;">
            <span style="width:20px;height:20px;border-radius:50%;background:${t.color};flex-shrink:0"></span>
            ${t.name}${cur===t.id?' ✓':''}
          </button>`).join('')}
      </div>`;
  }

  else if (tab === 'account') {
    content.innerHTML = `
      <div style="background:#fde8e8;border-radius:12px;padding:16px;margin-bottom:14px">
        <div style="font-weight:700;color:#c0392b;margin-bottom:6px">⚠️ Delete Account</div>
        <p style="font-size:13px;color:#8c4040;line-height:1.6;margin-bottom:12px">This will permanently delete your account. This action cannot be undone.</p>
        <button onclick="deleteMyAccount()" style="background:#c0392b;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">
          Delete My Account
        </button>
      </div>
      <button onclick="doLogout()" style="width:100%;padding:11px;background:var(--warm);color:var(--brown);border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">
        🚪 Logout
      </button>`;
  }
}

function applyThemeAndSave(id) {
  applyTheme(id);
  switchProfileTab('theme'); // re-render to show checkmark
  showToast('Theme updated ✓');
}

async function changeMyPassword() {
  const s = getSession(); if (!s) return;
  const curr = document.getElementById('pCurrPass')?.value;
  const nw   = document.getElementById('pNewPass')?.value;
  const conf = document.getElementById('pConfPass')?.value;
  if (!curr||!nw||!conf) { alert('Please fill all fields.'); return; }
  if (nw.length < 6) { alert('New password must be at least 6 characters.'); return; }
  if (nw !== conf) { alert('Passwords do not match.'); return; }
  try {
    // Always fetch fresh from DB — never trust cached session for password check
    const user = await DB.findUser(s.email);
    if (!user) { alert('User not found. Please login again.'); return; }
    if (user.password !== curr) { alert('Current password is incorrect.'); return; }
    await DB.updateUser(s.email, { password: nw });
    document.getElementById('pCurrPass').value = '';
    document.getElementById('pNewPass').value  = '';
    document.getElementById('pConfPass').value = '';
    showToast('Password updated successfully ✓');
  } catch(e) {
    console.error('Password change error:', e);
    alert('Error updating password. Please try again.');
  }
}

async function deleteMyReview(id) {
  if (!confirm('Delete this review?')) return;
  try {
    await DB.deleteReview(id);
    showToast('Review deleted');
    switchProfileTab('reviews');
  } catch(e) { alert('Error deleting review.'); }
}

async function deleteMyAccount() {
  const s = getSession(); if (!s) return;
  if (!confirm(`Are you sure you want to delete your account (${s.email})? This cannot be undone.`)) return;
  const pass = prompt('Enter your password to confirm:');
  if (!pass) return;
  try {
    const user = await DB.findUser(s.email);
    if (!user||user.password!==pass) { alert('Incorrect password.'); return; }
    await DB.deleteUser(s.email);
    saveSession(null);
    updateUserBtn();
    closeProfile();
    showToast('Account deleted. Goodbye! 👋', 'info');
  } catch(e) { alert('Error deleting account.'); }
}

function doLogout() {
  if (!confirm('Logout?')) return;
  saveSession(null);
  updateUserBtn();
  closeProfile();
  showToast('Logged out');
}
async function uploadProfileAvatar(event) {

  const file = event.target.files[0];
  if (!file) return;

  // image size limit
  if (file.size > 2 * 1024 * 1024) {
    alert('Image must be under 2MB');
    return;
  }

  const reader = new FileReader();

  reader.onload = async function(e) {

    try {

      const base64 = e.target.result;

      const s = getSession();
      if (!s) return;

      // update database
      await DB.updateUser(s.email, {
        avatar: base64
      });

      // update session
      s.avatar = base64;
      saveSession(s);

      // update UI instantly
      const img = document.getElementById('profileAvatar');
      if (img) img.src = base64;

      showToast('Profile photo updated ✓');

    } catch(err) {

      console.error(err);
      alert('Error uploading image');

    }

  };

  reader.readAsDataURL(file);

}
function closeProfile() {
  document.getElementById('profileModal').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */
function closeAll() {
  closeCart(); closeDetail(); closeOrder(); closeTracking(); closeProfile();
  document.getElementById('authModal')?.classList.remove('show');
  document.getElementById('reviewModal')?.classList.remove('show');
  document.getElementById('overlay')?.classList.remove('show');
}

function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = type==='error'?'#c0392b' : type==='info'?'#2980b9' : 'var(--brown)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
function updateProductCount() {
  const el = document.getElementById('productCount');
  if (el && allProducts.length) el.textContent = allProducts.length + '+';
}

async function init() {
  initTheme();
  createParticles();
  updateCartBadge();
  updateUserBtn();

  // Step 1: Show cached products INSTANTLY (no network wait)
  try {
    const raw = localStorage.getItem('resign_prod_cache');
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (data && data.length) {
        allProducts = data;
        buildCatBar();
        renderProducts();
        updateProductCount();
      }
    }
  } catch {}

  // Step 2: Fetch fresh from Supabase in background
  try {
    const fresh = await sb('products?order=id.asc');
    if (fresh && fresh.length) {
      localStorage.setItem('resign_prod_cache', JSON.stringify({ data: fresh, ts: Date.now() }));
      // Only re-render if something changed
      if (fresh.length !== allProducts.length || fresh[0]?.id !== allProducts[0]?.id) {
        allProducts = fresh;
        buildCatBar();
        renderProducts();
      } else {
        allProducts = fresh;
      }
      updateProductCount();
    } else if (!allProducts.length) {
      // First time ever — seed default products
      document.getElementById('productsGrid').innerHTML =
        `<div class="no-products"><div style="font-size:40px">⏳</div><p>Setting up products...</p></div>`;
      await seedProducts();
      allProducts = await sb('products?order=id.asc');
      localStorage.setItem('resign_prod_cache', JSON.stringify({ data: allProducts, ts: Date.now() }));
      buildCatBar();
      renderProducts();
      updateProductCount();
    }
  } catch(e) {
    console.error('Products fetch error:', e);
    if (!allProducts.length) {
      document.getElementById('productsGrid').innerHTML =
        `<div class="no-products"><div style="font-size:40px">⚠️</div><p>Could not load products.<br>Check your internet connection.</p></div>`;
    }
  }

  // Reviews load separately — doesn't block anything
  loadAndRenderReviews();
}
init();
