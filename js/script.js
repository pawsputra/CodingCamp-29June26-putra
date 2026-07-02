/**
 * Life Dashboard â€” script.js
 *
 * Structure:
 *   1.  Constants & Quotes
 *   2.  Application State
 *   3.  Local Storage Helpers
 *   4.  DOM References
 *   5.  Theme Module
 *   6.  Greeting & Clock Module
 *   7.  Focus Timer Module
 *   8.  To-Do List Module
 *   9.  Quick Links Module
 *  10.  Statistics & Progress Module
 *  11.  Modal / Dialog Module
 *  12.  Initialisation
 */

'use strict';

/* ============================================================
   1. CONSTANTS & QUOTES
   ============================================================ */

const STORAGE_KEYS = {
  theme:    'ld_theme',
  name:     'ld_name',
  duration: 'ld_timer_duration',
  todos:    'ld_todos',
  links:    'ld_links',
};

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "Small steps every day lead to big results.",
  "Focus on progress, not perfection.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your only limit is your mind.",
  "Done is better than perfect.",
  "One task at a time. One day at a time.",
  "Work hard in silence; let results make the noise.",
  "The key to success is to start before you are ready.",
  "Consistency builds momentum.",
  "Every expert was once a beginner.",
  "You don't have to be great to start, but you have to start to be great.",
  "Stay focused and never give up.",
  "Productivity is never an accident â€” it is a commitment.",
  "Make each day your masterpiece.",
];

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];


/* ============================================================
   2. APPLICATION STATE
   ============================================================ */

const state = {
  /* Timer */
  timerIntervalId:  null,      // holds setInterval reference â€” null when not running
  timerRunning:     false,     // guard flag to prevent duplicate intervals
  timerTotalSeconds: 25 * 60, // current countdown value in seconds
  timerDuration:    25,        // configured duration in minutes

  /* To-do list */
  todos: [],     // array of { id, text, completed, createdAt }
  todoSortOrder: 'newest',

  /* Quick links */
  links: [],     // array of { id, name, url }

  /* Pending delete callback â€” used by the confirmation modal */
  pendingDeleteCallback: null,

  /* Pending edit state */
  editingTodoId: null,
  editingLinkId: null,
};


/* ============================================================
   3. LOCAL STORAGE HELPERS
   ============================================================ */

const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota exceeded or private browsing â€” fail silently.
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch { /* empty */ }
  },
};


/* ============================================================
   4. DOM REFERENCES
   ============================================================ */

// Header / Greeting
const elGreetingText    = document.getElementById('greeting-text');
const elUserGreeting    = document.getElementById('user-greeting');
const elClockTime       = document.getElementById('clock-time');
const elClockDate       = document.getElementById('clock-date');
const elUserNameInput   = document.getElementById('user-name-input');
const elSaveNameBtn     = document.getElementById('save-name-btn');
const elThemeToggleBtn  = document.getElementById('theme-toggle-btn');

// Timer
const elTimerMinutes    = document.getElementById('timer-minutes');
const elTimerSeconds    = document.getElementById('timer-seconds');
const elTimerDisplay    = document.querySelector('.timer-display');
const elTimerStartBtn   = document.getElementById('timer-start-btn');
const elTimerStopBtn    = document.getElementById('timer-stop-btn');
const elTimerResetBtn   = document.getElementById('timer-reset-btn');
const elTimerDurationInput = document.getElementById('timer-duration-input');
const elTimerSetBtn     = document.getElementById('timer-set-btn');
const elTimerStatus     = document.getElementById('timer-status');

// To-do
const elTodoForm        = document.getElementById('todo-form');
const elTodoInput       = document.getElementById('todo-input');
const elTodoAddBtn      = document.getElementById('todo-add-btn');
const elTodoWarning     = document.getElementById('todo-warning');
const elTodoSortSelect  = document.getElementById('todo-sort-select');
const elTodoList        = document.getElementById('todo-list');
const elTodoEmpty       = document.getElementById('todo-empty');

// Quick Links
const elLinksForm       = document.getElementById('links-form');
const elLinkNameInput   = document.getElementById('link-name-input');
const elLinkUrlInput    = document.getElementById('link-url-input');
const elLinksAddBtn     = document.getElementById('links-add-btn');
const elLinksWarning    = document.getElementById('links-warning');
const elLinksList       = document.getElementById('links-list');
const elLinksEmpty      = document.getElementById('links-empty');

