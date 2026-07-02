const STORAGE_KEY = 'pqplus.state.v1';
const THEME_KEY = 'pqplus.theme.v1';
const ONBOARDING_KEY = 'pqplus.onboarding.done.v1';
const SWIPE_THRESHOLD = 50;
const STRONG_THRESHOLD = 120;
const PREMIUM_THRESHOLD = 220;

const dom = {
  root: document.documentElement,
  body: document.body,
  themeSwitch: document.querySelector('#themeSwitch'),
  onboarding: document.querySelector('#onboarding'),
  startOnboarding: document.querySelector('#startOnboarding'),
  swipeZone: document.querySelector('#swipeZone'),
  paperSheet: document.querySelector('#paper-sheet'),
  rollGroup: document.querySelector('#rollGroup'),
  assistButton: document.querySelector('#assistButton'),
  modeButtons: [...document.querySelectorAll('.mode-button')],
  modeDescription: document.querySelector('#modeDescription'),
  modePill: document.querySelector('#modePill'),
  toastRegion: document.querySelector('#toastRegion'),
  resetButton: document.querySelector('#resetButton'),
  badgesList: document.querySelector('#badgesList'),
  stats: {
    sheets: document.querySelector('#statSheets'),
    sessions: document.querySelector('#statSessions'),
    cleanliness: document.querySelector('#statCleanliness'),
    comfort: document.querySelector('#statComfort'),
    trees: document.querySelector('#statTrees'),
    co2: document.querySelector('#statCo2'),
    demat: document.querySelector('#statDemat')
  }
};

const modes = {
  classic: { label: 'Classique', description: 'Équilibre standard entre confort et sobriété.', multiplier: 1, comfort: 5, visual: 1 },
  eco: { label: 'Éco', description: 'Réduction algorithmique de l’empreinte feuille.', multiplier: 0.68, comfort: 2, visual: 0.72 },
  premium: { label: 'Premium', description: 'Expérience triple épaisseur mentale, confort augmenté.', multiplier: 1.35, comfort: 11, visual: 1.22 }
};

const baseMessages = [
  'Déroulement numérique validé.', 'Indice de confort recalibré.', 'Friction symbolique optimisée.',
  'Empreinte cellulose évitée avec succès.', 'Propreté estimée conforme aux standards PQ+.',
  'Votre hygiène dématérialisée progresse.', 'Triple épaisseur cognitive activée.',
  'Analyse du trône terminée.', 'Performance sanitaire virtuelle stable.', 'Aucune fibre réelle n’a été mobilisée.'
];
const modeMessages = {
  eco: ['Sobriété feuille renforcée.', 'Consommation virtuelle contenue.', 'Impact environnemental imaginaire réduit.'],
  premium: ['Confort premium mental déployé.', 'Expérience ouatée simulée.', 'Votre assise bénéficie d’un protocole supérieur.'],
  classic: []
};

const badgeDefinitions = [
  { id: 'first', name: 'Premier déroulement', detail: 'Premier swipe valide certifié.', icon: '01', test: s => s.sessions >= 1 },
  { id: 'eco5', name: 'Sobriété certifiée', detail: '5 swipes en mode Éco.', icon: 'É', test: s => s.modeSessions.eco >= 5 },
  { id: 'premium5', name: 'Confort augmenté', detail: '5 swipes en mode Premium.', icon: 'P', test: s => s.modeSessions.premium >= 5 },
  { id: 'engaged', name: 'Rouleau engagé', detail: '25 feuilles virtuelles utilisées.', icon: '25', test: s => s.sheets >= 25 },
  { id: 'demat', name: 'Hygiène dématérialisée', detail: '10 sessions de déroulement.', icon: '10', test: s => s.sessions >= 10 },
  { id: 'master', name: 'Maître du trône numérique', detail: '50 feuilles virtuelles utilisées.', icon: '50', test: s => s.sheets >= 50 }
];

const defaultState = () => ({ sheets: 0, sessions: 0, mode: 'classic', modeSessions: { classic: 0, eco: 0, premium: 0 }, unlockedBadges: [] });
let state = loadState();
let drag = { active: false, pointerId: null, startX: 0, startY: 0, distance: 0 };

function loadState() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function initTheme() {
  const theme = localStorage.getItem(THEME_KEY) || 'light';
  dom.root.dataset.theme = theme;
  dom.themeSwitch.checked = theme === 'dark';
  dom.themeSwitch.addEventListener('change', () => {
    const next = dom.themeSwitch.checked ? 'dark' : 'light';
    dom.root.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });
}

function initOnboarding() {
  dom.onboarding.hidden = localStorage.getItem(ONBOARDING_KEY) === 'true';
  dom.startOnboarding.addEventListener('click', () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    dom.onboarding.hidden = true;
    showToast('Optimisation sanitaire initialisée.');
  });
}

