// ═══════════════════════════════════════════
// SUPABASE CONFIG — edit only this file
// ═══════════════════════════════════════════
const SB_URL = 'https://qylcnaygpamgzdaokdku.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bGNuYXlncGFtZ3pkYW9rZGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTQyNjgsImV4cCI6MjA5MzMzMDI2OH0._JDbEt1gcUpV4TgZpUJrPuEw0EGnF-j6chmCMyOxlGE';

async function sb(path, opt = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': opt.prefer || 'return=representation',
      ...(opt.headers || {})
    },
    ...opt
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const t = await res.text();
  return t ? JSON.parse(t) : [];
}

const DB = {
  // Products — with localStorage cache (10 min TTL)
  getProducts: async () => {
    try {
      const raw = localStorage.getItem('resign_prod_cache');
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < 10 * 60 * 1000 && data && data.length) return data;
      }
    } catch {}
    const data = await sb('products?order=id.asc');
    try { if (data && data.length) localStorage.setItem('resign_prod_cache', JSON.stringify({ data, ts: Date.now() })); } catch {}
    return data;
  },
  addProduct:    (p)     => { localStorage.removeItem('resign_prod_cache'); return sb('products', { method:'POST', body:JSON.stringify(p) }); },
  updateProduct: (id, p) => { localStorage.removeItem('resign_prod_cache'); return sb('products?id=eq.'+id, { method:'PATCH', body:JSON.stringify(p) }); },
  deleteProduct: (id)    => { localStorage.removeItem('resign_prod_cache'); return sb('products?id=eq.'+id, { method:'DELETE', prefer:'return=minimal' }); },

  // Orders
  getOrders:      ()         => sb('orders?order=created_at.desc'),
  getMyOrders:    (email)    => sb('orders?customer_email=eq.'+encodeURIComponent(email)+'&order=created_at.desc'),
  addOrder:       (o)        => sb('orders', { method:'POST', body:JSON.stringify(o) }),
  updateOrder:    (id, o)    => sb('orders?id=eq.'+id, { method:'PATCH', body:JSON.stringify(o) }),
  deleteOrder:    (id)       => sb('orders?id=eq.'+id, { method:'DELETE', prefer:'return=minimal' }),
  deleteAllOrders:()         => sb('orders?created_at=gte.2000-01-01', { method:'DELETE', prefer:'return=minimal' }),

  // Users
  findUser:       (email)    => sb('users?email=eq.'+encodeURIComponent(email)).then(r => r[0]||null),
  addUser:        (u)        => sb('users', { method:'POST', body:JSON.stringify(u) }),
  updateUser:     (email, u) => sb('users?email=eq.'+encodeURIComponent(email), { method:'PATCH', body:JSON.stringify(u) }),
  deleteUser:     (email)    => sb('users?email=eq.'+encodeURIComponent(email), { method:'DELETE', prefer:'return=minimal' }),

  // Reviews
  getApprovedReviews: ()     => sb('reviews?approved=eq.true&order=created_at.desc'),
  getMyReviews:   (email)    => sb('reviews?customer_email=eq.'+encodeURIComponent(email)+'&order=created_at.desc'),
  addReview:      (r)        => sb('reviews', { method:'POST', body:JSON.stringify(r) }),
  deleteReview:   (id)       => sb('reviews?id=eq.'+id, { method:'DELETE', prefer:'return=minimal' }),

  // Admin
  getAdminCreds:  ()         => sb('admin_settings?key=in.(admin_id,admin_password)'),
  updateAdminPass:(val)      => sb('admin_settings?key=eq.admin_password', { method:'PATCH', body:JSON.stringify({value:val}) }),

  // QR codes — stored in admin_settings as base64
  getQR:    (name)   => sb('admin_settings?key=eq.qr_'+name).then(r => r[0]?.value||null),
  setQR:    (name,v) => sb('admin_settings?key=eq.qr_'+name).then(r =>
    r[0] ? sb('admin_settings?key=eq.qr_'+name, {method:'PATCH', body:JSON.stringify({value:v})})
          : sb('admin_settings', {method:'POST', body:JSON.stringify({key:'qr_'+name, value:v})})
  ),
};

// Local helpers
const SS_KEY    = 'resign_session';
const CART_KEY  = 'resign_cart';
const THEME_KEY = 'resign_theme';
const ADMIN_SS  = 'resign_admin_session';
const getSession    = () => { try { return JSON.parse(localStorage.getItem(SS_KEY)) || null; } catch { return null; } };
const saveSession   = (d) => localStorage.setItem(SS_KEY, JSON.stringify(d));
const getCart       = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } };
const saveCart      = (d) => localStorage.setItem(CART_KEY, JSON.stringify(d));
const getTheme      = () => localStorage.getItem(THEME_KEY) || 'default';
const saveTheme     = (t) => localStorage.setItem(THEME_KEY, t);
const getAdminSess  = () => localStorage.getItem(ADMIN_SS) === 'true';
const saveAdminSess = (v) => v ? localStorage.setItem(ADMIN_SS,'true') : localStorage.removeItem(ADMIN_SS);
