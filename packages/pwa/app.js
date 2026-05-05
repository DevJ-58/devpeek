/**
 * app.js — Logique de la PWA DevPeek
 *
 * Gère : i18n, thème, Socket.IO, historique, viewer iframe, orientation
 */

// ─── i18n ──────────────────────────────────────────────────────────────────

let translations = {};

async function loadTranslations() {
  // Détecter la langue du navigateur (fr ou en par défaut)
  const lang = navigator.language?.startsWith('fr') ? 'fr' : 'en';
  try {
    const res = await fetch(`/i18n/${lang}.json`);
    translations = await res.json();
  } catch {
    // Fallback anglais en cas d'erreur réseau
    translations = {
      status_waiting: 'Waiting for connection...',
      status_connected: 'Connected',
      status_disconnected: 'Disconnected',
      open_viewer: 'Open preview',
      hint_scan: 'Scan the QR code from your DevPeek terminal',
      hint_same_network: 'Make sure your phone and PC are on the same Wi-Fi network',
      history: 'Recent',
      no_history: 'No recent servers',
      clear_history: 'Clear',
      back: 'Back',
      rotate: 'Rotate',
      theme: 'Theme',
      resolution: 'Resolution',
      connecting: 'Connecting...',
      reconnecting: 'Reconnecting...'
    };
  }
}

function t(key) {
  return translations[key] || key;
}

// ─── Thème ─────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('devpeek-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('devpeek-theme', theme);
  document.querySelector('.theme-btn').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ─── Historique des URLs ────────────────────────────────────────────────────

const HISTORY_KEY = 'devpeek-history';
const HISTORY_MAX = 5;

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function addToHistory(url) {
  let history = getHistory().filter((u) => u !== url);
  history.unshift(url);
  if (history.length > HISTORY_MAX) history = history.slice(0, HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  const history = getHistory();

  if (history.length === 0) {
    container.innerHTML = `<div class="history-empty">${t('no_history')}</div>`;
    return;
  }

  container.innerHTML = history
    .map(
      (url) => `
      <div class="history-item" data-url="${url}" role="button" tabindex="0">
        <span class="history-icon">🔗</span>
        <span class="history-url">${url}</span>
      </div>`
    )
    .join('');

  container.querySelectorAll('.history-item').forEach((item) => {
    item.addEventListener('click', () => openViewer(item.dataset.url));
  });
}

// ─── État de connexion ──────────────────────────────────────────────────────

let currentDevServerUrl = null;
let isConnected = false;

function setStatus(state, urlOverride) {
  const dot   = document.getElementById('status-dot');
  const label = document.getElementById('status-label');
  const urlEl = document.getElementById('server-url');
  const openBtn = document.getElementById('open-btn');

  dot.className = 'status-dot ' + state;

  switch (state) {
    case 'waiting':
      label.textContent = t('status_waiting');
      break;
    case 'connected':
      label.textContent = t('status_connected');
      isConnected = true;
      break;
    case 'disconnected':
      label.textContent = t('status_disconnected');
      isConnected = false;
      break;
    case 'connecting':
      label.textContent = t('connecting');
      break;
    case 'reconnecting':
      label.textContent = t('reconnecting');
      break;
  }

  const url = urlOverride || currentDevServerUrl;
  if (url) {
    urlEl.textContent = url;
    urlEl.style.display = 'block';
    currentDevServerUrl = url;
  }

  openBtn.disabled = !isConnected;
}

// ─── Viewer ─────────────────────────────────────────────────────────────────

let isLandscape = false;

function openViewer(url) {
  const iframe = document.getElementById('viewer-iframe');
  const target = url || currentDevServerUrl;
  if (!target) return;

  iframe.src = target;
  addToHistory(target);

  document.getElementById('connection-screen').classList.add('hidden');
  document.getElementById('viewer-screen').classList.remove('hidden');
}

function closeViewer() {
  document.getElementById('viewer-screen').classList.add('hidden');
  document.getElementById('connection-screen').classList.remove('hidden');
}

function toggleOrientation() {
  isLandscape = !isLandscape;
  const viewerScreen = document.getElementById('viewer-screen');

  // Essayer l'API screen.orientation en premier (Android Chrome)
  if (screen.orientation?.lock) {
    screen.orientation
      .lock(isLandscape ? 'landscape' : 'portrait')
      .catch(() => {
        // Fallback CSS rotation (iOS Safari)
        viewerScreen.classList.toggle('landscape', isLandscape);
      });
  } else {
    // iOS Safari fallback
    viewerScreen.classList.toggle('landscape', isLandscape);
  }
}

// ─── Badge de résolution ────────────────────────────────────────────────────

function renderResolution() {
  const el = document.getElementById('resolution-badge');
  const dpr = window.devicePixelRatio || 1;
  el.innerHTML = `📐 ${window.screen.width}×${window.screen.height} @${dpr}x`;
}

// ─── Socket.IO ──────────────────────────────────────────────────────────────

function initSocket() {
  // L'URL du socket est l'origine de la PWA elle-même (même hôte que le CLI)
  // On utilise window.location.origin pour ne pas hardcoder l'IP
  const socket = io(window.location.origin, {
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 5000
  });

  setStatus('connecting');

  socket.on('connect', () => {
    // On attend la config du serveur avant de passer à "connected"
    setStatus('connecting');
  });

  socket.on('config', (data) => {
    if (data?.devServerUrl) {
      currentDevServerUrl = data.devServerUrl;
      setStatus('connected', data.devServerUrl);
    }
  });

  socket.on('disconnect', () => {
    setStatus('disconnected');
  });

  socket.on('connect_error', () => {
    setStatus('reconnecting');
  });

  socket.on('reconnect', () => {
    setStatus('connecting');
  });
}

// ─── Initialisation ─────────────────────────────────────────────────────────

async function init() {
  await loadTranslations();
  initTheme();

  // Remplir les textes i18n dans le HTML
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  // Rendre l'historique
  renderHistory();

  // Badge de résolution
  renderResolution();

  // Statut initial
  setStatus('waiting');

  // Enregistrer le Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.warn);
  }

  // Événements
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  document.getElementById('open-btn').addEventListener('click', () => openViewer());
  document.getElementById('back-btn').addEventListener('click', closeViewer);
  document.getElementById('rotate-btn').addEventListener('click', toggleOrientation);
  document.getElementById('theme-btn-viewer').addEventListener('click', toggleTheme);
  document.getElementById('clear-btn').addEventListener('click', clearHistory);

  // Socket
  initSocket();
}

document.addEventListener('DOMContentLoaded', init);