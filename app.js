/* ═══════════════════════════════════════════════════════════
   TaskFlow — Application Logic
   Features: CRUD, Priority, Deadlines, Team Assignment,
             Search, Filters, Board/List view, Local Storage,
             Progress Tracking, Tags, Toast Notifications,
             Category Tabs, Smart Suggestions, Team Dashboard
   ═══════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─── TEAM MEMBERS (with roles & areas of excellence) ───
  const TEAM_MEMBERS = [
    { name: 'Ayush',  color: '#2A9D8F', role: 'Full-Stack Developer', expertise: ['frontend', 'ui', 'design', 'mobile', 'qa'] },
    { name: 'Priya',  color: '#E16B5C', role: 'Technical Writer & Analyst', expertise: ['docs', 'api', 'analytics', 'research'] },
    { name: 'Rohan',  color: '#3B82F6', role: 'DevOps & Backend Engineer', expertise: ['devops', 'backend', 'performance', 'infra'] },
    { name: 'Sneha',  color: '#A78BFA', role: 'UI/UX Designer', expertise: ['design', 'branding', 'ui', 'ux', 'prototyping'] },
    { name: 'Arjun',  color: '#E9A84C', role: 'Backend Developer', expertise: ['backend', 'auth', 'api', 'security', 'database'] },
  ];

  // ─── SMART SUGGESTION TEMPLATES ───
  const SUGGESTION_TEMPLATES = [
    { keywords: ['design', 'ui', 'wireframe', 'mockup', 'prototype'], suggestion: { priority: 'high', tags: ['design', 'ui'], assignee: 'Sneha', text: 'Design tasks work best with Sneha. Set to high priority.' } },
    { keywords: ['api', 'endpoint', 'rest', 'graphql'], suggestion: { priority: 'high', tags: ['api', 'backend'], assignee: 'Arjun', text: 'API work suits Arjun. Auto-tagged as backend.' } },
    { keywords: ['test', 'testing', 'qa', 'bug', 'fix'], suggestion: { priority: 'medium', tags: ['qa'], assignee: 'Ayush', text: 'Testing tasks assigned to Ayush with QA tag.' } },
    { keywords: ['doc', 'documentation', 'write', 'blog', 'content'], suggestion: { priority: 'medium', tags: ['docs'], assignee: 'Priya', text: 'Documentation best handled by Priya.' } },
    { keywords: ['deploy', 'ci', 'cd', 'pipeline', 'server', 'infra', 'docker'], suggestion: { priority: 'high', tags: ['devops'], assignee: 'Rohan', text: 'Infrastructure tasks assigned to Rohan.' } },
    { keywords: ['database', 'query', 'sql', 'postgres', 'mongo', 'optimize'], suggestion: { priority: 'medium', tags: ['backend', 'performance'], assignee: 'Rohan', text: 'Database work suits Rohan with performance tag.' } },
    { keywords: ['auth', 'login', 'signup', 'security', 'jwt', 'oauth'], suggestion: { priority: 'high', tags: ['auth', 'security'], assignee: 'Arjun', text: 'Auth tasks assigned to Arjun — high priority.' } },
    { keywords: ['mobile', 'responsive', 'ios', 'android'], suggestion: { priority: 'medium', tags: ['mobile'], assignee: 'Ayush', text: 'Mobile tasks assigned to Ayush.' } },
    { keywords: ['brand', 'logo', 'style', 'color', 'typography'], suggestion: { priority: 'medium', tags: ['branding', 'design'], assignee: 'Sneha', text: 'Branding tasks best handled by Sneha.' } },
    { keywords: ['analytics', 'tracking', 'metrics', 'dashboard'], suggestion: { priority: 'low', tags: ['analytics'], assignee: 'Priya', text: 'Analytics tasks assigned to Priya.' } },
  ];

  // ─── STATE ───
  let tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || [];
  let currentFilter = 'all';
  let currentCategoryTab = 'all-tasks';
  let currentView = 'list';
  let currentTeamFilter = null;
  let showMemberDashboard = false;
  let searchQuery = '';
  let editingTaskId = null;
  let deleteTaskId = null;
  let currentTags = [];
  let currentSuggestion = null;
  let acHighlightIndex = -1;

  // ─── DOM CACHE ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const sidebar          = $('#sidebar');
  const sidebarOverlay   = $('#sidebarOverlay');
  const mobileMenuBtn    = $('#mobileMenuBtn');
  const taskModal        = $('#taskModal');
  const deleteModal      = $('#deleteModal');
  const taskForm         = $('#taskForm');
  const taskList         = $('#taskList');
  const emptyState       = $('#emptyState');
  const searchInput      = $('#searchInput');
  const pageTitle        = $('#pageTitle');
  const pageCount        = $('#pageCount');
  const teamList         = $('#teamList');
  const tagChips         = $('#tagChips');
  const tagInput         = $('#tagInput');
  const progressRing     = $('#progressRing');
  const progressText     = $('#progressText');
  const progressDetail   = $('#progressDetail');
  const taskListView     = $('#taskListView');
  const boardView        = $('#boardView');
  const memberDashboard  = $('#memberDashboard');
  const categoryTabs     = $('#categoryTabs');
  const toastContainer   = $('#toastContainer');
  const smartSuggestion  = $('#smartSuggestion');
  const titleAutocomplete = $('#titleAutocomplete');

  // ─── INIT ───
  function init() {
    renderTeamList();
    renderTasks();
    updateCounts();
    updateProgress();
    bindSidebar();
    bindModal();
    bindSearch();
    bindViewToggle();
    bindFormTags();
    bindCategoryTabs();
    bindSmartSuggestions();
    seedDemoIfEmpty();
  }

  // ─── SEED DEMO DATA ───
  function seedDemoIfEmpty() {
    if (tasks.length > 0) return;
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    const addDays = (days) => { const nd = new Date(today); nd.setDate(nd.getDate() + days); return fmt(nd); };

    const demo = [
      { title: 'Design homepage wireframe', description: 'Create low-fidelity wireframes for the landing page including hero, features, and footer sections.', priority: 'high', status: 'in-progress', deadline: addDays(2), assignee: 'Ayush', tags: ['design', 'ui'] },
      { title: 'Set up project repository', description: 'Initialize Git repo, configure CI/CD pipeline, and set up branch protection rules.', priority: 'high', status: 'done', deadline: addDays(-1), assignee: 'Rohan', tags: ['devops'] },
      { title: 'Write API documentation', description: 'Document REST API endpoints with request/response schemas using Swagger.', priority: 'medium', status: 'todo', deadline: addDays(5), assignee: 'Priya', tags: ['docs', 'api'] },
      { title: 'Implement user authentication', description: 'Build login/signup flow with JWT tokens and refresh token rotation.', priority: 'high', status: 'in-progress', deadline: addDays(3), assignee: 'Arjun', tags: ['backend', 'auth'] },
      { title: 'Create brand style guide', description: 'Define typography, color palette, spacing scales, and component visual standards.', priority: 'medium', status: 'review', deadline: addDays(1), assignee: 'Sneha', tags: ['design', 'branding'] },
      { title: 'Optimize database queries', description: 'Analyze slow queries and add proper indexes for better performance.', priority: 'low', status: 'todo', deadline: addDays(7), assignee: 'Rohan', tags: ['backend', 'performance'] },
      { title: 'Mobile responsive testing', description: 'Test all pages on various devices and fix layout issues.', priority: 'medium', status: 'todo', deadline: addDays(4), assignee: 'Ayush', tags: ['qa', 'mobile'] },
      { title: 'Setup analytics tracking', description: 'Integrate Google Analytics and custom event tracking for user behaviour insights.', priority: 'low', status: 'todo', deadline: addDays(10), assignee: 'Priya', tags: ['analytics'] },
      { title: 'Fix login page redirect bug', description: 'Users are not being redirected after successful login. Debug and fix the issue.', priority: 'high', status: 'todo', deadline: addDays(-2), assignee: 'Arjun', tags: ['bug', 'auth'] },
      { title: 'Update deployment pipeline', description: 'Add staging environment and automated rollback capabilities.', priority: 'high', status: 'in-progress', deadline: addDays(-1), assignee: 'Rohan', tags: ['devops', 'infra'] },
    ];

    demo.forEach((d) => {
      tasks.push({
        id: generateId(),
        title: d.title,
        description: d.description,
        priority: d.priority,
        status: d.status,
        deadline: d.deadline,
        assignee: d.assignee,
        tags: d.tags,
        createdAt: Date.now(),
      });
    });

    saveTasks();
    renderTasks();
    updateCounts();
    updateProgress();
  }

  // ─── HELPERS ───
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function saveTasks() {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
  }

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const diff = d - today;
    const dayMs = 86400000;

    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (diff < 0) return `${Math.ceil(Math.abs(diff)/dayMs)}d overdue`;
    if (diff < 7 * dayMs) return `In ${Math.ceil(diff/dayMs)}d`;

    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    return dateStr < getToday();
  }

  function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function getMemberColor(name) {
    const m = TEAM_MEMBERS.find(t => t.name === name);
    return m ? m.color : '#94A3B8';
  }

  function getMember(name) {
    return TEAM_MEMBERS.find(t => t.name === name);
  }

  // ─── FILTER LOGIC ───
  function filterTasks() {
    let filtered = [...tasks];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Team filter
    if (currentTeamFilter) {
      filtered = filtered.filter(t => t.assignee === currentTeamFilter);
    }

    // Sidebar filter
    switch (currentFilter) {
      case 'today':
        filtered = filtered.filter(t => t.deadline === getToday() && t.status !== 'done');
        break;
      case 'upcoming':
        filtered = filtered.filter(t => t.deadline && t.deadline >= getToday() && t.status !== 'done');
        filtered.sort((a, b) => a.deadline.localeCompare(b.deadline));
        break;
      case 'overdue':
        filtered = filtered.filter(t => isOverdue(t.deadline) && t.status !== 'done');
        break;
      case 'in-progress':
        filtered = filtered.filter(t => t.status === 'in-progress');
        break;
      case 'review':
        filtered = filtered.filter(t => t.status === 'review');
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === 'done');
        break;
      case 'high':
        filtered = filtered.filter(t => t.priority === 'high' && t.status !== 'done');
        break;
      case 'medium':
        filtered = filtered.filter(t => t.priority === 'medium' && t.status !== 'done');
        break;
      case 'low':
        filtered = filtered.filter(t => t.priority === 'low' && t.status !== 'done');
        break;
      case 'all':
      default:
        break;
    }

    // Category tab sub-filter (only when on "all" sidebar filter)
    if (currentFilter === 'all' && currentCategoryTab !== 'all-tasks') {
      switch (currentCategoryTab) {
        case 'overdue':
          filtered = filtered.filter(t => isOverdue(t.deadline) && t.status !== 'done');
          break;
        case 'in-progress':
          filtered = filtered.filter(t => t.status === 'in-progress');
          break;
        case 'review':
          filtered = filtered.filter(t => t.status === 'review');
          break;
        case 'done':
          filtered = filtered.filter(t => t.status === 'done');
          break;
      }
    }

    // Default sort
    const prioOrder = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      if (prioOrder[a.priority] !== prioOrder[b.priority]) return prioOrder[a.priority] - prioOrder[b.priority];
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      return 0;
    });

    return filtered;
  }

  // ─── SHOW/HIDE VIEWS ───
  function showView(view) {
    taskListView.classList.add('hidden');
    boardView.classList.add('hidden');
    memberDashboard.classList.add('hidden');
    categoryTabs.classList.remove('hidden');

    if (view === 'dashboard') {
      memberDashboard.classList.remove('hidden');
      categoryTabs.classList.add('hidden');
    } else if (currentView === 'board') {
      boardView.classList.remove('hidden');
    } else {
      taskListView.classList.remove('hidden');
    }
  }

  // ─── RENDER TASKS (List) ───
  function renderTasks() {
    if (showMemberDashboard) {
      showView('dashboard');
      renderMemberDashboard(currentTeamFilter);
      updateHeader();
      return;
    }

    showView(currentView);
    const filtered = filterTasks();

    // List view
    taskList.innerHTML = '';
    filtered.forEach((task, i) => {
      taskList.appendChild(createTaskCard(task, i));
    });

    // Empty state
    if (filtered.length === 0) {
      emptyState.classList.add('visible');
    } else {
      emptyState.classList.remove('visible');
    }

    // Board view
    renderBoard();

    // Update header
    updateHeader();

    // Update category tab counts
    updateCategoryTabCounts();

    // Show/hide category tabs
    if (currentFilter === 'all' && !currentTeamFilter) {
      categoryTabs.classList.remove('hidden');
    } else {
      categoryTabs.classList.add('hidden');
    }
  }

  function updateHeader() {
    const filtered = filterTasks();
    const filterNames = {
      all: 'All Tasks', today: 'Today', upcoming: 'Upcoming',
      overdue: 'Overdue', 'in-progress': 'In Progress', review: 'Review',
      completed: 'Completed', high: 'High Priority',
      medium: 'Medium Priority', low: 'Low Priority'
    };

    if (showMemberDashboard && currentTeamFilter) {
      pageTitle.textContent = `${currentTeamFilter}'s Dashboard`;
      pageCount.textContent = '';
    } else if (currentTeamFilter) {
      pageTitle.textContent = `${currentTeamFilter}'s Tasks`;
      pageCount.textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;
    } else {
      pageTitle.textContent = filterNames[currentFilter] || 'All Tasks';
      pageCount.textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;
    }
  }

  function createTaskCard(task, index) {
    const card = document.createElement('div');
    card.className = `task-card${task.status === 'done' ? ' completed' : ''}`;
    card.style.animationDelay = `${index * 40}ms`;

    const deadlineText = formatDate(task.deadline);
    const overdue = isOverdue(task.deadline) && task.status !== 'done';

    card.innerHTML = `
      <div class="task-priority-bar ${task.priority}"></div>
      <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}" data-id="${task.id}"></div>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="task-priority-badge ${task.priority}">
            <span class="priority-dot ${task.priority}"></span>
            ${task.priority}
          </span>
          <span class="task-status-badge" data-status="${task.status}">
            <span class="status-dot"></span>
            ${statusLabel(task.status)}
          </span>
          ${task.deadline ? `
            <span class="task-meta-item ${overdue ? 'deadline-overdue' : ''}">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M2 6h12M5.5 1v3M10.5 1v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              ${deadlineText}
            </span>
          ` : ''}
          ${task.assignee ? `
            <span class="task-assignee">
              <span class="task-assignee-avatar" style="background:${getMemberColor(task.assignee)}">${getInitials(task.assignee)}</span>
              <span class="task-meta-item">${escapeHtml(task.assignee)}</span>
            </span>
          ` : ''}
          ${task.tags && task.tags.length > 0 ? task.tags.map(t => `<span class="task-tag">${escapeHtml(t)}</span>`).join('') : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn edit" data-id="${task.id}" aria-label="Edit task">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
        </button>
        <button class="task-action-btn delete" data-id="${task.id}" aria-label="Delete task">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;

    card.querySelector('.task-checkbox').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTaskComplete(task.id);
    });

    card.querySelector('.task-action-btn.edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(task.id);
    });

    card.querySelector('.task-action-btn.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(task.id);
    });

    card.addEventListener('click', () => openEditModal(task.id));

    return card;
  }

  // ─── RENDER BOARD VIEW ───
  function renderBoard() {
    const statuses = ['todo', 'in-progress', 'review', 'done'];
    const filteredAll = filterTasks();

    statuses.forEach((status) => {
      const colBody = $(`#board${capitalizeStatus(status)}`);
      const colCount = $(`#boardCount${capitalizeStatus(status)}`);
      const statusTasks = filteredAll.filter(t => t.status === status);

      colBody.innerHTML = '';
      statusTasks.forEach((task, i) => {
        colBody.appendChild(createBoardCard(task, i));
      });
      colCount.textContent = statusTasks.length;
    });
  }

  function capitalizeStatus(status) {
    const map = { 'todo': 'Todo', 'in-progress': 'InProgress', 'review': 'Review', 'done': 'Done' };
    return map[status] || status;
  }

  function createBoardCard(task, index) {
    const card = document.createElement('div');
    card.className = 'board-card';
    card.style.animationDelay = `${index * 40}ms`;

    const deadlineText = formatDate(task.deadline);
    const overdue = isOverdue(task.deadline) && task.status !== 'done';

    card.innerHTML = `
      <div class="board-card-title">${escapeHtml(task.title)}</div>
      <div class="board-card-meta">
        <span class="task-priority-badge ${task.priority}">
          <span class="priority-dot ${task.priority}"></span>
          ${task.priority}
        </span>
        ${task.assignee ? `
          <span class="task-assignee-avatar" style="background:${getMemberColor(task.assignee)}; width:22px; height:22px; font-size:0.6rem;">${getInitials(task.assignee)}</span>
        ` : ''}
      </div>
      ${task.deadline ? `
        <div style="margin-top:8px;">
          <span class="task-meta-item ${overdue ? 'deadline-overdue' : ''}">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M2 6h12M5.5 1v3M10.5 1v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            ${deadlineText}
          </span>
        </div>
      ` : ''}
      ${task.tags && task.tags.length > 0 ? `
        <div class="board-card-tags" style="margin-top:8px;">
          ${task.tags.map(t => `<span class="task-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
    `;

    card.addEventListener('click', () => openEditModal(task.id));
    return card;
  }

  // ─── CRUD ───
  function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.status = task.status === 'done' ? 'todo' : 'done';
    saveTasks();
    renderTasks();
    updateCounts();
    updateProgress();
    showToast(task.status === 'done' ? 'Task completed!' : 'Task reopened', 'success');
  }

  function addTask(data) {
    const task = {
      id: generateId(),
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      deadline: data.deadline,
      assignee: data.assignee,
      tags: data.tags || [],
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateCounts();
    updateProgress();
    showToast('Task created successfully', 'success');
  }

  function updateTask(id, data) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    tasks[idx] = { ...tasks[idx], ...data };
    saveTasks();
    renderTasks();
    updateCounts();
    updateProgress();
    showToast('Task updated', 'success');
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateCounts();
    updateProgress();
    showToast('Task deleted', 'info');
  }

  // ─── COUNTS ───
  function updateCounts() {
    const today = getToday();

    $('#badge-all').textContent = tasks.length;
    $('#badge-today').textContent = tasks.filter(t => t.deadline === today && t.status !== 'done').length;
    $('#badge-upcoming').textContent = tasks.filter(t => t.deadline && t.deadline >= today && t.status !== 'done').length;
    $('#badge-overdue').textContent = tasks.filter(t => isOverdue(t.deadline) && t.status !== 'done').length;
    $('#badge-in-progress').textContent = tasks.filter(t => t.status === 'in-progress').length;
    $('#badge-review').textContent = tasks.filter(t => t.status === 'review').length;
    $('#badge-completed').textContent = tasks.filter(t => t.status === 'done').length;
    $('#badge-high').textContent = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
    $('#badge-medium').textContent = tasks.filter(t => t.priority === 'medium' && t.status !== 'done').length;
    $('#badge-low').textContent = tasks.filter(t => t.priority === 'low' && t.status !== 'done').length;

    // Team counts
    $$('.team-item .team-task-count').forEach(el => {
      const member = el.closest('.team-item').dataset.member;
      el.textContent = tasks.filter(t => t.assignee === member && t.status !== 'done').length;
    });
  }

  function updateCategoryTabCounts() {
    let base = [...tasks];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    const el = (id) => document.getElementById(id);
    el('catCountAll').textContent = base.length;
    el('catCountOverdue').textContent = base.filter(t => isOverdue(t.deadline) && t.status !== 'done').length;
    el('catCountInProgress').textContent = base.filter(t => t.status === 'in-progress').length;
    el('catCountReview').textContent = base.filter(t => t.status === 'review').length;
    el('catCountDone').textContent = base.filter(t => t.status === 'done').length;
  }

  function updateProgress() {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const circumference = 2 * Math.PI * 22;

    progressRing.style.strokeDashoffset = circumference - (pct / 100) * circumference;
    progressText.textContent = `${pct}%`;
    progressDetail.textContent = `${done} / ${total} tasks`;
  }

  // ─── CATEGORY TABS ───
  function bindCategoryTabs() {
    $$('.cat-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        currentCategoryTab = tab.dataset.cat;
        $$('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTasks();
      });
    });
  }

  // ─── TEAM LIST ───
  function renderTeamList() {
    teamList.innerHTML = '';
    TEAM_MEMBERS.forEach((m) => {
      const item = document.createElement('div');
      item.className = `team-item${currentTeamFilter === m.name && showMemberDashboard ? ' active' : ''}`;
      item.dataset.member = m.name;
      item.innerHTML = `
        <span class="team-avatar" style="background:${m.color}">${getInitials(m.name)}</span>
        <span>${m.name}</span>
        <span class="team-task-count">${tasks.filter(t => t.assignee === m.name && t.status !== 'done').length}</span>
      `;
      item.addEventListener('click', () => {
        // Open member dashboard
        currentTeamFilter = m.name;
        showMemberDashboard = true;
        currentFilter = 'all';

        $$('.nav-item').forEach(n => n.classList.remove('active'));
        $$('.team-item').forEach(ti => ti.classList.remove('active'));
        item.classList.add('active');

        renderTasks();
        closeMobileSidebar();
      });
      teamList.appendChild(item);
    });
  }

  // ─── TEAM MEMBER DASHBOARD ───
  function renderMemberDashboard(memberName) {
    const member = getMember(memberName);
    if (!member) return;

    const memberTasks = tasks.filter(t => t.assignee === memberName);
    const today = getToday();
    const activeTasks = memberTasks.filter(t => t.status !== 'done');
    const doneTasks = memberTasks.filter(t => t.status === 'done');
    const overdueTasks = memberTasks.filter(t => isOverdue(t.deadline) && t.status !== 'done');

    // Profile
    const dashAvatar = $('#dashAvatar');
    dashAvatar.textContent = getInitials(member.name);
    dashAvatar.style.background = member.color;
    $('#dashName').textContent = member.name;
    $('#dashRole').textContent = member.role;

    // Stats
    $('#dashTotal').textContent = memberTasks.length;
    $('#dashActive').textContent = activeTasks.length;
    $('#dashDone').textContent = doneTasks.length;
    $('#dashOverdue').textContent = overdueTasks.length;

    // Area of Excellence (computed from task tags)
    const tagCounts = {};
    memberTasks.forEach(t => {
      (t.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    // Also include member expertise
    member.expertise.forEach(e => {
      if (!tagCounts[e]) tagCounts[e] = 0;
      tagCounts[e] += 1; // boost
    });

    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const excellenceEl = $('#dashExcellence');
    excellenceEl.innerHTML = sortedTags.map(([tag, count]) => `
      <div class="excellence-tag">
        ${escapeHtml(tag)}
        <span class="tag-count">${count}</span>
      </div>
    `).join('');

    // Workload breakdown
    const statuses = [
      { key: 'todo', label: 'To Do', cls: 'todo' },
      { key: 'in-progress', label: 'In Progress', cls: 'in-progress' },
      { key: 'review', label: 'Review', cls: 'review' },
      { key: 'done', label: 'Done', cls: 'done' },
    ];
    const maxCount = Math.max(1, ...statuses.map(s => memberTasks.filter(t => t.status === s.key).length));
    const workloadEl = $('#dashWorkload');
    workloadEl.innerHTML = statuses.map(s => {
      const count = memberTasks.filter(t => t.status === s.key).length;
      const pct = Math.round((count / maxCount) * 100);
      return `
        <div class="workload-row">
          <span class="workload-label">${s.label}</span>
          <div class="workload-bar-bg">
            <div class="workload-bar-fill ${s.cls}" style="width: ${pct}%"></div>
          </div>
          <span class="workload-value">${count}</span>
        </div>
      `;
    }).join('');

    // Assigned tasks list (active first)
    const dashTasksEl = $('#dashTasks');
    const sortedMemberTasks = [...memberTasks].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      const prioOrder = { high: 0, medium: 1, low: 2 };
      return prioOrder[a.priority] - prioOrder[b.priority];
    });

    dashTasksEl.innerHTML = '';
    sortedMemberTasks.forEach((task, i) => {
      dashTasksEl.appendChild(createTaskCard(task, i));
    });

    if (sortedMemberTasks.length === 0) {
      dashTasksEl.innerHTML = '<div class="empty-state visible" style="padding:40px"><h3>No tasks assigned</h3><p>This team member has no tasks yet.</p></div>';
    }

    // Back button
    $('#dashBackBtn').onclick = () => {
      showMemberDashboard = false;
      currentTeamFilter = null;
      $$('.team-item').forEach(ti => ti.classList.remove('active'));
      $('#nav-all').classList.add('active');
      currentFilter = 'all';
      renderTasks();
    };
  }

  // ─── SIDEBAR BINDINGS ───
  function bindSidebar() {
    $$('.nav-item[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        currentTeamFilter = null;
        showMemberDashboard = false;
        currentCategoryTab = 'all-tasks';
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        btn.classList.add('active');
        $$('.team-item').forEach(ti => ti.classList.remove('active'));
        $$('.cat-tab').forEach(t => t.classList.remove('active'));
        if ($('#catAll')) $('#catAll').classList.add('active');
        renderTasks();
        closeMobileSidebar();
      });
    });

    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
    });

    sidebarOverlay.addEventListener('click', closeMobileSidebar);
    $('#sidebarToggle').addEventListener('click', closeMobileSidebar);
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }

  // ─── MODAL BINDINGS ───
  function bindModal() {
    $('#addTaskBtn').addEventListener('click', openAddModal);
    $('#modalClose').addEventListener('click', closeTaskModal);
    $('#modalCancel').addEventListener('click', closeTaskModal);
    taskModal.addEventListener('click', (e) => {
      if (e.target === taskModal) closeTaskModal();
    });

    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit();
    });

    $('#deleteModalClose').addEventListener('click', closeDeleteModal);
    $('#deleteCancelBtn').addEventListener('click', closeDeleteModal);
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });

    $('#deleteConfirmBtn').addEventListener('click', () => {
      if (deleteTaskId) {
        deleteTask(deleteTaskId);
        deleteTaskId = null;
      }
      closeDeleteModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (taskModal.classList.contains('active')) closeTaskModal();
        if (deleteModal.classList.contains('active')) closeDeleteModal();
      }
    });
  }

  function openAddModal() {
    editingTaskId = null;
    currentTags = [];
    currentSuggestion = null;
    taskForm.reset();
    renderTagChips();
    hideSuggestion();
    hideAutocomplete();
    $('#modalTitle').textContent = 'Add New Task';
    $('#modalSubmit span').textContent = 'Save Task';
    $('#taskId').value = '';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    $('#taskDeadline').value = tomorrow.toISOString().split('T')[0];

    taskModal.classList.add('active');
    setTimeout(() => $('#taskTitle').focus(), 200);
  }

  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    currentTags = [...(task.tags || [])];
    currentSuggestion = null;

    $('#taskTitle').value = task.title;
    $('#taskDescription').value = task.description || '';
    $('#taskPriority').value = task.priority;
    $('#taskStatus').value = task.status;
    $('#taskDeadline').value = task.deadline || '';
    $('#taskAssignee').value = task.assignee || '';
    $('#taskId').value = id;
    $('#modalTitle').textContent = 'Edit Task';
    $('#modalSubmit span').textContent = 'Update Task';
    renderTagChips();
    hideSuggestion();
    hideAutocomplete();

    taskModal.classList.add('active');
  }

  function closeTaskModal() {
    taskModal.classList.remove('active');
    editingTaskId = null;
    currentTags = [];
    currentSuggestion = null;
    hideSuggestion();
    hideAutocomplete();
  }

  function openDeleteModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    deleteTaskId = id;
    $('#deleteTaskName').textContent = task.title;
    deleteModal.classList.add('active');
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteTaskId = null;
  }

  function handleFormSubmit() {
    const title = $('#taskTitle').value.trim();
    if (!title) {
      $('#taskTitle').focus();
      showToast('Please enter a task title', 'error');
      return;
    }

    const data = {
      title,
      description: $('#taskDescription').value.trim(),
      priority: $('#taskPriority').value,
      status: $('#taskStatus').value,
      deadline: $('#taskDeadline').value || '',
      assignee: $('#taskAssignee').value,
      tags: [...currentTags],
    };

    if (editingTaskId) {
      updateTask(editingTaskId, data);
    } else {
      addTask(data);
    }

    closeTaskModal();
  }

  // ─── SMART SUGGESTIONS ───
  function bindSmartSuggestions() {
    const titleInput = $('#taskTitle');
    let debounce;

    titleInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const val = titleInput.value.trim().toLowerCase();
        if (val.length < 3 || editingTaskId) {
          hideSuggestion();
          return;
        }

        // Match against templates (using word boundaries to prevent partial matches)
        const match = SUGGESTION_TEMPLATES.find(t =>
          t.keywords.some(kw => new RegExp(`\\b${kw}`, 'i').test(val))
        );

        if (match) {
          currentSuggestion = match.suggestion;
          showSuggestion(match.suggestion.text);
        } else {
          hideSuggestion();
        }

        // Autocomplete from existing tasks
        showAutocomplete(val);
      }, 300);
    });

    // Apply suggestion
    $('#smartSuggestionApply').addEventListener('click', () => {
      if (!currentSuggestion) return;

      if (currentSuggestion.priority) $('#taskPriority').value = currentSuggestion.priority;
      if (currentSuggestion.assignee) $('#taskAssignee').value = currentSuggestion.assignee;
      if (currentSuggestion.tags) {
        currentSuggestion.tags.forEach(t => {
          if (!currentTags.includes(t)) currentTags.push(t);
        });
        renderTagChips();
      }
      hideSuggestion();
      showToast('Suggestion applied!', 'success');
    });

    // Dismiss suggestion
    $('#smartSuggestionDismiss').addEventListener('click', hideSuggestion);

    // Keyboard navigation for autocomplete
    titleInput.addEventListener('keydown', (e) => {
      const items = titleAutocomplete.querySelectorAll('.autocomplete-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        acHighlightIndex = Math.min(acHighlightIndex + 1, items.length - 1);
        updateAcHighlight(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        acHighlightIndex = Math.max(acHighlightIndex - 1, 0);
        updateAcHighlight(items);
      } else if (e.key === 'Enter' && acHighlightIndex >= 0) {
        e.preventDefault();
        items[acHighlightIndex].click();
      }
    });

    // Close autocomplete on blur
    titleInput.addEventListener('blur', () => {
      setTimeout(hideAutocomplete, 200);
    });
  }

  function showSuggestion(text) {
    $('#smartSuggestionText').textContent = text;
    smartSuggestion.classList.remove('hidden');
  }

  function hideSuggestion() {
    smartSuggestion.classList.add('hidden');
    currentSuggestion = null;
  }

  function showAutocomplete(query) {
    // Find matching existing task titles
    const matches = tasks
      .filter(t => t.title.toLowerCase().includes(query) && t.title.toLowerCase() !== query)
      .slice(0, 5);

    // Also add "template" suggestions
    const templates = [
      'Design ', 'Implement ', 'Fix ', 'Update ', 'Write ', 'Test ', 'Review ', 'Deploy ', 'Configure ', 'Optimize '
    ].filter(t => t.toLowerCase().startsWith(query) && query.length < t.length);

    if (matches.length === 0 && templates.length === 0) {
      hideAutocomplete();
      return;
    }

    acHighlightIndex = -1;
    titleAutocomplete.innerHTML = '';

    // Existing task matches
    matches.forEach(t => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.innerHTML = `
        <span class="ac-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2v10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></span>
        <span class="ac-label">${escapeHtml(t.title)}</span>
        <span class="ac-hint">existing</span>
      `;
      div.addEventListener('click', () => {
        $('#taskTitle').value = t.title;
        hideAutocomplete();
        // Trigger suggestion check
        const ev = new Event('input', { bubbles: true });
        $('#taskTitle').dispatchEvent(ev);
      });
      titleAutocomplete.appendChild(div);
    });

    // Template suggestions
    templates.slice(0, 3).forEach(t => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.innerHTML = `
        <span class="ac-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l2 4 4.5.6-3.3 3.1.8 4.5L7 11l-4 2.2.8-4.5L.5 5.6 5 5l2-4z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg></span>
        <span class="ac-label">${escapeHtml(t)}</span>
        <span class="ac-hint">template</span>
      `;
      div.addEventListener('click', () => {
        $('#taskTitle').value = t;
        $('#taskTitle').focus();
        hideAutocomplete();
      });
      titleAutocomplete.appendChild(div);
    });

    titleAutocomplete.classList.remove('hidden');
  }

  function hideAutocomplete() {
    titleAutocomplete.classList.add('hidden');
    acHighlightIndex = -1;
  }

  function updateAcHighlight(items) {
    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === acHighlightIndex);
    });
  }

  // ─── TAGS ───
  function bindFormTags() {
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagInput.value.trim().toLowerCase();
        if (tag && !currentTags.includes(tag)) {
          currentTags.push(tag);
          renderTagChips();
        }
        tagInput.value = '';
      }

      if (e.key === 'Backspace' && !tagInput.value && currentTags.length > 0) {
        currentTags.pop();
        renderTagChips();
      }
    });
  }

  function renderTagChips() {
    tagChips.innerHTML = currentTags.map((tag, i) => `
      <span class="tag-chip">
        ${escapeHtml(tag)}
        <span class="tag-chip-remove" data-index="${i}">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </span>
      </span>
    `).join('');

    tagChips.querySelectorAll('.tag-chip-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTags.splice(parseInt(btn.dataset.index), 1);
        renderTagChips();
      });
    });
  }

  // ─── SEARCH ───
  function bindSearch() {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        searchQuery = searchInput.value.trim();
        renderTasks();
      }, 200);
    });
  }

  // ─── VIEW TOGGLE ───
  function bindViewToggle() {
    $$('.view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        currentView = view;
        $$('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (showMemberDashboard) return; // don't switch from dashboard

        if (view === 'list') {
          taskListView.classList.remove('hidden');
          boardView.classList.add('hidden');
        } else {
          taskListView.classList.add('hidden');
          boardView.classList.remove('hidden');
        }
      });
    });
  }

  // ─── TOAST ───
  function showToast(message, type = 'info') {
    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M6 9l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M9 6v3M9 11.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M9 8v4M9 6.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ─── UTILITIES ───
  function statusLabel(status) {
    const map = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
    return map[status] || status;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── KEYBOARD SHORTCUTS ───
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'n' && !isInputFocused() && !taskModal.classList.contains('active')) {
      e.preventDefault();
      openAddModal();
    }
  });

  function isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
  }

  // ─── START ───
  init();
})();
