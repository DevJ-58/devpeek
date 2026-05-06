/**
 * app.js — DevPeek PWA v0.2 Logic
 * 
 * Gère : navigation 3-écrans, i18n, thème, historique localStorage,
 * scanner QR (BarcodeDetector ou jsQR), viewer iframe, orientation
 */

// ─── i18n ─────────────────────────────────────────────────────────────────

let translations = {};

async function loadTranslations() {
  const lang = navigator.language?.startsWith('fr') ? 'fr' : 'en';
  try {
    const res = await fetch(`/i18n/${lang}.json`);
    translations = await res.json();
  } catch {
    translations = {
      connect_server: 'Connexion',
      manual_input: 'Saisie manuelle',
      scan_qr: 'Scanner QR',
      url_placeholder: 'http://192.168.x.x:3000',
      connect: 'Connexion',
      history: 'Récents',
      clear_history: 'Effacer',
      back: 'Retour',
      rotate: 'Rotation',
      theme: 'Thème',
      history_empty: 'Aucun serveur',
      scanner_permission: 'Accès caméra requis'
    };
  }
}

function t(key) {
  return translations[key] || key;
}

// ─── Screen Navigation ────────────────────────────────────────────────────

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId)?.classList.remove('hidden');
}

// ─── Theme ────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('devpeek-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('devpeek-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ─── History (localStorage) ───────────────────────────────────────────────

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
  let history = getHistory().filter(u => u !== url);
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
    container.innerHTML = `<div class="history-empty">${t('history_empty')}</div>`;
    return;
  }

  container.innerHTML = history.map(url => `
    <div class="history-item" onclick="connectAndOpen('${url}')">
      <div class="history-icon"><i class="material-icons">history</i></div>
      <span class="history-url">${url}</span>
    </div>
  `).join('');
}

// ─── Tab Navigation (Connect Screen) ───────────────────────────────────────

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      
      // Deactivate all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      // Activate selected
      btn.classList.add('active');
      document.getElementById(`tab-${tabName}`)?.classList.add('active');
      
      // Start camera if scanner tab
      if (tabName === 'scanner') {
        startScanner();
      } else {
        stopScanner();
      }
    });
  });
}

// ─── URL Input & Validation ───────────────────────────────────────────────

function isValidUrl(url) {
  return /^https?:\/\//.test(url);
}

function connectFromInput() {
  const input = document.getElementById('url-input');
  const url = input.value.trim();

  if (!isValidUrl(url)) {
    alert('URL doit commencer par http:// ou https://');
    return;
  }

  connectAndOpen(url);
}

function connectAndOpen(url) {
  addToHistory(url);
  openViewer(url);
}

// ─── QR Scanner (BarcodeDetector or jsQR CDN) ────────────────────────────

let scannerActive = false;
let videoStream = null;

async function startScanner() {
  if (scannerActive) return;
  scannerActive = true;

  const video = document.getElementById('scanner-video');
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = videoStream;
    video.play();

    // Try BarcodeDetector first (native API)
    if (window.BarcodeDetector) {
      startBarcodeDetector(video);
    } else {
      // Fallback to jsQR via CDN
      loadJsQR().then(() => startJsQRScanner(video));
    }
  } catch (err) {
    alert(t('scanner_permission'));
    stopScanner();
  }
}

function stopScanner() {
  scannerActive = false;
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
}

async function startBarcodeDetector(video) {
  const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
  
  const scanFrame = async () => {
    if (!scannerActive) return;

    try {
      const barcodes = await detector.detect(video);
      for (const barcode of barcodes) {
        if (barcode.format === 'qr_code' && isValidUrl(barcode.rawValue)) {
          connectAndOpen(barcode.rawValue);
          stopScanner();
          return;
        }
      }
    } catch {}

    requestAnimationFrame(scanFrame);
  };

  scanFrame();
}

async function loadJsQR() {
  if (window.jsQR) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr/dist/jsQR.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function startJsQRScanner(video) {
  if (!video) return;

  await new Promise(resolve => {
    if (video.readyState >= 2) {
      resolve();
    } else {
      video.addEventListener('loadedmetadata', resolve, { once: true });
    }
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const scanFrame = () => {
    if (!scannerActive) return;
    if (video.readyState < 2) {
      requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(imageData.data, canvas.width, canvas.height);

    if (code && isValidUrl(code.data)) {
      connectAndOpen(code.data);
      stopScanner();
      return;
    }

    requestAnimationFrame(scanFrame);
  };

  scanFrame();
}

// ─── Viewer ───────────────────────────────────────────────────────────────

let isLandscape = false;

function openViewer(url) {
  const iframe = document.getElementById('viewer-iframe');
  iframe.src = url;
  showScreen('viewer-screen');
}

function backFromViewer() {
  showScreen('home-screen');
  stopScanner();
}

function toggleOrientation() {
  isLandscape = !isLandscape;
  const viewerScreen = document.getElementById('viewer-screen');

  if (screen.orientation?.lock) {
    screen.orientation.lock(isLandscape ? 'landscape' : 'portrait').catch(() => {
      viewerScreen.classList.toggle('landscape', isLandscape);
    });
  } else {
    viewerScreen.classList.toggle('landscape', isLandscape);
  }
}

// ─── Resolution Badge ─────────────────────────────────────────────────────

function renderResolution() {
  const el = document.getElementById('resolution-badge');
  if (!el) return;
  const dpr = window.devicePixelRatio || 1;
  el.textContent = `${window.screen.width}×${window.screen.height} @${dpr}x`;
}

// ─── Initialization ───────────────────────────────────────────────────────

async function init() {
  await loadTranslations();
  initTheme();

  // Apply i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // Render initial history
  renderHistory();
  renderResolution();

  // Init tabs
  initTabs();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.warn);
  }

  // Event listeners
  document.getElementById('connect-btn')?.addEventListener('click', () => showScreen('connect-screen'));
  document.getElementById('back-btn-connect')?.addEventListener('click', () => showScreen('home-screen'));
  document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
  document.getElementById('clear-btn')?.addEventListener('click', clearHistory);
  document.getElementById('connect-url-btn')?.addEventListener('click', connectFromInput);
  document.getElementById('back-btn-viewer')?.addEventListener('click', backFromViewer);
  document.getElementById('rotate-btn')?.addEventListener('click', toggleOrientation);
  document.getElementById('theme-btn-viewer')?.addEventListener('click', toggleTheme);

  // Show home screen initially
  showScreen('home-screen');
}

document.addEventListener('DOMContentLoaded', init);