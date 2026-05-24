/* ═══════════════════════════════════════════
   PROMODORO — App Logic
   Timer, Todo, Sounds, Animations
   ═══════════════════════════════════════════ */

// ── State ──
const state = {
  mode: 'focus',
  modes: {
    focus: { label: 'Focus', duration: 25 * 60 },
    shortBreak: { label: 'Short Break', duration: 5 * 60 },
    longBreak: { label: 'Long Break', duration: 15 * 60 },
  },
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  isRunning: false,
  interval: null,
  sessions: 0,
  maxSessionDots: 8,
  todos: JSON.parse(localStorage.getItem('promodoro-todos') || '[]'),
  todoPanelOpen: false,
  soundPanelOpen: false,
  rainPlaying: false,
  audioCtx: null,
  rainNodes: null,
  volume: 0.4,
};

const quotes = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Small steps every day lead to big results.",
  "Your future self will thank you.",
  "Don't watch the clock; do what it does — keep going.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "It always seems impossible until it's done.",
  "Stay foolish, stay hungry.",
  "Dream big. Start small. Act now.",
  "Discipline is choosing what you want most over what you want now.",
  "You don't have to be great to start, but you have to start to be great.",
];

// ── DOM References ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  createRain();
  createFireflies();
  renderTimer();
  renderTodos();
  renderSessionDots();
  updateClock();
  setInterval(updateClock, 1000);
  showRandomQuote();
  setInterval(showRandomQuote, 30000);
  bindEvents();
  requestNotificationPermission();
});

// ═══════════════════════════════════════════
// RAIN & PARTICLE EFFECTS
// ═══════════════════════════════════════════

function createRain() {
  const container = $('#rain-container');
  const count = 350; // Increased density for heavy rain
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.left = `${Math.random() * 150 - 25}%`; // Start wider to account for diagonal fall
    
    // Vary speeds to create depth (closer drops fall faster)
    const depth = Math.random();
    drop.style.animationDuration = `${0.3 + depth * 0.4}s`; 
    drop.style.animationDelay = `${Math.random() * 2}s`;
    
    // Vary opacity and size based on depth
    drop.style.opacity = `${0.1 + depth * 0.5}`;
    drop.style.height = `${20 + depth * 40}px`;
    drop.style.width = `${1 + depth * 1.5}px`;
    
    container.appendChild(drop);
  }
}

function createFireflies() {
  const container = $('#rain-container');
  const count = 8;
  for (let i = 0; i < count; i++) {
    const fly = document.createElement('div');
    fly.className = 'firefly';
    fly.style.left = `${10 + Math.random() * 80}%`;
    fly.style.top = `${20 + Math.random() * 60}%`;
    fly.style.animationDuration = `${6 + Math.random() * 8}s`;
    fly.style.animationDelay = `${Math.random() * 5}s`;
    container.appendChild(fly);
  }
}

// ═══════════════════════════════════════════
// TIMER
// ═══════════════════════════════════════════

function renderTimer() {
  const mins = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
  const secs = (state.timeLeft % 60).toString().padStart(2, '0');
  $('#timer-time').textContent = `${mins}:${secs}`;
  $('#timer-label').textContent = state.modes[state.mode].label;

  // Update ring
  const circumference = 2 * Math.PI * 140;
  const progress = 1 - state.timeLeft / state.totalTime;
  const offset = circumference * (1 - progress);
  const ring = $('#timer-ring-progress');
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = offset;

  // Update start/pause button text
  const btn = $('#btn-start');
  btn.textContent = state.isRunning ? 'Pause' : 'Start';
}

function startTimer() {
  if (state.isRunning) {
    pauseTimer();
    return;
  }
  state.isRunning = true;
  renderTimer();
  state.interval = setInterval(() => {
    state.timeLeft--;
    if (state.timeLeft <= 0) {
      clearInterval(state.interval);
      state.isRunning = false;
      onTimerComplete();
    }
    renderTimer();
  }, 1000);
}