function setMode(mode) {
  state.mode = modes[mode] ? mode : 'classic';
  dom.body.dataset.mode = state.mode;
  dom.modePill.textContent = modes[state.mode].label;
  dom.modeDescription.textContent = modes[state.mode].description;
  dom.modeButtons.forEach(button => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  saveState();
}

function initModes() {
  dom.modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  setMode(state.mode);
}

function updateVisual(distance) {
  const visualDistance = clamp(distance * modes[state.mode].visual, 0, 235);
  dom.root.style.setProperty('--drag-distance', `${visualDistance}px`);
  dom.root.style.setProperty('--roll-rotation', `${visualDistance * 0.34}deg`);
}
function resetVisual() { updateVisual(0); }

function onPointerDown(event) {
  drag = { active: true, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, distance: 0 };
  dom.swipeZone.setPointerCapture(event.pointerId);
  dom.swipeZone.classList.add('is-dragging');
}
function onPointerMove(event) {
  if (!drag.active || event.pointerId !== drag.pointerId) return;
  const dx = Math.max(0, event.clientX - drag.startX);
  const dy = Math.max(0, event.clientY - drag.startY);
  drag.distance = Math.max(dx, dy);
  updateVisual(drag.distance);
}
function onPointerUp(event) {
  if (!drag.active || event.pointerId !== drag.pointerId) return;
  const finalDistance = drag.distance;
  drag.active = false;
  dom.swipeZone.classList.remove('is-dragging');
  if (dom.swipeZone.hasPointerCapture(event.pointerId)) dom.swipeZone.releasePointerCapture(event.pointerId);
  finalDistance >= SWIPE_THRESHOLD ? commitSwipe(finalDistance) : bounceBack();
}
function bounceBack() {
  resetVisual();
  showToast('Geste analysé : seuil de cellulose virtuelle non atteint.');
}

function calculateSheets(distance) {
  let base = distance >= PREMIUM_THRESHOLD ? 4 : distance >= STRONG_THRESHOLD ? 2 : 1;
  if (distance >= 280) base = 5;
  return clamp(Math.max(1, Math.round(base * modes[state.mode].multiplier)), 1, 5);
}
function commitSwipe(distance) {
  const sheets = calculateSheets(distance);
  state.sheets += sheets;
  state.sessions += 1;
  state.modeSessions[state.mode] += 1;
  saveState();
  updateStats();
  validateAnimation();
  showToast(randomMessage());
  checkBadges();
}
function validateAnimation() {
  dom.swipeZone.classList.add('is-validating');
  updateVisual(Math.max(90, drag.distance));
  window.setTimeout(resetVisual, 260);
  window.setTimeout(() => dom.swipeZone.classList.remove('is-validating'), 560);
}
function randomMessage() {
  const pool = [...baseMessages, ...modeMessages[state.mode]];
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateStats() {
  const cleanliness = clamp(18 + state.sessions * 7 + state.sheets * 0.9, 0, 100);
  const comfort = clamp(12 + state.sheets * 1.7 + state.sessions * modes[state.mode].comfort, 0, 100);
  const trees = state.sheets * 0.000003;
  const co2 = state.sheets * 0.42 + state.sessions * 0.13;
  const demat = clamp(6 + state.sessions * 5.8 + state.sheets * 0.72, 0, 99.7);
  dom.stats.sheets.textContent = state.sheets;
  dom.stats.sessions.textContent = state.sessions;
  dom.stats.cleanliness.textContent = `${cleanliness.toFixed(0)}%`;
  dom.stats.comfort.textContent = comfort.toFixed(0);
  dom.stats.trees.textContent = trees.toFixed(6);
  dom.stats.co2.textContent = `${co2.toFixed(2)} g`;
  dom.stats.demat.textContent = `${demat.toFixed(1)}%`;
}

function renderBadges() {
  dom.badgesList.innerHTML = badgeDefinitions.map(badge => {
    const unlocked = state.unlockedBadges.includes(badge.id);
    return `<article class="badge ${unlocked ? 'is-unlocked' : ''}"><span class="badge-icon">${badge.icon}</span><div><strong>${badge.name}</strong><span>${badge.detail}</span></div></article>`;
  }).join('');
}
function checkBadges() {
  const newlyUnlocked = badgeDefinitions.filter(b => !state.unlockedBadges.includes(b.id) && b.test(state));
  if (!newlyUnlocked.length) return;
  newlyUnlocked.forEach(badge => {
    state.unlockedBadges.push(badge.id);
    showToast(`Certification débloquée : ${badge.name}.`);
  });
  saveState();
  renderBadges();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  dom.toastRegion.append(toast);
  window.setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; }, 2800);
  window.setTimeout(() => toast.remove(), 3300);
}

function resetData() {
  if (!confirm('Réinitialiser les stats, badges et onboarding PQ+ ?')) return;
  state = defaultState();
  saveState();
  localStorage.removeItem(ONBOARDING_KEY);
  dom.onboarding.hidden = false;
  setMode('classic');
  updateStats();
  renderBadges();
  resetVisual();
  showToast('Protocole sanitaire numérique réinitialisé.');
}

function initSwipe() {
  dom.swipeZone.addEventListener('pointerdown', onPointerDown);
  dom.swipeZone.addEventListener('pointermove', onPointerMove);
  dom.swipeZone.addEventListener('pointerup', onPointerUp);
  dom.swipeZone.addEventListener('pointercancel', onPointerUp);
  dom.swipeZone.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); commitSwipe(125); }
  });
  dom.assistButton.addEventListener('click', () => commitSwipe(140));
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }
}

initTheme();
initOnboarding();
initModes();
initSwipe();
updateStats();
renderBadges();
checkBadges();
registerServiceWorker();