// Statistics
const elStatTotal       = document.getElementById('stat-total');
const elStatCompleted   = document.getElementById('stat-completed');
const elStatPending     = document.getElementById('stat-pending');
const elStatPercent     = document.getElementById('stat-percent');
const elProgressBarFill = document.getElementById('progress-bar-fill');
const elProgressBarTrack = document.getElementById('progress-bar-track');
const elProgressPercentLabel = document.getElementById('progress-percent-label');
const elSummaryActive   = document.getElementById('summary-active');
const elSummaryDone     = document.getElementById('summary-done');
const elSummaryFocus    = document.getElementById('summary-focus');

// Footer
const elQuoteText       = document.getElementById('quote-text');
const elFooterYear      = document.getElementById('footer-year');

// Confirm dialog
const elConfirmDialog   = document.getElementById('confirm-dialog');
const elConfirmBody     = document.getElementById('confirm-body');
const elConfirmOkBtn    = document.getElementById('confirm-ok-btn');
const elConfirmCancelBtn = document.getElementById('confirm-cancel-btn');

// Edit task dialog
const elEditTaskDialog  = document.getElementById('edit-task-dialog');
const elEditTaskInput   = document.getElementById('edit-task-input');
const elEditTaskWarning = document.getElementById('edit-task-warning');
const elEditTaskSaveBtn = document.getElementById('edit-task-save-btn');
const elEditTaskCancelBtn = document.getElementById('edit-task-cancel-btn');

// Edit link dialog
const elEditLinkDialog  = document.getElementById('edit-link-dialog');
const elEditLinkNameInput = document.getElementById('edit-link-name-input');
const elEditLinkUrlInput  = document.getElementById('edit-link-url-input');
const elEditLinkWarning   = document.getElementById('edit-link-warning');
const elEditLinkSaveBtn   = document.getElementById('edit-link-save-btn');
const elEditLinkCancelBtn = document.getElementById('edit-link-cancel-btn');



/* ============================================================
   5. THEME MODULE
   ============================================================ */

/**
 * Apply a theme ('light' or 'dark') to the document and update the
 * toggle button aria-label to describe the action it will perform.
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  elThemeToggleBtn.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

function initTheme() {
  const saved = storage.get(STORAGE_KEYS.theme, 'light');
  applyTheme(saved);
}

function handleThemeToggle() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storage.set(STORAGE_KEYS.theme, next);
}


/* ============================================================
   6. GREETING & CLOCK MODULE
   ============================================================ */

/**
 * Return the appropriate greeting phrase based on the hour (0â€“23).
 */
