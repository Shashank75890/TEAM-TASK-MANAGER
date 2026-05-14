// Project Detail Page Logic
let projectId, project, tasks = [], allUsers = [];
const currentUser = () => api.getUser();

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initNavbar();

  const params = new URLSearchParams(window.location.search);
  projectId = params.get('id');
  if (!projectId) { window.location.href = '/dashboard.html'; return; }

  await loadProject();
  await loadTasks();
  await loadUsers();

  // Task modal events
  document.getElementById('new-task-btn').addEventListener('click', () => openTaskModal());
  document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
  document.getElementById('task-modal-close').addEventListener('click', closeTaskModal);
  document.getElementById('task-modal').addEventListener('click', e => { if (e.target.id === 'task-modal') closeTaskModal(); });

  // Member modal events
  document.getElementById('add-member-btn')?.addEventListener('click', () => openMemberModal());
  document.getElementById('member-form').addEventListener('submit', handleAddMember);
  document.getElementById('member-modal-close').addEventListener('click', closeMemberModal);
  document.getElementById('member-modal').addEventListener('click', e => { if (e.target.id === 'member-modal') closeMemberModal(); });
});

// ===================== LOAD PROJECT =====================
async function loadProject() {
  try {
    project = await api.get(`/api/projects/${projectId}`);
    const isAdmin = project.userRole === 'ADMIN';

    document.getElementById('project-title').textContent = project.name;
    document.getElementById('project-desc-text').textContent = project.description || 'No description';
    document.getElementById('project-role-badge').innerHTML = getRoleBadge(project.userRole);

    if (!isAdmin) {
      document.getElementById('new-task-btn').style.display = 'none';
      document.getElementById('add-member-btn') && (document.getElementById('add-member-btn').style.display = 'none');
    }

    renderMembers(project.members || [], isAdmin);
  } catch (err) {
    showToast('Failed to load project', 'error');
  }
}

function renderMembers(members, isAdmin) {
  const list = document.getElementById('members-list');
  const me = currentUser();
  list.innerHTML = members.map(m => `
    <div class="member-item">
      <div class="member-info">
        <div class="avatar" style="width:32px;height:32px;font-size:0.8rem">${m.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="member-name">${escHtml(m.name)} ${m.userId === me.id ? '<span style="font-size:0.75rem;color:var(--text-muted)">(you)</span>' : ''}</div>
          <div class="member-email">${escHtml(m.email)}</div>
        </div>
      </div>
      <div class="member-actions">
        ${getRoleBadge(m.role)}
        ${isAdmin && m.userId !== project.ownerId ? `
          <button class="btn btn-danger btn-sm btn-icon" onclick="removeMember(${m.userId})" title="Remove">✕</button>
        ` : ''}
      </div>
    </div>
  `).join('') || '<div class="empty-state" style="padding:1rem"><p>No members</p></div>';
}

// ===================== LOAD & RENDER TASKS =====================
async function loadTasks() {
  const board = document.getElementById('kanban-board');
  board.innerHTML = '<div class="loading-overlay" style="grid-column:1/-1"><span class="loader"></span> Loading tasks…</div>';
  try {
    tasks = await api.get(`/api/projects/${projectId}/tasks`);
    renderKanban();
  } catch (err) {
    showToast('Failed to load tasks', 'error');
  }
}

