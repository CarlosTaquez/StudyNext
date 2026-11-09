(() => {
  'use strict';
  const KEY = 'studynext.academic.v1';
  const EVENT_KEY = 'studynext.dashboard.events.v1';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } };
  const getData = () => { const data = read(KEY, {}); return { subjects: Array.isArray(data.subjects) ? data.subjects : [], tasks: Array.isArray(data.tasks) ? data.tasks : [] }; };
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = dateKey(today);
  const fmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' });
  const fmtShort = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
  const subjectName = (id, subjects) => subjects.find((s) => s.id === id)?.name || 'Sin materia';
  const dueStatus = (value) => { if (!value) return 'Sin fecha'; if (value === dateKey(today)) return 'Hoy'; const d = new Date(`${value}T00:00:00`); const delta = Math.round((d - today) / 86400000); if (delta === 1) return 'Mañana'; if (delta === -1) return 'Ayer'; return fmtShort.format(d); };
  const empty = (title, text) => `<div class="empty"><b>${title}</b>${text}</div>`;
  const taskCard = (task, subjects) => `<article class="dash-row"><span class="row-mark ${task.done ? 'is-done' : task.dueDate && task.dueDate < dateKey(today) ? 'is-late' : ''}">${task.done ? '✓' : '•'}</span><div><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(subjectName(task.subjectId, subjects))} · ${task.done ? 'Completada' : task.dueDate && task.dueDate < dateKey(today) ? 'Atrasada' : 'Entrega ' + dueStatus(task.dueDate)}</small></div><span class="row-date">${escapeHtml(dueStatus(task.dueDate))}</span></article>`;
  function renderHome(data) {
    const pending = data.tasks.filter((t) => !t.done);
    const done = data.tasks.filter((t) => t.done);
    const dueSorted = pending.filter((t) => t.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(today);
    document.querySelector('#pending-total').textContent = pending.length;
    document.querySelector('#completed-total').textContent = done.length;
    document.querySelector('#subject-total').textContent = data.subjects.length;
    const next = dueSorted[0];
    document.querySelector('#next-title').textContent = next ? next.title : 'Vas al día';
    document.querySelector('#next-meta').textContent = next ? `${subjectName(next.subjectId, data.subjects)} · ${next.dueDate < dateKey(today) ? 'Está atrasada' : 'Fecha de entrega'}` : 'Agrega una tarea para verla aquí.';
    document.querySelector('#next-date').textContent = next ? dueStatus(next.dueDate) : '✓';
    const todayTasks = pending.filter((t) => t.dueDate === dateKey(today));
    document.querySelector('#today-tasks').innerHTML = todayTasks.length ? todayTasks.map((t) => taskCard(t, data.subjects)).join('') : empty('No hay entregas para hoy', 'Puedes revisar tus próximos pendientes en el calendario.');
    document.querySelector('#home-subjects').innerHTML = data.subjects.length ? data.subjects.slice(0, 4).map((s) => `<article class="dash-row"><span class="subject-dot">${escapeHtml(s.emoji || '📘')}</span><div><strong>${escapeHtml(s.name)}</strong><small>${data.tasks.filter((t) => t.subjectId === s.id && !t.done).length} pendientes</small></div><a class="row-date" href="academico.html">Ver tareas</a></article>`).join('') : empty('Aún no tienes materias', 'Crea una materia para comenzar.');
    const percent = data.tasks.length ? Math.round(done.length / data.tasks.length * 100) : 0;
    document.querySelector('#progress-percent').textContent = `${percent}%`;
    document.querySelector('#progress-ring').style.setProperty('--progress', `${percent}%`);
    document.querySelector('#progress-caption').textContent = data.tasks.length ? `${done.length} de ${data.tasks.length} tareas completadas.` : 'Completa una tarea para empezar a ver tu progreso.';
  }
  function renderCalendar(data) {
    document.querySelector('#month-title').textContent = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(month);
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first); start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const events = read(EVENT_KEY, []);
    const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const cells = weekdays.map((d) => `<div class="weekday">${d}</div>`);
    for (let i = 0; i < 42; i++) {
      const date = new Date(start); date.setDate(start.getDate() + i);
      const key = dateKey(date);
      const count = data.tasks.filter((t) => !t.done && t.dueDate === key).length + events.filter((e) => e.date === key).length;
      cells.push(`<button type="button" role="gridcell" class="calendar-day${date.getMonth() !== month.getMonth() ? ' outside' : ''}${key === dateKey(today) ? ' is-today' : ''}${key === selectedDate ? ' is-selected' : ''}" data-date="${key}" aria-label="${escapeHtml(new Intl.DateTimeFormat('es-CO', { dateStyle: 'full' }).format(date))}${count ? `, ${count} actividades` : ''}"><span>${date.getDate()}</span>${count ? `<i>${count} ${count === 1 ? 'actividad' : 'actividades'}</i>` : ''}</button>`);
    }
    document.querySelector('#calendar-grid').innerHTML = cells.join('');
    renderSelected(data, events);
  }
  function renderSelected(data, events = read(EVENT_KEY, [])) {
    const date = new Date(`${selectedDate}T00:00:00`);
    document.querySelector('#selected-date-title').textContent = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    const tasks = data.tasks.filter((t) => t.dueDate === selectedDate).map((t) => taskCard(t, data.subjects));
    const dayEvents = events.filter((e) => e.date === selectedDate).map((e) => `<article class="dash-row"><span class="row-mark event-mark">✦</span><div><strong>${escapeHtml(e.title)}</strong><small>Evento de estudio</small></div><button class="delete-event" type="button" data-delete-event="${escapeHtml(e.id)}" aria-label="Eliminar ${escapeHtml(e.title)}">×</button></article>`);
    const items = [...tasks, ...dayEvents];
    document.querySelector('#selected-day-items').innerHTML = items.length ? items.join('') : empty('Día libre', 'No tienes tareas ni eventos para esta fecha.');
  }
  function renderNotifications(data) {
    const events = read(EVENT_KEY, []);
    const tasks = data.tasks.filter((t) => !t.done && t.dueDate).map((task) => ({ task, delta: Math.round((new Date(`${task.dueDate}T00:00:00`) - today) / 86400000) })).filter(({ delta }) => delta <= 7).sort((a, b) => a.delta - b.delta);
    const late = tasks.filter(({ delta }) => delta < 0).length;
    document.querySelector('#notice-count').textContent = String(tasks.length);
    document.querySelector('#notice-count').hidden = tasks.length === 0;
    document.querySelector('#notice-summary').innerHTML = `<article><strong>${tasks.length}</strong><span>entregas próximas</span></article><article class="late-summary"><strong>${late}</strong><span>tareas atrasadas</span></article><article><strong>${events.filter((e) => e.date >= dateKey(today)).length}</strong><span>eventos agendados</span></article>`;
    document.querySelector('#notifications-list').innerHTML = tasks.length ? tasks.map(({ task, delta }) => `<article class="dash-row notification-row"><span class="row-mark ${delta < 0 ? 'is-late' : delta <= 1 ? 'is-soon' : ''}">${delta < 0 ? '!' : '◷'}</span><div><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(subjectName(task.subjectId, data.subjects))} · ${delta < 0 ? `Atrasada hace ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'día' : 'días'}` : delta === 0 ? 'Entrega hoy' : delta === 1 ? 'Entrega mañana' : `Entrega en ${delta} días`}</small></div><span class="row-date">${escapeHtml(dueStatus(task.dueDate))}</span></article>`).join('') : empty('Todo tranquilo por aquí', 'No tienes tareas atrasadas ni entregas en los próximos 7 días.');
  }
  function renderProgress(data) {
    const pending = data.tasks.filter((t) => !t.done).length;
    const done = data.tasks.length - pending;
    const late = data.tasks.filter((t) => !t.done && t.dueDate && t.dueDate < dateKey(today)).length;
    document.querySelector('#progress-done').textContent = done;
    document.querySelector('#progress-pending').textContent = pending;
    document.querySelector('#progress-late').textContent = late;
    document.querySelector('#subject-progress').innerHTML = data.subjects.length ? data.subjects.map((subject) => {
      const tasks = data.tasks.filter((t) => t.subjectId === subject.id);
      const completed = tasks.filter((t) => t.done).length;
      const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
      return `<article class="subject-progress-row"><div class="subject-progress-top"><span>${escapeHtml(subject.emoji || '📘')} ${escapeHtml(subject.name)}</span><b>${percent}%</b></div><div class="progress-track"><span style="width:${percent}%"></span></div><small>${completed} de ${tasks.length} ${tasks.length === 1 ? 'tarea completada' : 'tareas completadas'}</small></article>`;
    }).join('') : empty('Aún no tienes materias', 'Tus estadísticas aparecerán cuando agregues materias y tareas.');
  }
  function render() {
    const data = getData();
    renderHome(data); renderCalendar(data); renderNotifications(data); renderProgress(data);
    const page = location.hash.slice(1) || 'home';
    const valid = ['home', 'calendar', 'notifications', 'progress'].includes(page) ? page : 'home';
    document.querySelectorAll('[data-page]').forEach((el) => { el.hidden = el.dataset.page !== valid; });
    document.querySelectorAll('[data-view]').forEach((el) => el.classList.toggle('active', el.dataset.view === valid));
    document.querySelector('#breadcrumb').textContent = ({ home: 'Inicio', calendar: 'Calendario', notifications: 'Notificaciones', progress: 'Progreso' })[valid];
  }
  document.addEventListener('click', (event) => {
    const view = event.target.closest('[data-view]');
    if (view) { event.preventDefault(); const hash = view.dataset.view === 'home' ? '' : `#${view.dataset.view}`; history.pushState(null, '', `dashboard.html${hash}`); render(); window.scrollTo(0, 0); }
    const day = event.target.closest('[data-date]');
    if (day) { selectedDate = day.dataset.date; renderCalendar(getData()); }
    if (event.target.closest('#prev-month')) { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); renderCalendar(getData()); }
    if (event.target.closest('#next-month')) { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); renderCalendar(getData()); }
    if (event.target.closest('#go-today')) { month = new Date(today.getFullYear(), today.getMonth(), 1); selectedDate = dateKey(today); renderCalendar(getData()); }
    if (event.target.closest('#add-event')) {
      const title = window.prompt('¿Qué evento quieres agendar?');
      if (!title?.trim()) return;
      const events = read(EVENT_KEY, []);
      events.push({ id: crypto.randomUUID(), title: title.trim().slice(0, 80), date: selectedDate });
      localStorage.setItem(EVENT_KEY, JSON.stringify(events)); renderCalendar(getData()); renderNotifications(getData());
    }
    const remove = event.target.closest('[data-delete-event]');
    if (remove) { localStorage.setItem(EVENT_KEY, JSON.stringify(read(EVENT_KEY, []).filter((e) => e.id !== remove.dataset.deleteEvent))); renderCalendar(getData()); renderNotifications(getData()); }
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('popstate', render);
  window.addEventListener('storage', render);
  render();
})();