function getGreetingPhrase(hour) {
  if (hour >= 5  && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

/**
 * Zero-pad a number to two digits.
 */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Update the clock display and greeting text. Called every second.
 */
function updateClock() {
  const now     = new Date();
  const hours   = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Time display
  elClockTime.textContent = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  elClockTime.setAttribute('datetime', now.toISOString());

  // Date display
  const dayName   = DAYS[now.getDay()];
  const monthName = MONTHS[now.getMonth()];
  const dateNum   = now.getDate();
  const year      = now.getFullYear();
  elClockDate.textContent = `${dayName}, ${monthName} ${dateNum}, ${year}`;

  // Greeting phrase (only update text node, not whole element, to avoid screen-reader spam)
  const phrase = getGreetingPhrase(hours);
  if (elGreetingText.textContent !== phrase) {
    elGreetingText.textContent = phrase;
  }
}

/**
 * Read the saved name (if any) and build the personalised greeting h1.
 */
function renderUserGreeting() {
  const name = storage.get(STORAGE_KEYS.name, '');
  if (name && name.trim().length > 0) {
    const phrase = getGreetingPhrase(new Date().getHours());
    elUserGreeting.textContent = `${phrase}, ${name.trim()}!`;
    elUserNameInput.value = name.trim();
  } else {
    elUserGreeting.textContent = 'Welcome!';
  }
}

function handleSaveName() {
  const name = elUserNameInput.value.trim();
  if (name.length === 0) {
    storage.remove(STORAGE_KEYS.name);
    elUserGreeting.textContent = 'Welcome!';
    return;
  }
  storage.set(STORAGE_KEYS.name, name);
  renderUserGreeting();
}

function initGreeting() {
  // Render immediately, then start the 1-second interval.
  updateClock();
  renderUserGreeting();
  setInterval(updateClock, 1000);
}


/* ============================================================
   7. FOCUS TIMER MODULE
   ============================================================ */

/**
 * Render the current timerTotalSeconds to the MM:SS display.
 */
function renderTimerDisplay() {
  const mins = Math.floor(state.timerTotalSeconds / 60);
  const secs = state.timerTotalSeconds % 60;
  elTimerMinutes.textContent = pad2(mins);
  elTimerSeconds.textContent = pad2(secs);

  // Update progress bar track aria attribute
  const totalSecs = state.timerDuration * 60;
  const elapsed   = totalSecs - state.timerTotalSeconds;
  const pct       = totalSecs > 0 ? Math.round((elapsed / totalSecs) * 100) : 0;
  elTimerDisplay.setAttribute('aria-valuenow', state.timerTotalSeconds);
}

/**
 * Remove running/done CSS classes from the timer display box.
 */
function clearTimerClasses() {
  elTimerDisplay.classList.remove('timer-running', 'timer-done');
}

/**
 * Core tick function â€” decrements the counter by 1 second.
 * Handles completion automatically.
 */
function timerTick() {
  if (state.timerTotalSeconds <= 0) {
    // Timer finished
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
    state.timerRunning    = false;
    state.timerTotalSeconds = 0;

    renderTimerDisplay();
    clearTimerClasses();
    elTimerDisplay.classList.add('timer-done');
    elTimerStatus.textContent = 'ðŸŽ‰ Session complete! Time for a break.';

    // Native browser notification (no API â€” just alert as a simple notification)
    // Only show alert if tab is not focused, otherwise use the status message.
    if (document.hidden) {
      alert('Focus session complete! Time for a break.');
    }

    updateStats(); // summary focus duration stays unchanged
    return;
  }

  state.timerTotalSeconds -= 1;
  renderTimerDisplay();
}

function handleTimerStart() {
  // Guard: do nothing if already running
  if (state.timerRunning) return;

  // If timer is at zero, reset to full duration before starting
  if (state.timerTotalSeconds <= 0) {
    state.timerTotalSeconds = state.timerDuration * 60;
    renderTimerDisplay();
  }

  state.timerRunning = true;
  clearTimerClasses();
  elTimerDisplay.classList.add('timer-running');
  elTimerStatus.textContent = 'â–¶ Session in progressâ€¦';

  // Always clear any stale interval before creating a new one
  clearInterval(state.timerIntervalId);
  state.timerIntervalId = setInterval(timerTick, 1000);
}

function handleTimerStop() {
  if (!state.timerRunning) return;

  clearInterval(state.timerIntervalId);
  state.timerIntervalId = null;
  state.timerRunning    = false;

  clearTimerClasses();
  elTimerStatus.textContent = 'â¸ Session paused.';
}

function handleTimerReset() {
  // Stop any running interval first
  clearInterval(state.timerIntervalId);
  state.timerIntervalId   = null;
  state.timerRunning      = false;

  state.timerTotalSeconds = state.timerDuration * 60;

  clearTimerClasses();
  renderTimerDisplay();
  elTimerStatus.textContent = '';
}

/**
 * Apply a custom duration entered by the user (Challenge 3).
 * Validates the input, saves to localStorage, resets the timer.
 */
function handleTimerSet() {
  const raw = elTimerDurationInput.value.trim();
  const val = parseInt(raw, 10);

  if (!raw || isNaN(val) || val < 1 || val > 120) {
    elTimerStatus.textContent = 'âš  Enter a valid duration between 1 and 120 minutes.';
    elTimerDurationInput.focus();
    return;
  }

  // Stop current session if running before changing duration
  if (state.timerRunning) {
    handleTimerStop();
  }

  state.timerDuration     = val;
  state.timerTotalSeconds = val * 60;
  storage.set(STORAGE_KEYS.duration, val);

  clearTimerClasses();
  renderTimerDisplay();
  elTimerDurationInput.value = '';
  elTimerStatus.textContent  = `âœ“ Duration set to ${val} minute${val !== 1 ? 's' : ''}.`;

  // Update live summary
  updateStats();
}

function initTimer() {
  // Restore saved duration
  const saved = storage.get(STORAGE_KEYS.duration, 25);
  const dur   = (typeof saved === 'number' && saved >= 1 && saved <= 120) ? saved : 25;
  state.timerDuration     = dur;
  state.timerTotalSeconds = dur * 60;
  renderTimerDisplay();
}



/* ============================================================
   8. TO-DO LIST MODULE
   ============================================================ */

/**
 * Generate a simple unique ID from timestamp + random suffix.
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Persist the current todos array to localStorage.
 */
function saveTodos() {
  storage.set(STORAGE_KEYS.todos, state.todos);
}

/**
 * Return a sorted copy of the todos array based on the current sort order.
 * Does NOT mutate state.todos â€” sorting is display-only.
 */
function getSortedTodos() {
  const copy = [...state.todos];

  switch (state.todoSortOrder) {
    case 'oldest':
      copy.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'completed':
      copy.sort((a, b) => {
        if (a.completed === b.completed) return b.createdAt - a.createdAt;
        return a.completed ? -1 : 1;
      });
      break;
    case 'pending':
      copy.sort((a, b) => {
        if (a.completed === b.completed) return b.createdAt - a.createdAt;
        return a.completed ? 1 : -1;
      });
      break;
    case 'newest':
    default:
      copy.sort((a, b) => b.createdAt - a.createdAt);
      break;
  }

  return copy;
}

/**
 * Check whether the given text matches any existing task (case-insensitive,
 * ignoring leading/trailing whitespace). Optionally exclude a task by ID
 * (used when editing so the task being edited doesn't flag itself).
 */
function isDuplicateTodo(text, excludeId = null) {
  const normalised = text.trim().toLowerCase();
  return state.todos.some(
    (t) => t.text.toLowerCase() === normalised && t.id !== excludeId
  );
}

/**
 * Show a warning message under the todo form and hide it automatically
 * after 3 seconds (or when the user starts typing again).
 */
function showTodoWarning(message) {
  elTodoWarning.textContent = message;
  elTodoWarning.hidden      = false;
}

function hideTodoWarning() {
  elTodoWarning.hidden = true;
  elTodoWarning.textContent = '';
}

/**
 * Build and render the entire todo list from state.
 * Always reconcile empty-state visibility.
 */
function renderTodos() {
  const sorted = getSortedTodos();

  // Clear existing DOM items
  elTodoList.innerHTML = '';

  if (sorted.length === 0) {
    elTodoEmpty.hidden = false;
    return;
  }

  elTodoEmpty.hidden = true;

  sorted.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' is-completed' : ''}`;
    li.dataset.id = todo.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked   = todo.completed;
    checkbox.id        = `chk_${todo.id}`;
    checkbox.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.completed ? 'pending' : 'completed'}`);
    checkbox.addEventListener('change', () => handleToggleTodo(todo.id));

    // Label bound to checkbox
    const label = document.createElement('label');
    label.htmlFor  = `chk_${todo.id}`;
    label.className = 'todo-text';
    label.textContent = todo.text;

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.className = 'btn-icon-sm btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit task: ${todo.text}`);
    editBtn.addEventListener('click', () => openEditTodoDialog(todo.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type      = 'button';
    deleteBtn.className = 'btn-icon-sm btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
    deleteBtn.addEventListener('click', () => handleDeleteTodo(todo.id, todo.text));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(actions);
    elTodoList.appendChild(li);
  });

  // After rendering, update statistics
  updateStats();
}

