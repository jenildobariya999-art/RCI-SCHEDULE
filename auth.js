// ============================================================
//  MeetBoard - auth.js
//  Handles: Login OTP, Register OTP, Admin password login
// ============================================================

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const session = DB.getSession();
  if (session) {
    if (session.role === 'admin') {
      window.location.href = 'pages/admin.html';
    } else {
      window.location.href = 'pages/dashboard.html';
    }
  }
  Notify.requestPermission();
});

// ---- UI HELPERS ----

function toggleCard(which) {
  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('registerCard').classList.add('hidden');
  document.getElementById('adminCard').classList.add('hidden');
  document.getElementById(which + 'Card').classList.remove('hidden');
}

function showToast(msg, type) {
  Notify.toast(msg, type);
}

// ---- LOGIN ----

async function sendLoginOTP() {
  const phone = document.getElementById('loginPhone').value.trim();
  if (phone.length !== 10 || !/^\d+$/.test(phone)) {
    return Notify.toast('Enter valid 10-digit mobile number', 'error');
  }

  // Check if admin phone
  if (phone === CONFIG.ADMIN_PHONE) {
    return Notify.toast('Admin? Use Admin Login below', 'error');
  }

  // Check if user exists and approved
  const users = DB.getUsers();
  const user = users.find(u => u.phone === phone);

  if (!user) {
    return Notify.toast('Number not registered. Please register first.', 'error');
  }
  if (user.status === 'pending') {
    return Notify.toast('Your account is pending admin approval', 'error');
  }
  if (user.status === 'rejected') {
    return Notify.toast('Your account has been rejected by admin', 'error');
  }

  const otp = OTPStore.generate(phone);
  const sent = await SMS.sendOTP(phone, otp);

  if (sent) {
    document.getElementById('loginOtpSection').classList.remove('hidden');
    Notify.toast(`OTP sent to +91${phone}`, 'success');
    // DEV: show OTP in console
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  } else {
    Notify.toast('Failed to send OTP. Check Fast2SMS API key.', 'error');
  }
}

function verifyLoginOTP() {
  const phone = document.getElementById('loginPhone').value.trim();
  const otp = getOtpValue('login');

  if (otp.length !== 6) return Notify.toast('Enter 6-digit OTP', 'error');

  if (OTPStore.verify(phone, otp)) {
    const users = DB.getUsers();
    const user = users.find(u => u.phone === phone);
    DB.saveSession({ phone, name: user.name, role: 'member', loginAt: Date.now() });
    Notify.toast('Welcome back, ' + user.name + '! 🎉', 'success');
    setTimeout(() => window.location.href = 'pages/dashboard.html', 800);
  } else {
    Notify.toast('Wrong or expired OTP', 'error');
  }
}

// ---- REGISTER ----

async function sendRegisterOTP() {
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();

  if (!name || name.length < 2) return Notify.toast('Enter your full name', 'error');
  if (phone.length !== 10 || !/^\d+$/.test(phone)) return Notify.toast('Enter valid 10-digit mobile', 'error');

  // Check duplicate
  const users = DB.getUsers();
  if (users.find(u => u.phone === phone)) {
    return Notify.toast('This number is already registered', 'error');
  }
  if (phone === CONFIG.ADMIN_PHONE) {
    return Notify.toast('This number is reserved for admin', 'error');
  }

  const otp = OTPStore.generate(phone);
  const sent = await SMS.sendOTP(phone, otp);

  if (sent) {
    document.getElementById('regOtpSection').classList.remove('hidden');
    Notify.toast(`OTP sent to +91${phone}`, 'success');
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  } else {
    Notify.toast('Failed to send OTP', 'error');
  }
}

function verifyRegisterOTP() {
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const otp = getOtpValue('reg');

  if (otp.length !== 6) return Notify.toast('Enter 6-digit OTP', 'error');

  if (OTPStore.verify(phone, otp)) {
    const users = DB.getUsers();
    users.push({
      id: 'u_' + Date.now(),
      name,
      phone,
      status: 'pending',
      registeredAt: Date.now()
    });
    DB.saveUsers(users);
    Notify.toast('Registered! Waiting for admin approval ⏳', 'success');
    setTimeout(() => toggleCard('login'), 2000);
  } else {
    Notify.toast('Wrong or expired OTP', 'error');
  }
}

// ---- ADMIN LOGIN ----

function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  if (pass === CONFIG.ADMIN_PASSWORD) {
    DB.saveSession({
      phone: CONFIG.ADMIN_PHONE,
      name: CONFIG.ADMIN_NAME,
      role: 'admin',
      loginAt: Date.now()
    });
    Notify.toast('Welcome, Admin! 🔐', 'success');
    setTimeout(() => window.location.href = 'pages/admin.html', 600);
  } else {
    Notify.toast('Wrong password', 'error');
    document.getElementById('adminPass').value = '';
  }
}

// ---- OTP INPUT HELPERS ----

function otpNav(input, index, prefix) {
  const boxes = document.querySelectorAll(`#${prefix === 'login' ? 'loginOtpSection' : 'regOtpSection'} .otp-box`);
  input.value = input.value.replace(/[^0-9]/g, '');
  if (input.value && index < boxes.length) {
    boxes[index].focus();
  }
}

function getOtpValue(prefix) {
  const section = prefix === 'login' ? 'loginOtpSection' : 'regOtpSection';
  const boxes = document.querySelectorAll(`#${section} .otp-box`);
  return Array.from(boxes).map(b => b.value).join('');
}