function pauseTimer() {
  state.isRunning = false;
  clearInterval(state.interval);
  renderTimer();
}

function resetTimer() {
  pauseTimer();
  state.timeLeft = state.modes[state.mode].duration;
  state.totalTime = state.modes[state.mode].duration;
  renderTimer();
}

function setMode(mode) {
  if (state.isRunning) pauseTimer();
  state.mode = mode;
  state.timeLeft = state.modes[mode].duration;
  state.totalTime = state.modes[mode].duration;

  $$('.mode-btn').forEach((btn) => btn.classList.remove('active'));
  $(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
  renderTimer();
}

function onTimerComplete() {
  if (state.mode === 'focus') {
    state.sessions++;
    renderSessionDots();
    showToast('🍅 Focus session complete! Take a break.');
    playNotificationSound();
    sendNotification('Focus Complete!', 'Great work! Time for a break.');

    if (state.sessions % 4 === 0) {
      setMode('longBreak');
    } else {
      setMode('shortBreak');
    }
  } else {
    showToast('☕ Break over! Time to focus.');
    playNotificationSound();
    sendNotification('Break Over!', 'Ready to focus again?');
    setMode('focus');
  }
}

function renderSessionDots() {
  const container = $('#session-dots');
  container.innerHTML = '';
  for (let i = 0; i < state.maxSessionDots; i++) {
    const dot = document.createElement('div');
    dot.className = `session-dot${i < state.sessions ? ' filled' : ''}`;
    container.appendChild(dot);
  }
}

// ═══════════════════════════════════════════
// TODO LIST
// ═══════════════════════════════════════════

function renderTodos() {
  const list = $('#todo-list');
  list.innerHTML = '';
  state.todos.forEach((todo, i) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' completed' : ''}`;
    li.draggable = true;
    li.dataset.index = i;
    li.style.animationDelay = `${i * 0.06}s`;
    li.innerHTML = `
      <div class="todo-checkbox${todo.done ? ' checked' : ''}" data-i="${i}"></div>
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <button class="todo-delete btn" data-i="${i}" title="Delete">✕</button>
    `;
    list.appendChild(li);
  });
  updateTodoCount();
  setupDragAndDrop();
}

function addTodo() {
  const input = $('#todo-input');
  const text = input.value.trim();
  if (!text || state.todos.length >= 10) return;
  state.todos.push({ text, done: false });
  input.value = '';
  saveTodos();
  renderTodos();
  updateAddButton();
}

function toggleTodo(index) {
  state.todos[index].done = !state.todos[index].done;
  saveTodos();
  renderTodos();
}

function deleteTodo(index) {
  state.todos.splice(index, 1);
  saveTodos();
  renderTodos();
  updateAddButton();
}

function saveTodos() {
  localStorage.setItem('promodoro-todos', JSON.stringify(state.todos));
}

function updateTodoCount() {
  const done = state.todos.filter((t) => t.done).length;
  $('#todo-count').textContent = `${done}/${state.todos.length}`;
}

function updateAddButton() {
  const btn = $('#todo-add-btn');
  btn.disabled = state.todos.length >= 10;
}

function setupDragAndDrop() {
  const items = $$('.todo-item');
  items.forEach((item) => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.index);
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.style.borderTop = '2px solid var(--accent-light)';
    });
    item.addEventListener('dragleave', () => {
      item.style.borderTop = '';
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.style.borderTop = '';
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      const to = parseInt(item.dataset.index);
      if (from !== to) {
        const [moved] = state.todos.splice(from, 1);
        state.todos.splice(to, 0, moved);
        saveTodos();
        renderTodos();
      }
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ═══════════════════════════════════════════
// SOUND SYSTEM (Procedural Rain)
// ═══════════════════════════════════════════

function initAudio() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function startRainSound() {
  initAudio();
  const ctx = state.audioCtx;
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  // Bandpass filter for rain-like sound
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;

  // Secondary low-pass for warmth
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2500;

  const gain = ctx.createGain();
  gain.gain.value = state.volume * 0.3;

  noise.connect(filter);
  filter.connect(lp);
  lp.connect(gain);
  gain.connect(ctx.destination);
  noise.start();

  state.rainNodes = { noise, filter, lp, gain };
}

function stopRainSound() {
  if (state.rainNodes) {
    state.rainNodes.noise.stop();
    state.rainNodes = null;
  }
}

function toggleRain() {
  state.rainPlaying = !state.rainPlaying;
  const btn = $('#rain-toggle');
  if (state.rainPlaying) {
    startRainSound();
    btn.classList.add('active');
  } else {
    stopRainSound();
    btn.classList.remove('active');
  }
}

function setVolume(val) {
  state.volume = val;
  if (state.rainNodes) {
    state.rainNodes.gain.gain.value = val * 0.3;
  }
}

// ═══════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🍅' });
  }
}

function playNotificationSound() {
  initAudio();
  const ctx = state.audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(587, ctx.currentTime);
  osc.frequency.setValueAtTime(784, ctx.currentTime + 0.15);
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

// ═══════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function showRandomQuote() {
  const el = $('#quote-text');
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  el.textContent = `"${quote}"`;
  el.style.animation = 'quoteFadeIn 1s ease';
}

function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  $('#current-time').textContent = `${h}:${m}`;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// ═══════════════════════════════════════════
// EVENT BINDINGS
// ═══════════════════════════════════════════

function bindEvents() {
  // Timer
  $('#btn-start').addEventListener('click', startTimer);
  $('#btn-reset').addEventListener('click', resetTimer);
  $$('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  // Todo panel toggle
  $('#tool-todo').addEventListener('click', () => {
    state.todoPanelOpen = !state.todoPanelOpen;
    $('.todo-panel').classList.toggle('open', state.todoPanelOpen);
    $('#tool-todo').classList.toggle('active', state.todoPanelOpen);
    // Close sound panel
    if (state.todoPanelOpen && state.soundPanelOpen) {
      state.soundPanelOpen = false;
      $('.sound-panel').classList.remove('open');
      $('#tool-sound').classList.remove('active');
    }
  });

  // Sound panel toggle
  $('#tool-sound').addEventListener('click', () => {
    state.soundPanelOpen = !state.soundPanelOpen;
    $('.sound-panel').classList.toggle('open', state.soundPanelOpen);
    $('#tool-sound').classList.toggle('active', state.soundPanelOpen);
    if (state.soundPanelOpen && state.todoPanelOpen) {
      state.todoPanelOpen = false;
      $('.todo-panel').classList.remove('open');
      $('#tool-todo').classList.remove('active');
    }
  });

  // Todo input
  $('#todo-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });
  $('#todo-add-btn').addEventListener('click', addTodo);

  // Todo clicks (delegation)
  $('#todo-list').addEventListener('click', (e) => {
    const checkbox = e.target.closest('.todo-checkbox');
    const del = e.target.closest('.todo-delete');
    if (checkbox) toggleTodo(parseInt(checkbox.dataset.i));
    if (del) deleteTodo(parseInt(del.dataset.i));
  });

  // Sound controls
  $('#rain-toggle').addEventListener('click', toggleRain);
  $('#volume-slider').addEventListener('input', (e) => setVolume(parseFloat(e.target.value)));

  // Fullscreen
  $('#btn-fullscreen').addEventListener('click', toggleFullscreen);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      startTimer();
    }
    if (e.key === 'r' || e.key === 'R') resetTimer();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 't' || e.key === 'T') {
      state.todoPanelOpen = !state.todoPanelOpen;
      $('.todo-panel').classList.toggle('open', state.todoPanelOpen);
      $('#tool-todo').classList.toggle('active', state.todoPanelOpen);
    }
  });

  updateAddButton();
}