function renderKanban() {
  const cols = { TODO: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(t => (cols[t.status] || cols.TODO).push(t));

  document.getElementById('kanban-board').innerHTML = `
    ${renderCol('TODO',        '📋 To Do',      cols.TODO,        'col-todo')}
    ${renderCol('IN_PROGRESS', '⚡ In Progress', cols.IN_PROGRESS, 'col-progress')}
    ${renderCol('DONE',        '✅ Done',        cols.DONE,        'col-done')}
  `;
}

function renderCol(status, label, items, cls) {
  return `
    <div class="kanban-col ${cls}">
      <div class="kanban-col-header">
        <span>${label}</span>
        <span class="col-count">${items.length}</span>
      </div>
      <div class="kanban-tasks">
        ${items.length ? items.map(renderTaskCard).join('') : '<div class="empty-state" style="padding:1rem;font-size:0.8rem">No tasks</div>'}
      </div>
    </div>`;
}

function renderTaskCard(t) {
  const overdue = isOverdue(t.dueDate) && t.status !== 'DONE';
  const me = currentUser();
  const isAdmin = project.userRole === 'ADMIN';
  const isAssignee = t.assigneeId === me.id;

  return `
    <div class="task-card" onclick="openTaskModal(${JSON.stringify(t).replace(/"/g,'&quot;')})">
      <div class="task-card-title">${escHtml(t.title)}</div>
      ${t.description ? `<div class="task-card-desc">${escHtml(t.description)}</div>` : ''}
      <div class="task-card-meta">
        ${getPriorityBadge(t.priority)}
        ${t.dueDate ? `<span class="task-due ${overdue ? 'overdue' : ''}">📅 ${formatDate(t.dueDate)}${overdue ? ' ⚠' : ''}</span>` : ''}
      </div>
      ${t.assigneeName ? `
        <div class="task-assignee" style="margin-top:8px">
          <span class="mini-avatar">${t.assigneeName.charAt(0).toUpperCase()}</span>
          ${escHtml(t.assigneeName)}
        </div>` : ''}
      ${(isAdmin || isAssignee) ? `
        <div style="display:flex;gap:6px;margin-top:10px;border-top:1px solid var(--border);padding-top:8px">
          ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openTaskModal(${JSON.stringify(t).replace(/"/g,'&quot;')})">Edit</button>` : ''}
          <select class="form-control" style="padding:4px 8px;font-size:0.78rem;height:auto" onchange="quickStatus(${t.id},this.value)" onclick="event.stopPropagation()">
            <option value="TODO"        ${t.status==='TODO'        ?'selected':''}>To Do</option>
            <option value="IN_PROGRESS" ${t.status==='IN_PROGRESS' ?'selected':''}>In Progress</option>
            <option value="DONE"        ${t.status==='DONE'        ?'selected':''}>Done</option>
          </select>
          ${isAdmin ? `<button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();deleteTask(${t.id})" title="Delete">🗑</button>` : ''}
        </div>
      ` : ''}
    </div>`;
}

// ===================== QUICK STATUS UPDATE =====================
async function quickStatus(taskId, newStatus) {
  try {
    await api.put(`/api/tasks/${taskId}`, { status: newStatus });
    showToast('Status updated', 'success');
    await loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================== TASK MODAL =====================
let editingTaskId = null;

function openTaskModal(task = null) {
  if (project.userRole !== 'ADMIN' && !task) return;
  editingTaskId = task ? task.id : null;

  document.getElementById('task-modal-title').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('task-title').value       = task?.title       || '';
  document.getElementById('task-desc').value        = task?.description || '';
  document.getElementById('task-due').value         = task?.dueDate     || '';
  document.getElementById('task-priority').value    = task?.priority    || 'MEDIUM';
  document.getElementById('task-status').value      = task?.status      || 'TODO';
  document.getElementById('task-assignee').value    = task?.assigneeId  || '';

  // Show/hide status for admin
  const statusRow = document.getElementById('task-status-row');
  statusRow.style.display = project.userRole === 'ADMIN' ? 'flex' : 'none';

  // Delete button
  const delBtn = document.getElementById('task-delete-btn');
  delBtn.style.display = (task && project.userRole === 'ADMIN') ? 'inline-flex' : 'none';
  delBtn.onclick = () => deleteTask(task.id);

  document.getElementById('task-modal').classList.remove('hidden');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.add('hidden');
  editingTaskId = null;
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span>';

  const payload = {
    title:       document.getElementById('task-title').value.trim(),
    description: document.getElementById('task-desc').value.trim(),
    dueDate:     document.getElementById('task-due').value || null,
    priority:    document.getElementById('task-priority').value,
    status:      document.getElementById('task-status').value,
    assigneeId:  document.getElementById('task-assignee').value ? Number(document.getElementById('task-assignee').value) : null,
  };

  try {
    if (editingTaskId) {
      await api.put(`/api/tasks/${editingTaskId}`, payload);
      showToast('Task updated!', 'success');
    } else {
      await api.post(`/api/projects/${projectId}/tasks`, payload);
      showToast('Task created!', 'success');
    }
    closeTaskModal();
    await loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editingTaskId ? 'Save Changes' : 'Create Task';
  }
}

async function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  try {
    await api.delete(`/api/tasks/${taskId}`);
    showToast('Task deleted', 'info');
    closeTaskModal();
    await loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================== MEMBERS =====================
async function loadUsers() {
  try {
    allUsers = await api.get('/api/projects/users');
    const sel = document.getElementById('task-assignee');
    sel.innerHTML = '<option value="">— Unassigned —</option>' +
      allUsers.map(u => `<option value="${u.id}">${escHtml(u.name)} (${escHtml(u.email)})</option>`).join('');

    const memberSel = document.getElementById('member-user-select');
    const memberIds = new Set((project.members || []).map(m => m.userId));
    memberSel.innerHTML = '<option value="">Select user…</option>' +
      allUsers.filter(u => !memberIds.has(u.id))
              .map(u => `<option value="${u.id}">${escHtml(u.name)} (${escHtml(u.email)})</option>`).join('');
  } catch (err) { /* ignore */ }
}

function openMemberModal()  { document.getElementById('member-modal').classList.remove('hidden'); }
function closeMemberModal() { document.getElementById('member-modal').classList.add('hidden'); }

async function handleAddMember(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span>';

  const userId = document.getElementById('member-user-select').value;
  const role   = document.getElementById('member-role-select').value;
  if (!userId) { showToast('Select a user', 'error'); btn.disabled=false; btn.textContent='Add Member'; return; }

  try {
    await api.post(`/api/projects/${projectId}/members`, { userId: Number(userId), role });
    showToast('Member added!', 'success');
    closeMemberModal();
    await loadProject();
    await loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Member';
  }
}

async function removeMember(userId) {
  if (!confirm('Remove this member?')) return;
  try {
    await api.delete(`/api/projects/${projectId}/members/${userId}`);
    showToast('Member removed', 'info');
    await loadProject();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