/**
 * Add a new task from the input field.
 */
function handleAddTodo(event) {
  event.preventDefault();

  const text = elTodoInput.value.trim();

  if (text.length === 0) {
    showTodoWarning('Please enter a task description.');
    elTodoInput.focus();
    return;
  }

  // Challenge 4: Duplicate prevention
  if (isDuplicateTodo(text)) {
    showTodoWarning(`"${text}" already exists in your list.`);
    elTodoInput.focus();
    return;
  }

  hideTodoWarning();

  const newTodo = {
    id:        generateId(),
    text:      text,
    completed: false,
    createdAt: Date.now(),
  };

  // Newest first â€” prepend logically (sort handles order in render)
  state.todos.unshift(newTodo);
  saveTodos();
  renderTodos();

  elTodoInput.value = '';
  elTodoInput.focus();
}

/**
 * Toggle a task's completed status.
 */
function handleToggleTodo(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;

  todo.completed = !todo.completed;
  saveTodos();
  renderTodos();
}

/**
 * Open the edit task modal pre-filled with current text.
 */
function openEditTodoDialog(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;

  state.editingTodoId         = id;
  elEditTaskInput.value       = todo.text;
  elEditTaskWarning.hidden    = true;
  elEditTaskWarning.textContent = '';

  elEditTaskDialog.hidden = false;
  elEditTaskInput.focus();
  elEditTaskInput.select();
}

