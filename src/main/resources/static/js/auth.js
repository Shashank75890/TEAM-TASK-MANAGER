// Auth Page Logic
document.addEventListener('DOMContentLoaded', () => {
  requireGuest();

  const loginTab    = document.getElementById('login-tab');
  const signupTab   = document.getElementById('signup-tab');
  const loginForm   = document.getElementById('login-form');
  const signupForm  = document.getElementById('signup-form');
  const loginError  = document.getElementById('login-error');
  const signupError = document.getElementById('signup-error');

  function switchTab(tab) {
    if (tab === 'login') {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginForm.style.display = 'flex';
      signupForm.style.display = 'none';
    } else {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupForm.style.display = 'flex';
      loginForm.style.display = 'none';
    }
  }

  loginTab.addEventListener('click',  () => switchTab('login'));
  signupTab.addEventListener('click', () => switchTab('signup'));

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('visible');
    const btn = loginForm.querySelector('.auth-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span>';

    try {
      const data = await api.post('/api/auth/login', {
        email:    document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value,
      });
      api.setAuth(data);
      showToast(`Welcome back, ${data.name}!`, 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 600);
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Signup
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.classList.remove('visible');
    const btn = signupForm.querySelector('.auth-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span>';

    const password = document.getElementById('signup-password').value;
    const confirm  = document.getElementById('signup-confirm').value;
    if (password !== confirm) {
      signupError.textContent = 'Passwords do not match';
      signupError.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Create Account';
      return;
    }

    try {
      const data = await api.post('/api/auth/signup', {
        name:     document.getElementById('signup-name').value.trim(),
        email:    document.getElementById('signup-email').value.trim(),
        password,
      });
      api.setAuth(data);
      showToast('Account created! Welcome aboard 🎉', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 700);
    } catch (err) {
      signupError.textContent = err.message;
      signupError.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
});
