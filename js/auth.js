// ═══════════════════════════════════════════
// AUTH.JS — Login, Register, Session
// ═══════════════════════════════════════════
'use strict';

function handleUserBtn() {
  const s = getSession();
  if (s) { openTracking(); }
  else   { switchTab('login'); document.getElementById('authModal').classList.add('show'); document.getElementById('overlay').classList.add('show'); }
}
function closeAuth() {
  document.getElementById('authModal').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

function switchTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab==='login');
  document.getElementById('tabRegister').classList.toggle('active', tab==='register');
  document.getElementById('authContent').innerHTML = tab==='login' ? `
    <div class="form-group"><label>Email</label><input type="email" id="lE" placeholder="your@email.com" autocomplete="email"></div>
    <div class="form-group"><label>Password</label><input type="password" id="lP" placeholder="Password" autocomplete="current-password"></div>
    <button class="btn-place-order" onclick="doLogin()" style="width:100%;margin-top:4px">Login</button>
    <p style="text-align:center;margin-top:12px;font-size:13px;color:var(--muted)">Don't have an account? <button onclick="switchTab('register')" style="background:none;border:none;color:var(--amber);cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif">Register</button></p>` : `
    <div class="form-group"><label>Full Name</label><input type="text" id="rN" placeholder="Your name"></div>
    <div class="form-group"><label>Email</label><input type="email" id="rE" placeholder="your@email.com"></div>
    <div class="form-group"><label>Phone Number</label><input type="tel" id="rPh" placeholder="10-digit number"></div>
    <div class="form-group"><label>Password</label><input type="password" id="rP" placeholder="Min 6 characters"></div>
    <button class="btn-place-order" onclick="doRegister()" style="width:100%;margin-top:4px">Create Account</button>
    <p style="text-align:center;margin-top:12px;font-size:13px;color:var(--muted)">Already registered? <button onclick="switchTab('login')" style="background:none;border:none;color:var(--amber);cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif">Login</button></p>`;
}

async function doLogin() {
  const email = document.getElementById('lE')?.value.trim();
  const pass  = document.getElementById('lP')?.value;
  if (!email||!pass) { alert('Please fill all fields.'); return; }
  try {
    const user = await DB.findUser(email);
    if (!user||user.password!==pass) { alert('Invalid email or password.'); return; }
    saveSession({ name:user.name, email:user.email, phone:user.phone, avatar:user.avatar||'' });
    updateUserBtn();
    closeAuth();
    showToast('Welcome back, ' + user.name + '! 👋');
  } catch(e) { alert('Login failed. Please try again.'); }
}

async function doRegister() {
  const name  = document.getElementById('rN')?.value.trim();
  const email = document.getElementById('rE')?.value.trim();
  const phone = document.getElementById('rPh')?.value.trim();
  const pass  = document.getElementById('rP')?.value;
  if (!name||!email||!phone||!pass) { alert('Please fill all fields.'); return; }
  if (!/^[0-9]{10}$/.test(phone)) { alert('Enter a valid 10-digit phone number.'); return; }
  if (pass.length<6) { alert('Password must be at least 6 characters.'); return; }
  try {
    const ex = await DB.findUser(email);
    if (ex) { alert('Email already registered. Please login.'); return; }
    await DB.addUser({ name, email, phone, password: pass });
    saveSession({ name, email, phone, avatar: '' });
    updateUserBtn();
    closeAuth();
    showToast('Welcome, ' + name + '! 🎉');
  } catch(e) { alert('Registration failed. Please try again.'); }
}

function updateUserBtn() {
  const s = getSession();
  const btn = document.getElementById('userBtn');
  if (btn) btn.textContent = s ? '👤 ' + s.name.split(' ')[0] : 'Login';
}