/**
 * Save the edited task text from the modal.
 */
function handleSaveEditTodo() {
  const id   = state.editingTodoId;
  const text = elEditTaskInput.value.trim();

  if (text.length === 0) {
    elEditTaskWarning.textContent = 'Task description cannot be empty.';
    elEditTaskWarning.hidden      = false;
    elEditTaskInput.focus();
    return;
  }

  // Duplicate check â€” exclude the task being edited
  if (isDuplicateTodo(text, id)) {
    elEditTaskWarning.textContent = `"${text}" already exists in your list.`;
    elEditTaskWarning.hidden      = false;
    elEditTaskInput.focus();
    return;
  }

  const todo = state.todos.find((t) => t.id === id);
  if (todo) {
    todo.text = text;
    saveTodos();
    renderTodos();
  }

  closeEditTodoDialog();
}

function closeEditTodoDialog() {
  state.editingTodoId   = null;
  elEditTaskDialog.hidden = true;
}

/**
 * Trigger the confirmation dialog before deleting a task.
 */
function handleDeleteTodo(id, text) {
  openConfirmDialog(
    `Are you sure you want to delete "${text}"?`,
    () => {
      state.todos = state.todos.filter((t) => t.id !== id);
      saveTodos();
      renderTodos();
    }
  );
}

/**
 * Handle sort order change (Challenge 5).
 */
function handleSortChange() {
  state.todoSortOrder = elTodoSortSelect.value;
  renderTodos();
}

function initTodos() {
  const saved = storage.get(STORAGE_KEYS.todos, []);
  // Validate loaded data to avoid corrupt state
  state.todos = Array.isArray(saved)
    ? saved.filter(
        (t) => t && typeof t.id === 'string' && typeof t.text === 'string'
      )
    : [];
  renderTodos();
}



/* ============================================================
   9. QUICK LINKS MODULE
   ============================================================ */

/**
 * Validate a URL string using the URL constructor â€” the most reliable
 * cross-browser approach without regex.
 * Accepts http:// and https:// only.
 */
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function saveLinks() {
  storage.set(STORAGE_KEYS.links, state.links);
}

function showLinksWarning(message) {
  elLinksWarning.textContent = message;
  elLinksWarning.hidden      = false;
}

function hideLinksWarning() {
  elLinksWarning.hidden      = true;
  elLinksWarning.textContent = '';
}

/**
 * Render the full quick links list from state.
 */
