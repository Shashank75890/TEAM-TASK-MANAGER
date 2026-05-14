// ===================== API UTILITY =====================
const BASE_URL = '';  // Same origin — Spring Boot serves frontend

const api = {
  getToken() { return localStorage.getItem('token'); },
  getUser()  { return JSON.parse(localStorage.getItem('user') || 'null'); },
  isLoggedIn() { return !!this.getToken(); },

  setAuth(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      id: data.userId, name: data.name, email: data.email, role: data.role
    }));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  },

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(BASE_URL + path, opts);

    if (res.status === 401) { this.logout(); return; }

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
  },

  get(path)           { return this.request('GET',    path); },
  post(path, body)    { return this.request('POST',   path, body); },
  put(path, body)     { return this.request('PUT',    path, body); },
  patch(path, body)   { return this.request('PATCH',  path, body); },
  delete(path)        { return this.request('DELETE', path); },
};

// ===================== TOAST =====================
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ===================== NAVBAR USER INIT =====================
function initNavbar() {
  const user = api.getUser();
  if (!user) return;
  const nameEl  = document.getElementById('nav-user-name');
  const roleEl  = document.getElementById('nav-user-role');
  const avatarEl = document.getElementById('nav-avatar');
  if (nameEl)   nameEl.textContent  = user.name;
  if (roleEl)   roleEl.textContent  = user.role;
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => api.logout());
}

// ===================== GUARD =====================
function requireAuth() {
  if (!api.isLoggedIn()) { window.location.href = '/index.html'; }
}
function requireGuest() {
  if (api.isLoggedIn()) { window.location.href = '/dashboard.html'; }
}

// ===================== HELPERS =====================
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function getPriorityBadge(priority) {
  const map = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
  return `<span class="badge ${map[priority] || 'badge-medium'}">● ${priority}</span>`;
}

function getStatusBadge(status) {
  const map = { TODO: 'badge-todo', IN_PROGRESS: 'badge-progress', DONE: 'badge-done' };
  const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
  return `<span class="badge ${map[status] || 'badge-todo'}">${labels[status] || status}</span>`;
}

function getRoleBadge(role) {
  return `<span class="badge ${role === 'ADMIN' ? 'badge-admin' : 'badge-member'}">${role}</span>`;
}
