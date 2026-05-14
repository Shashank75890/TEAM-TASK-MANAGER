// Dashboard Page Logic
document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initNavbar();
  await loadDashboard();
  await loadProjects();

  document.getElementById('new-project-btn').addEventListener('click', () => openProjectModal());
  document.getElementById('project-form').addEventListener('submit', handleCreateProject);
  document.getElementById('modal-close').addEventListener('click', closeProjectModal);
  document.getElementById('project-modal').addEventListener('click', (e) => {
    if (e.target.id === 'project-modal') closeProjectModal();
  });
});

async function loadDashboard() {
  try {
    const stats = await api.get('/api/dashboard');
    document.getElementById('stat-total').textContent      = stats.totalTasks;
    document.getElementById('stat-todo').textContent       = stats.todoTasks;
    document.getElementById('stat-progress').textContent   = stats.inProgressTasks;
    document.getElementById('stat-done').textContent       = stats.doneTasks;
    document.getElementById('stat-overdue').textContent    = stats.overdueTasks;
  } catch (err) {
    showToast('Failed to load stats', 'error');
  }
}

async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '<div class="loading-overlay"><span class="loader"></span> Loading projects…</div>';
  try {
    const projects = await api.get('/api/projects');
    if (!projects.length) {
      grid.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>No projects yet</h3>
        <p>Create your first project to get started</p>
      </div>`;
      return;
    }
    grid.innerHTML = projects.map(p => renderProjectCard(p)).join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><p>Failed to load projects</p></div>';
  }
}

function renderProjectCard(p) {
  const taskBar = p.totalTasks ? `
    <div class="progress-bar-wrap" style="margin-top:4px">
      <div class="progress-bar" style="width:${Math.round((p.doneTasks||0)/p.totalTasks*100)}%"></div>
    </div>
    <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">${p.doneTasks||0}/${p.totalTasks} tasks done</div>
  ` : '<div style="font-size:0.75rem;color:var(--text-muted)">No tasks yet</div>';

  return `
    <a href="/project.html?id=${p.id}" class="glass project-card">
      <div class="project-card-header">
        <div>
          <div class="project-name">${escHtml(p.name)}</div>
          <div class="project-desc">${escHtml(p.description || 'No description')}</div>
        </div>
        ${getRoleBadge(p.userRole)}
      </div>
      <div>${taskBar}</div>
      <div class="project-meta">
        <span class="badge badge-member">👤 ${escHtml(p.ownerName)}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-left:auto">${formatDate(p.createdAt)}</span>
      </div>
    </a>`;
}

function openProjectModal() {
  document.getElementById('project-modal').classList.remove('hidden');
  document.getElementById('proj-name').value = '';
  document.getElementById('proj-desc').value = '';
  document.getElementById('proj-name').focus();
}
function closeProjectModal() {
  document.getElementById('project-modal').classList.add('hidden');
}

async function handleCreateProject(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span>';
  try {
    await api.post('/api/projects', {
      name:        document.getElementById('proj-name').value.trim(),
      description: document.getElementById('proj-desc').value.trim(),
    });
    showToast('Project created!', 'success');
    closeProjectModal();
    await loadDashboard();
    await loadProjects();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Project';
  }
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
