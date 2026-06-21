/**
 * Academy admin — yogabrata / aam
 * Distinguish real portal sessions vs simulated bots.
 */
(function () {
  const ADMIN_USER = 'yogabrata';
  const ADMIN_PASS = 'aam';
  const ADMIN_SESSION = 'anyo_admin_session_v1';

  const gate = document.getElementById('adminLoginGate');
  const dash = document.getElementById('adminDashboard');
  const logoutBtn = document.getElementById('adminLogout');

  function isAdmin() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION) === 'ok';
    } catch {
      return false;
    }
  }

  function setAdmin(ok) {
    if (ok) sessionStorage.setItem(ADMIN_SESSION, 'ok');
    else sessionStorage.removeItem(ADMIN_SESSION);
  }

  function showDashboard() {
    gate.hidden = true;
    dash.hidden = false;
    logoutBtn.hidden = false;
    refreshDashboard();
    setInterval(refreshDashboard, 30000);
  }

  document.getElementById('adminLoginBtn')?.addEventListener('click', () => {
    const u = document.getElementById('adminUser').value.trim();
    const p = document.getElementById('adminPass').value;
    const err = document.getElementById('adminLoginError');
    if (u !== ADMIN_USER || p !== ADMIN_PASS) {
      err.textContent = 'Invalid admin credentials.';
      err.hidden = false;
      return;
    }
    err.hidden = true;
    setAdmin(true);
    showDashboard();
  });

  logoutBtn?.addEventListener('click', () => {
    setAdmin(false);
    location.reload();
  });

  async function refreshDashboard() {
    const roster = await window.AnyoBots.loadRoster();
    const real = window.AnyoPresence.countRealByRole();
    const counts = window.AnyoPresence.getOnlineCounts(real.students, real.teachers);

    document.getElementById('adminIstNote').textContent =
      `IST ${counts.istLabel} · ${counts.isPeak ? 'Peak study hours' : 'Off-peak'} · min ${window.AnyoPresence.MIN_STUDENTS} students enforced`;

    const statsEl = document.getElementById('adminStats');
    statsEl.innerHTML = `
      <div class="admin-stat-card"><strong>${counts.teachersOnline}</strong><span>Teachers online</span></div>
      <div class="admin-stat-card"><strong>${counts.studentsOnline}</strong><span>Students online</span></div>
      <div class="admin-stat-card"><strong>${real.users.length}</strong><span>Real sessions (local)</span></div>
      <div class="admin-stat-card"><strong>${counts.teacherBotsOnline + counts.studentBotsOnline}</strong><span>Simulated bots online</span></div>
      <div class="admin-stat-card"><strong>${roster.totalTeachers}</strong><span>Teacher bots in roster</span></div>
      <div class="admin-stat-card"><strong>${roster.totalStudents}</strong><span>Student bots in roster</span></div>`;

    const onlineTeachers = window.AnyoPresence.pickOnlineBotIds(roster.teachers, counts.teacherBotsOnline, 'teacher');
    const onlineStudents = window.AnyoPresence.pickOnlineBotIds(roster.students, counts.studentBotsOnline, 'student');

    fillRealUsers(real.users);
    fillTeachers(roster.teachers, onlineTeachers);
    fillStudents(roster.students, onlineStudents);
  }

  function fillRealUsers(users) {
    const tbody = document.querySelector('#realUsersTable tbody');
    tbody.innerHTML = '';
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="5"><em>No real portal sessions in the last 2 minutes on this browser.</em></td></tr>';
      return;
    }
    users.forEach((u) => {
      const tr = document.createElement('tr');
      tr.className = 'real-row';
      const ago = Math.round((Date.now() - u.lastSeen) / 1000);
      tr.innerHTML = `
        <td><span class="admin-badge real">REAL</span></td>
        <td>${escapeHtml(u.username)}</td>
        <td>${escapeHtml(u.role || 'student')}</td>
        <td>${escapeHtml(u.page || '—')}</td>
        <td><span class="admin-badge online">${ago}s ago</span></td>`;
      tbody.appendChild(tr);
    });
  }

  function fillTeachers(teachers, onlineSet) {
    const tbody = document.querySelector('#teachersTable tbody');
    tbody.innerHTML = '';
    teachers.forEach((t) => {
      const on = onlineSet.has(t.id);
      const tr = document.createElement('tr');
      tr.className = 'bot-row';
      tr.innerHTML = `
        <td><span class="admin-badge bot">BOT</span></td>
        <td>${escapeHtml(t.name)}</td>
        <td>${escapeHtml(t.subject)}</td>
        <td>${escapeHtml(t.location)}</td>
        <td><span class="admin-badge ${on ? 'online' : 'offline'}">${on ? 'Online' : 'Offline'}</span></td>`;
      tbody.appendChild(tr);
    });
  }

  function fillStudents(students, onlineSet) {
    const tbody = document.querySelector('#studentsTable tbody');
    tbody.innerHTML = '';
    const online = students.filter((s) => onlineSet.has(s.id)).slice(0, 60);
    online.forEach((s) => {
      const tr = document.createElement('tr');
      tr.className = 'bot-row';
      tr.innerHTML = `
        <td><span class="admin-badge bot">BOT</span></td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.subject)}</td>
        <td>${escapeHtml(s.location)}</td>
        <td><span class="admin-badge online">Online</span></td>`;
      tbody.appendChild(tr);
    });
    if (!online.length) {
      tbody.innerHTML = '<tr><td colspan="5"><em>No student bots marked online this minute.</em></td></tr>';
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  if (isAdmin()) showDashboard();
})();
