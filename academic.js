(() => {
  'use strict';

  const STORAGE_KEY = 'studynext.academic.v1';
  const palette = [
    { color: '#627fe8', tint: '#edf0ff', tone: '#627fe8' },
    { color: '#36a987', tint: '#e9f7f2', tone: '#36a987' },
    { color: '#e5a34b', tint: '#fff4e4', tone: '#e5a34b' },
    { color: '#aa7bda', tint: '#f4edfb', tone: '#aa7bda' },
    { color: '#e77873', tint: '#fff0ee', tone: '#e77873' },
    { color: '#45a9c7', tint: '#e8f6fa', tone: '#45a9c7' },
  ];
  const emojis = ['📘', '🧪', '🧮', '🌍', '🎨', '💻', '📖', '🎓'];
  const today = new Date();
  const dateOffset = (days) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const initialData = {
    subjects: [
      { id: 'sub-math', name: 'Matemáticas', teacher: 'Álgebra y geometría', emoji: '🧮', palette: 0 },
      { id: 'sub-bio', name: 'Biología', teacher: 'Ciencias naturales', emoji: '🧪', palette: 1 },
      { id: 'sub-lit', name: 'Literatura', teacher: 'Lengua y escritura', emoji: '📖', palette: 3 },
    ],
    tasks: [
      { id: 'task-1', title: 'Ejercicios de ecuaciones', subjectId: 'sub-math', dueDate: dateOffset(1), priority: 'high', notes: '', done: false },
      { id: 'task-2', title: 'Lectura: capítulo 4', subjectId: 'sub-lit', dueDate: dateOffset(2), priority: 'medium', notes: '', done: false },
      { id: 'task-3', title: 'Resumen de la célula', subjectId: 'sub-bio', dueDate: dateOffset(-1), priority: 'low', notes: '', done: false },
      { id: 'task-4', title: 'Problemas de geometría', subjectId: 'sub-math', dueDate: dateOffset(4), priority: 'medium', notes: '', done: true },
    ],
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  let state = loadState();
  let activeFilter = 'all';
  let toastTimer;

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && Array.isArray(stored.subjects) && Array.isArray(stored.tasks)) return stored;
    } catch { /* A damaged local save should not block the app. */ }
    return clone(initialData);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      showToast('No se pudieron guardar los cambios en este navegador.');
    }
  }

  function formatDate(value) {
    if (!value) return 'Sin fecha';
    const [year, month, day] = value.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const delta = Math.round((due - base) / 86400000);
    if (delta === 0) return 'Hoy';
    if (delta === 1) return 'Mañana';
    if (delta === -1) return 'Ayer';
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(due);
  }

  function isOverdue(task) {
    return !task.done && Boolean(task.dueDate) && task.dueDate < dateOffset(0);
  }

  function subjectById(id) {
    return state.subjects.find((subject) => subject.id === id);
  }

  function renderStats() {
    document.querySelector('#subject-count').textContent = state.subjects.length;
    document.querySelector('#pending-count').textContent = state.tasks.filter((task) => !task.done).length;
    document.querySelector('#completed-count').textContent = state.tasks.filter((task) => task.done).length;
  }

  function renderSubjects() {
    const root = document.querySelector('#subject-list');
    if (!state.subjects.length) {
      root.innerHTML = '<div class="empty"><b>Aún no tienes materias</b>Crea tu primera asignatura para empezar a organizarte.</div>';
      return;
    }
    root.innerHTML = state.subjects.map((subject) => {
      const color = palette[(Number(subject.palette) || 0) % palette.length];
      const tasks = state.tasks.filter((task) => task.subjectId === subject.id);
      const total = tasks.length;
      const done = tasks.filter((task) => task.done).length;
      const progress = total ? Math.round((done / total) * 100) : 0;
      return `<article class="subject-card" style="--tint:${color.tint};--tone:${color.tone}">
        <span class="subject-emoji" aria-hidden="true">${escapeHtml(subject.emoji || '📘')}</span>
        <div class="subject-info"><strong>${escapeHtml(subject.name)}</strong><small>${escapeHtml(subject.teacher || 'Sin descripción')} · ${total} ${total === 1 ? 'tarea' : 'tareas'}</small><div class="progress-row"><div class="progress-track" role="progressbar" aria-label="Progreso de ${escapeHtml(subject.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div><small>${progress}%</small></div></div>
        <div class="subject-menu"><button type="button" aria-label="Opciones de ${escapeHtml(subject.name)}" aria-haspopup="true" data-action="subject-menu" data-id="${escapeHtml(subject.id)}">···</button></div></article>`;
    }).join('');
  }

  function renderTasks() {
    const root = document.querySelector('#task-list');
    const filtered = state.tasks.filter((task) => activeFilter === 'all' || (activeFilter === 'pending' && !task.done) || (activeFilter === 'done' && task.done));
    filtered.sort((a, b) => Number(a.done) - Number(b.done) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    if (!filtered.length) {
      const message = activeFilter === 'done' ? 'Las tareas que completes aparecerán aquí.' : activeFilter === 'pending' ? '¡Vas al día! No tienes tareas pendientes.' : 'Agrega una tarea y aparecerá aquí.';
      root.innerHTML = `<div class="empty"><b>${activeFilter === 'pending' ? 'Todo al día 🎉' : 'Todavía no hay tareas'}</b>${message}</div>`;
      return;
    }
    root.innerHTML = filtered.map((task) => {
      const subject = subjectById(task.subjectId);
      const priority = ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium';
      const labels = { high: 'Alta', medium: 'Media', low: 'Baja' };
      return `<article class="task-row${task.done ? ' done' : ''}">
        <button class="check" type="button" aria-label="${task.done ? 'Marcar como pendiente' : 'Marcar como completada'}: ${escapeHtml(task.title)}" aria-pressed="${task.done}" data-action="toggle-task" data-id="${escapeHtml(task.id)}">${task.done ? '<svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7"/></svg>' : ''}</button>
        <div class="task-copy"><strong>${escapeHtml(task.title)}</strong><div class="task-meta"><span>${escapeHtml(subject?.name || 'Sin materia')}</span><span class="tag ${priority}">${labels[priority]}</span><span class="due${isOverdue(task) ? ' late' : ''}">${isOverdue(task) ? 'Atrasada · ' : 'Entrega · '}${escapeHtml(formatDate(task.dueDate))}</span></div></div>
        <div class="subject-menu"><button type="button" aria-label="Opciones de ${escapeHtml(task.title)}" aria-haspopup="true" data-action="task-menu" data-id="${escapeHtml(task.id)}">···</button></div></article>`;
    }).join('');
  }

  function render() {
    renderStats();
    renderSubjects();
    renderTasks();
  }

  function showToast(message) {
    const root = document.querySelector('#toast-root');
    if (!root) return;
    root.innerHTML = `<div class="toast" role="status">${escapeHtml(message)}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { root.innerHTML = ''; }, 2600);
  }

  function openMenu(type, id, anchor) {
    document.querySelector('.menu-popup')?.remove();
    const menu = document.createElement('div');
    menu.className = 'menu-popup';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = type === 'subject'
      ? '<button type="button" role="menuitem" data-action="edit-subject">Editar materia</button><button type="button" role="menuitem" data-action="delete-subject">Eliminar materia</button>'
      : '<button type="button" role="menuitem" data-action="edit-task">Editar tarea</button><button type="button" role="menuitem" data-action="delete-task">Eliminar tarea</button>';
    menu.dataset.menuType = type;
    menu.dataset.id = id;
    anchor.parentElement.append(menu);
  }

  function subjectOptions(selected = '') {
    return state.subjects.map((subject) => `<option value="${escapeHtml(subject.id)}"${subject.id === selected ? ' selected' : ''}>${escapeHtml(subject.name)}</option>`).join('');
  }

  function openModal(kind, existing = null) {
    if (kind === 'task' && !state.subjects.length) {
      showToast('Primero crea una materia para poder agregar tareas.');
      openModal('subject');
      return;
    }
    const editing = Boolean(existing);
    const isSubject = kind === 'subject';
    const data = existing || {};
    const title = isSubject ? (editing ? 'Editar materia' : 'Nueva materia') : (editing ? 'Editar tarea' : 'Nueva tarea');
    const subtitle = isSubject ? 'Mantén tus asignaturas organizadas.' : 'Añade un pendiente a tu lista de estudio.';
    let fields;
    if (isSubject) {
      const paletteIndex = Number(data.palette) || 0;
      fields = `<div class="form-grid">
        <div class="field full"><label for="subject-name">Nombre de la materia</label><input id="subject-name" name="name" maxlength="60" required value="${escapeHtml(data.name || '')}" placeholder="Ej. Física" /></div>
        <div class="field full"><label for="subject-teacher">Profesor o descripción <span style="font-weight:400;color:#929caf">(opcional)</span></label><input id="subject-teacher" name="teacher" maxlength="70" value="${escapeHtml(data.teacher || '')}" placeholder="Ej. Ciencias naturales" /></div>
        <div class="field"><label>Ícono</label><div class="emoji-choices">${emojis.map((emoji) => `<button class="emoji-choice${(data.emoji || '📘') === emoji ? ' chosen' : ''}" type="button" data-emoji="${emoji}" aria-label="Ícono ${emoji}" aria-pressed="${(data.emoji || '📘') === emoji}">${emoji}</button>`).join('')}</div><input type="hidden" name="emoji" value="${escapeHtml(data.emoji || '📘')}" /></div>
        <div class="field"><label>Color</label><div class="color-choices">${palette.map((color, index) => `<button class="color-choice${index === paletteIndex ? ' chosen' : ''}" type="button" data-palette="${index}" aria-label="Color ${index + 1}" aria-pressed="${index === paletteIndex}" style="background:${color.color}"></button>`).join('')}</div><input type="hidden" name="palette" value="${paletteIndex}" /></div>
      </div>`;
    } else {
      fields = `<div class="form-grid">
        <div class="field full"><label for="task-title">Nombre de la tarea</label><input id="task-title" name="title" maxlength="100" required value="${escapeHtml(data.title || '')}" placeholder="Ej. Resolver ejercicios de la página 20" /></div>
        <div class="field"><label for="task-subject">Materia</label><select id="task-subject" name="subjectId" required>${subjectOptions(data.subjectId || state.subjects[0]?.id)}</select></div>
        <div class="field"><label for="task-date">Fecha de entrega</label><input id="task-date" name="dueDate" type="date" value="${escapeHtml(data.dueDate || '')}" /></div>
        <div class="field"><label for="task-priority">Prioridad</label><select id="task-priority" name="priority"><option value="high"${data.priority === 'high' ? ' selected' : ''}>Alta</option><option value="medium"${!data.priority || data.priority === 'medium' ? ' selected' : ''}>Media</option><option value="low"${data.priority === 'low' ? ' selected' : ''}>Baja</option></select></div>
        <div class="field"><label for="task-notes">Notas <span style="font-weight:400;color:#929caf">(opcional)</span></label><textarea id="task-notes" name="notes" maxlength="300" placeholder="Detalles para recordar…">${escapeHtml(data.notes || '')}</textarea></div>
      </div>`;
    }
    document.querySelector('#modal-root').innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="close" type="button" aria-label="Cerrar" data-action="close-modal">×</button></div><form id="editor-form" data-kind="${kind}" data-id="${escapeHtml(data.id || '')}">${fields}<p class="form-error" id="form-error" hidden></p><div class="modal-actions"><button class="secondary" type="button" data-action="close-modal">Cancelar</button><button class="primary" type="submit">${editing ? 'Guardar cambios' : isSubject ? 'Crear materia' : 'Crear tarea'}</button></div></form></section></div>`;
    document.querySelector('#modal-root .modal').addEventListener('click', (event) => event.stopPropagation());
    document.querySelector(isSubject ? '#subject-name' : '#task-title').focus();
  }

  function persistForm(form) {
    const kind = form.dataset.kind;
    const id = form.dataset.id;
    const values = Object.fromEntries(new FormData(form).entries());
    const name = (values.name || values.title || '').trim();
    const error = document.querySelector('#form-error');
    if (!name) {
      error.textContent = kind === 'subject' ? 'Escribe el nombre de la materia.' : 'Escribe el nombre de la tarea.';
      error.hidden = false;
      (kind === 'subject' ? form.elements.name : form.elements.title).focus();
      return;
    }
    if (kind === 'subject') {
      const duplicate = state.subjects.some((subject) => subject.id !== id && subject.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      if (duplicate) {
        error.textContent = 'Ya existe una materia con ese nombre.';
        error.hidden = false;
        form.elements.name.focus();
        return;
      }
      const subject = { id: id || `sub-${crypto.randomUUID()}`, name, teacher: values.teacher.trim(), emoji: values.emoji || '📘', palette: Number(values.palette) || 0 };
      const index = state.subjects.findIndex((item) => item.id === id);
      if (index >= 0) state.subjects[index] = subject;
      else state.subjects.push(subject);
      showToast(index >= 0 ? 'Materia actualizada.' : 'Materia creada.');
    } else {
      const task = { id: id || `task-${crypto.randomUUID()}`, title: name, subjectId: values.subjectId, dueDate: values.dueDate, priority: values.priority, notes: values.notes.trim(), done: state.tasks.find((item) => item.id === id)?.done || false };
      const index = state.tasks.findIndex((item) => item.id === id);
      if (index >= 0) state.tasks[index] = task;
      else state.tasks.push(task);
      showToast(index >= 0 ? 'Tarea actualizada.' : 'Tarea creada.');
    }
    saveState();
    document.querySelector('#modal-root').innerHTML = '';
    render();
  }

  function deleteItem(type, id) {
    if (type === 'subject') {
      const subject = subjectById(id);
      if (!subject) return;
      if (!window.confirm(`¿Eliminar “${subject.name}” y sus tareas? Esta acción no se puede deshacer.`)) return;
      state.subjects = state.subjects.filter((item) => item.id !== id);
      state.tasks = state.tasks.filter((task) => task.subjectId !== id);
      showToast('Materia y tareas eliminadas.');
    } else {
      const task = state.tasks.find((item) => item.id === id);
      if (!task || !window.confirm(`¿Eliminar la tarea “${task.title}”? Esta acción no se puede deshacer.`)) return;
      state.tasks = state.tasks.filter((item) => item.id !== id);
      showToast('Tarea eliminada.');
    }
    saveState();
    render();
  }

  document.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-filter]');
    if (filter) {
      activeFilter = filter.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((button) => {
        const selected = button === filter;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      renderTasks();
      return;
    }

    const sectionLink = event.target.closest('[data-section="tasks"]');
    if (sectionLink) {
      document.querySelector('#tareas').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const button = event.target.closest('[data-action], [data-emoji], [data-palette]');
    if (!button) {
      if (!event.target.closest('.menu-popup')) document.querySelector('.menu-popup')?.remove();
      return;
    }
    const { action, id } = button.dataset;
    if (action === 'new-subject') openModal('subject');
    else if (action === 'new-task') openModal('task');
    else if (action === 'close-modal' || action === 'backdrop-close') document.querySelector('#modal-root').innerHTML = '';
    else if (action === 'subject-menu') openMenu('subject', id, button);
    else if (action === 'task-menu') openMenu('task', id, button);
    else if (action === 'toggle-task') {
      const task = state.tasks.find((item) => item.id === id);
      if (task) { task.done = !task.done; saveState(); render(); showToast(task.done ? 'Tarea completada. ¡Buen trabajo!' : 'Tarea marcada como pendiente.'); }
    } else if (action === 'edit-subject') {
      const menu = button.closest('.menu-popup');
      const subject = subjectById(menu.dataset.id);
      menu.remove();
      if (subject) openModal('subject', subject);
    } else if (action === 'delete-subject') {
      const menu = button.closest('.menu-popup');
      const subjectId = menu.dataset.id;
      menu.remove();
      deleteItem('subject', subjectId);
    } else if (action === 'edit-task') {
      const menu = button.closest('.menu-popup');
      const task = state.tasks.find((item) => item.id === menu.dataset.id);
      menu.remove();
      if (task) openModal('task', task);
    } else if (action === 'delete-task') {
      const menu = button.closest('.menu-popup');
      const taskId = menu.dataset.id;
      menu.remove();
      deleteItem('task', taskId);
    } else if (button.dataset.emoji) {
      const form = button.closest('form');
      form.elements.emoji.value = button.dataset.emoji;
      form.querySelectorAll('[data-emoji]').forEach((choice) => { choice.classList.toggle('chosen', choice === button); choice.setAttribute('aria-pressed', String(choice === button)); });
    } else if (button.dataset.palette !== undefined) {
      const form = button.closest('form');
      form.elements.palette.value = button.dataset.palette;
      form.querySelectorAll('[data-palette]').forEach((choice) => { choice.classList.toggle('chosen', choice === button); choice.setAttribute('aria-pressed', String(choice === button)); });
    }
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'editor-form') return;
    event.preventDefault();
    persistForm(event.target);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelector('#modal-root').innerHTML = '';
      document.querySelector('.menu-popup')?.remove();
    }
  });

  render();
})();