function renderLinks() {
  elLinksList.innerHTML = '';

  if (state.links.length === 0) {
    elLinksEmpty.hidden = false;
    return;
  }

  elLinksEmpty.hidden = true;

  state.links.forEach((link) => {
    const li = document.createElement('li');
    li.className  = 'link-item';
    li.dataset.id = link.id;

    // Open button â€” acts as the link trigger, opens in new tab
    const openBtn = document.createElement('button');
    openBtn.type      = 'button';
    openBtn.className = 'link-open-btn';
    openBtn.setAttribute('aria-label', `Open ${link.name} (${link.url}) in a new tab`);
    openBtn.addEventListener('click', () => {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    });

    const nameSpan = document.createElement('span');
    nameSpan.className   = 'link-name';
    nameSpan.textContent = link.name;

    const urlSpan = document.createElement('span');
    urlSpan.className   = 'link-url';
    urlSpan.textContent = link.url;

    openBtn.appendChild(nameSpan);
    openBtn.appendChild(urlSpan);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.className = 'btn-icon-sm btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit link: ${link.name}`);
    editBtn.addEventListener('click', () => openEditLinkDialog(link.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type      = 'button';
    deleteBtn.className = 'btn-icon-sm btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.name}`);
    deleteBtn.addEventListener('click', () => handleDeleteLink(link.id, link.name));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(openBtn);
    li.appendChild(actions);
    elLinksList.appendChild(li);
  });

  updateStats();
}

/**
 * Add a new quick link from the form inputs.
 */
function handleAddLink(event) {
  event.preventDefault();

  const name = elLinkNameInput.value.trim();
  const url  = elLinkUrlInput.value.trim();

  if (name.length === 0) {
    showLinksWarning('Please enter a website name.');
    elLinkNameInput.focus();
    return;
  }

  if (url.length === 0) {
    showLinksWarning('Please enter a URL.');
    elLinkUrlInput.focus();
    return;
  }

  if (!isValidUrl(url)) {
    showLinksWarning('Invalid URL. Please enter a valid address starting with http:// or https://');
    elLinkUrlInput.focus();
    return;
  }

  hideLinksWarning();

  const newLink = {
    id:   generateId(),
    name: name,
    url:  url,
  };

  state.links.push(newLink);
  saveLinks();
  renderLinks();

  elLinkNameInput.value = '';
  elLinkUrlInput.value  = '';
  elLinkNameInput.focus();
}

/**
 * Open the edit link modal pre-filled.
 */
function openEditLinkDialog(id) {
  const link = state.links.find((l) => l.id === id);
  if (!link) return;

  state.editingLinkId             = id;
  elEditLinkNameInput.value       = link.name;
  elEditLinkUrlInput.value        = link.url;
  elEditLinkWarning.hidden        = true;
  elEditLinkWarning.textContent   = '';

  elEditLinkDialog.hidden = false;
  elEditLinkNameInput.focus();
}

function handleSaveEditLink() {
  const id   = state.editingLinkId;
  const name = elEditLinkNameInput.value.trim();
  const url  = elEditLinkUrlInput.value.trim();

  if (name.length === 0) {
    elEditLinkWarning.textContent = 'Website name cannot be empty.';
    elEditLinkWarning.hidden      = false;
    elEditLinkNameInput.focus();
    return;
  }

  if (!isValidUrl(url)) {
    elEditLinkWarning.textContent = 'Invalid URL. Please enter a valid address starting with http:// or https://';
    elEditLinkWarning.hidden      = false;
    elEditLinkUrlInput.focus();
    return;
  }

  const link = state.links.find((l) => l.id === id);
  if (link) {
    link.name = name;
    link.url  = url;
    saveLinks();
    renderLinks();
  }

  closeEditLinkDialog();
}

function closeEditLinkDialog() {
  state.editingLinkId     = null;
  elEditLinkDialog.hidden = true;
}

/**
 * Trigger the confirmation dialog before deleting a link.
 */
function handleDeleteLink(id, name) {
  openConfirmDialog(
    `Are you sure you want to delete the link "${name}"?`,
    () => {
      state.links = state.links.filter((l) => l.id !== id);
      saveLinks();
      renderLinks();
    }
  );
}

function initLinks() {
  const saved = storage.get(STORAGE_KEYS.links, []);
  state.links = Array.isArray(saved)
    ? saved.filter(
        (l) => l && typeof l.id === 'string' && typeof l.name === 'string' && typeof l.url === 'string'
      )
    : [];
  renderLinks();
}


/* ============================================================
   10. STATISTICS & PROGRESS MODULE
   ============================================================ */

/**
 * Recompute all statistics from state and update the DOM.
 * Called after any todo change, timer duration change, or page load.
 */
function updateStats() {
  const total     = state.todos.length;
  const completed = state.todos.filter((t) => t.completed).length;
  const pending   = total - completed;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Stat cards
  elStatTotal.textContent     = total;
  elStatCompleted.textContent = completed;
  elStatPending.textContent   = pending;
  elStatPercent.textContent   = `${pct}%`;

  // Progress bar
  elProgressBarFill.style.width = `${pct}%`;
  elProgressBarTrack.setAttribute('aria-valuenow', pct);
  elProgressPercentLabel.textContent = `${pct}%`;

  // Live summary
  elSummaryActive.textContent = pending;
  elSummaryDone.textContent   = completed;
  elSummaryFocus.textContent  = `${state.timerDuration} min`;
}


/* ============================================================
   11. MODAL / DIALOG MODULE
   ============================================================ */

/**
 * Open the generic confirmation dialog.
 * @param {string}   message   - Message to show the user.
 * @param {Function} onConfirm - Callback invoked when the user confirms.
 */
function openConfirmDialog(message, onConfirm) {
  elConfirmBody.textContent          = message;
  state.pendingDeleteCallback        = onConfirm;
  elConfirmDialog.hidden             = false;
  elConfirmOkBtn.focus();
}

function closeConfirmDialog() {
  elConfirmDialog.hidden        = true;
  state.pendingDeleteCallback   = null;
}

function handleConfirmOk() {
  if (typeof state.pendingDeleteCallback === 'function') {
    state.pendingDeleteCallback();
  }
  closeConfirmDialog();
}

/**
 * Close any open modal when the user clicks the overlay backdrop.
 */
function handleOverlayClick(event, closeFn) {
  if (event.target === event.currentTarget) {
    closeFn();
  }
}

/**
 * Close modals on Escape key.
 */
function handleGlobalKeydown(event) {
  if (event.key !== 'Escape') return;
  if (!elConfirmDialog.hidden)   closeConfirmDialog();
  if (!elEditTaskDialog.hidden)  closeEditTodoDialog();
  if (!elEditLinkDialog.hidden)  closeEditLinkDialog();
}


/* ============================================================
   12. INITIALISATION â€” Wire Events & Boot
   ============================================================ */

function initQuote() {
  const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  elQuoteText.textContent = MOTIVATIONAL_QUOTES[idx];
}

function initFooterYear() {
  elFooterYear.textContent = new Date().getFullYear();
}

/**
 * Attach all event listeners. Called once at startup.
 */
function attachEventListeners() {
  // --- Theme ---
  elThemeToggleBtn.addEventListener('click', handleThemeToggle);

  // --- Name ---
  elSaveNameBtn.addEventListener('click', handleSaveName);
  elUserNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSaveName();
  });

  // --- Timer ---
  elTimerStartBtn.addEventListener('click', handleTimerStart);
  elTimerStopBtn.addEventListener('click',  handleTimerStop);
  elTimerResetBtn.addEventListener('click', handleTimerReset);
  elTimerSetBtn.addEventListener('click',   handleTimerSet);
  elTimerDurationInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleTimerSet();
  });

  // --- Todos ---
  elTodoForm.addEventListener('submit', handleAddTodo);
  elTodoSortSelect.addEventListener('change', handleSortChange);
  // Clear warning as soon as the user starts typing
  elTodoInput.addEventListener('input', hideTodoWarning);

  // Edit task dialog
  elEditTaskSaveBtn.addEventListener('click',   handleSaveEditTodo);
  elEditTaskCancelBtn.addEventListener('click',  closeEditTodoDialog);
  elEditTaskDialog.addEventListener('click', (e) => handleOverlayClick(e, closeEditTodoDialog));
  elEditTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSaveEditTodo();
  });

  // --- Links ---
  elLinksForm.addEventListener('submit', handleAddLink);
  elLinkNameInput.addEventListener('input', hideLinksWarning);
  elLinkUrlInput.addEventListener('input',  hideLinksWarning);

  // Edit link dialog
  elEditLinkSaveBtn.addEventListener('click',   handleSaveEditLink);
  elEditLinkCancelBtn.addEventListener('click',  closeEditLinkDialog);
  elEditLinkDialog.addEventListener('click', (e) => handleOverlayClick(e, closeEditLinkDialog));

  // --- Confirm dialog ---
  elConfirmOkBtn.addEventListener('click',     handleConfirmOk);
  elConfirmCancelBtn.addEventListener('click',  closeConfirmDialog);
  elConfirmDialog.addEventListener('click', (e) => handleOverlayClick(e, closeConfirmDialog));

  // --- Global keyboard ---
  document.addEventListener('keydown', handleGlobalKeydown);
}

/**
 * Main entry point - runs after the DOM is fully parsed.
 */
function init() {
  initTheme();
  initGreeting();
  initTimer();
  initTodos();
  initLinks();
  initQuote();
  initFooterYear();
  attachEventListeners();
  updateStats();
}

// Boot the application
init();
