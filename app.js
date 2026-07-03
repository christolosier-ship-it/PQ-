const STORAGE_KEY = 'pqplus.state.v1';
const THEME_KEY = 'pqplus.theme.v1';
const ONBOARDING_KEY = 'pqplus.onboarding.done.v1';
const SWIPE_THRESHOLD = 50;
const STRONG_THRESHOLD = 120;
const PREMIUM_THRESHOLD = 220;
const MAX_VISUAL_DISTANCE = 292;

const dom = {
  root: document.documentElement,
  body: document.body,
  themeSwitch: document.querySelector('#themeSwitch'),
  onboarding: document.querySelector('#onboarding'),
  startOnboarding: document.querySelector('#startOnboarding'),
  swipeZone: document.querySelector('#swipeZone'),
  paperSvg: document.querySelector('#paperSvg'),
  paperGroup: document.querySelector('#paperGroup'),
  rollGroup: document.querySelector('#rollGroup'),
  detachedSheet: document.querySelector('#detachedSheet'),
  fiberLayer: document.querySelector('#fiberLayer'),
  sheetsPreview: document.querySelector('#sheetsPreview'),
  previewSheets: document.querySelector('#previewSheets'),
  previewLabel: document.querySelector('#sheetsPreview small'),
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
  classic: {
    label: 'Classique',
    description: 'Équilibre standard entre confort et sobriété.',
    multiplier: 1,
    comfort: 5,
    visual: 1,
    rotation: 0.42,
    sway: 6,
    release: 1
  },
  eco: {
    label: 'Éco',
    description: 'Réduction algorithmique de l’empreinte feuille.',
    multiplier: 0.68,
    comfort: 2,
    visual: 0.72,
    rotation: 0.34,
    sway: 3,
    release: 0.82
  },
  premium: {
    label: 'Premium',
    description: 'Expérience triple épaisseur mentale, confort augmenté.',
    multiplier: 1.35,
    comfort: 11,
    visual: 1.22,
    rotation: 0.5,
    sway: 9,
    release: 1.18
  }
};

const baseMessages = [
  'Déroulement numérique validé.',
  'Indice de confort recalibré.',
  'Friction symbolique optimisée.',
  'Empreinte cellulose évitée avec succès.',
  'Propreté estimée conforme aux standards PQ+.',
  'Votre hygiène dématérialisée progresse.',
  'Triple épaisseur cognitive activée.',
  'Analyse du trône terminée.',
  'Performance sanitaire virtuelle stable.',
  'Aucune fibre réelle n’a été mobilisée.',
  'Perforation virtuelle honorablement respectée.',
  'Bobine sanitaire synchronisée.'
];

const modeMessages = {
  eco: [
    'Sobriété feuille renforcée.',
    'Consommation virtuelle contenue.',
    'Impact environnemental imaginaire réduit.',
    'Mode Éco : la feuille pense avant de sortir.'
  ],
  premium: [
    'Confort premium mental déployé.',
    'Expérience ouatée simulée.',
    'Votre confort bénéficie d’un protocole supérieur.',
    'Triple épaisseur narrative confirmée.'
  ],
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

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const defaultState = () => ({
  sheets: 0,
  sessions: 0,
  mode: 'classic',
  modeSessions: { classic: 0, eco: 0, premium: 0 },
  unlockedBadges: []
});

let state = loadState();
let drag = {
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  distance: 0,
  lastDistance: 0,
  lastTime: 0,
  velocity: 0
};
let visualFrame = null;
let pendingVisual = { distance: 0, velocity: 0 };

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      ...defaultState(),
      ...parsed,
      modeSessions: { ...defaultState().modeSessions, ...(parsed.modeSessions || {}) },
      unlockedBadges: Array.isArray(parsed.unlockedBadges) ? parsed.unlockedBadges : []
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setCssVar(name, value) {
  dom.root.style.setProperty(name, value);
}

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

function scheduleVisual(distance, velocity = 0) {
  pendingVisual = { distance, velocity };

  if (visualFrame) return;
  visualFrame = window.requestAnimationFrame(() => {
    visualFrame = null;
    updateVisual(pendingVisual.distance, pendingVisual.velocity);
  });
}

function updateVisual(distance, velocity = 0) {
  const mode = modes[state.mode];
  const visualDistance = clamp(distance * mode.visual, 0, MAX_VISUAL_DISTANCE);
  const progress = clamp(visualDistance / MAX_VISUAL_DISTANCE, 0, 1);
  const absVelocity = Math.abs(velocity);
  const sway = Math.sin(progress * Math.PI * 1.65) * mode.sway + clamp(velocity * 9, -10, 10);
  const tilt = clamp(velocity * 5, -8, 8);
  const rotation = visualDistance * mode.rotation + velocity * 34;
  const paperScale = 1 + progress * 1.18 * mode.release;
  const perfShift = visualDistance * 0.55;
  const stageGlow = clamp(progress * 0.9 + absVelocity * 0.25, 0, 1);
  const tearOpacity = clamp(progress * 1.25, 0, 1);
  const previewVisible = drag.active && distance > 12 ? 1 : 0;

  setCssVar('--drag-distance', `${visualDistance.toFixed(1)}px`);
  setCssVar('--drag-progress', progress.toFixed(3));
  setCssVar('--roll-rotation', `${rotation.toFixed(2)}deg`);
  setCssVar('--paper-scale', paperScale.toFixed(3));
  setCssVar('--paper-sway', `${sway.toFixed(1)}px`);
  setCssVar('--paper-tilt', `${tilt.toFixed(2)}deg`);
  setCssVar('--perf-shift', `${perfShift.toFixed(1)}px`);
  setCssVar('--stage-glow', stageGlow.toFixed(3));
  setCssVar('--tear-opacity', tearOpacity.toFixed(3));
  setCssVar('--preview-opacity', previewVisible);
  setCssVar('--preview-y', previewVisible ? '-2px' : '10px');

  updatePreview(calculateSheets(distance, velocity));
}

function resetVisual() {
  if (visualFrame) {
    window.cancelAnimationFrame(visualFrame);
    visualFrame = null;
  }

  setCssVar('--drag-distance', '0px');
  setCssVar('--drag-progress', '0');
  setCssVar('--roll-rotation', '0deg');
  setCssVar('--paper-scale', '1');
  setCssVar('--paper-sway', '0px');
  setCssVar('--paper-tilt', '0deg');
  setCssVar('--perf-shift', '0px');
  setCssVar('--stage-glow', '0');
  setCssVar('--fiber-pop', '0');
  setCssVar('--tear-opacity', '0');
  setCssVar('--preview-opacity', '0');
  setCssVar('--preview-y', '10px');
  updatePreview(0);
}

function updatePreview(sheets) {
  if (!dom.previewSheets) return;
  dom.previewSheets.textContent = String(sheets);
  if (dom.previewLabel) {
    dom.previewLabel.textContent = sheets > 1 ? 'feuilles virtuelles' : 'feuille virtuelle';
  }
}

function onPointerDown(event) {
  if (event.button !== undefined && event.button !== 0) return;

  event.preventDefault();
  const now = performance.now();

  drag = {
    active: true,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    distance: 0,
    lastDistance: 0,
    lastTime: now,
    velocity: 0
  };

  if (dom.swipeZone.setPointerCapture) {
    dom.swipeZone.setPointerCapture(event.pointerId);
  }

  dom.swipeZone.classList.remove('is-bouncing', 'is-validating', 'is-tearing');
  dom.swipeZone.classList.add('is-dragging');
  scheduleVisual(0, 0);
}

function onPointerMove(event) {
  if (!drag.active || event.pointerId !== drag.pointerId) return;

  event.preventDefault();

  const dx = Math.max(0, event.clientX - drag.startX);
  const dy = Math.max(0, event.clientY - drag.startY);
  const distance = Math.max(dx, dy);
  const now = performance.now();
  const elapsed = Math.max(16, now - drag.lastTime);
  const rawVelocity = (distance - drag.lastDistance) / elapsed;

  drag.velocity = clamp(drag.velocity * 0.35 + rawVelocity * 0.65, -2.4, 2.4);
  drag.distance = distance;
  drag.lastDistance = distance;
  drag.lastTime = now;

  scheduleVisual(drag.distance, drag.velocity);
}

function onPointerUp(event) {
  if (!drag.active || event.pointerId !== drag.pointerId) return;

  const finalDistance = drag.distance;
  const finalVelocity = drag.velocity;

  drag.active = false;
  dom.swipeZone.classList.remove('is-dragging');

  if (dom.swipeZone.hasPointerCapture && dom.swipeZone.hasPointerCapture(event.pointerId)) {
    dom.swipeZone.releasePointerCapture(event.pointerId);
  }

  finalDistance >= SWIPE_THRESHOLD ? commitSwipe(finalDistance, finalVelocity) : bounceBack();
}

function bounceBack() {
  dom.swipeZone.classList.add('is-bouncing');
  resetVisual();
  showToast('Geste analysé : seuil de cellulose virtuelle non atteint.');
  window.setTimeout(() => dom.swipeZone.classList.remove('is-bouncing'), 440);
}

function calculateSheets(distance, velocity = 0) {
  const effectiveDistance = distance + clamp(velocity * 90, 0, 150);
  let base = effectiveDistance >= PREMIUM_THRESHOLD ? 4 : effectiveDistance >= STRONG_THRESHOLD ? 2 : 1;

  if (effectiveDistance >= 310) base = 5;
  if (effectiveDistance >= 390) base = 6;

  const adjusted = Math.round(base * modes[state.mode].multiplier);
  const maxByMode = state.mode === 'eco' ? 4 : 6;

  return clamp(Math.max(1, adjusted), 1, maxByMode);
}

function commitSwipe(distance, velocity = 0) {
  const sheets = calculateSheets(distance, velocity);

  state.sheets += sheets;
  state.sessions += 1;
  state.modeSessions[state.mode] += 1;

  saveState();
  validateAnimation(distance, velocity, sheets);
  updateStats(true);
  showToast(randomMessage(sheets));
  checkBadges();
}

function validateAnimation(distance, velocity, sheets) {
  if (reducedMotionQuery.matches) {
    resetVisual();
    return;
  }

  const releaseDistance = Math.max(96, distance);
  dom.swipeZone.classList.add('is-validating', 'is-tearing');
  setCssVar('--fiber-pop', '1');
  scheduleVisual(releaseDistance, velocity);

  const rollKick = clamp(velocity * 55 + sheets * 18, 24, 160);
  animateElement(dom.rollGroup, [
    { transform: `rotate(${rollKick * -0.2}deg)` },
    { transform: `rotate(${rollKick}deg)` },
    { transform: 'rotate(0deg)' }
  ], 620, 'cubic-bezier(.16, .9, .2, 1)');

  animateElement(dom.paperGroup, [
    { transform: 'translateY(0) scaleY(1)' },
    { transform: `translateY(${Math.min(70, sheets * 12)}px) scaleY(1.08)` },
    { transform: 'translateY(0) scaleY(1)' }
  ], 520, 'cubic-bezier(.16, .9, .2, 1)');

  animateElement(dom.detachedSheet, [
    { opacity: 0, transform: 'translateY(-10px) rotate(0deg) scale(.96)' },
    { opacity: .95, transform: 'translateY(10px) rotate(2deg) scale(1)' },
    { opacity: 0, transform: `translateY(${80 + sheets * 10}px) rotate(${sheets * 2.6}deg) scale(1.08)` }
  ], 650, 'cubic-bezier(.16, .9, .2, 1)');

  window.setTimeout(resetVisual, 420);
  window.setTimeout(() => {
    dom.swipeZone.classList.remove('is-validating', 'is-tearing');
    setCssVar('--fiber-pop', '0');
  }, 740);
}

function animateElement(element, frames, duration, easing) {
  if (!element || typeof element.animate !== 'function') return null;

  return element.animate(frames, {
    duration,
    easing,
    fill: 'none'
  });
}

function randomMessage(sheets) {
  const pool = [...baseMessages, ...modeMessages[state.mode]];
  const message = pool[Math.floor(Math.random() * pool.length)];

  if (sheets >= 5) return `${message} ${sheets} feuilles virtuelles libérées avec panache.`;
  if (sheets >= 3) return `${message} Déroulement renforcé : ${sheets} feuilles.`;

  return message;
}

function updateStats(animate = false) {
  const cleanliness = clamp(18 + state.sessions * 7 + state.sheets * 0.9, 0, 100);
  const comfort = clamp(12 + state.sheets * 1.7 + state.sessions * modes[state.mode].comfort, 0, 100);
  const trees = state.sheets * 0.000003;
  const co2 = state.sheets * 0.42 + state.sessions * 0.13;
  const demat = clamp(6 + state.sessions * 5.8 + state.sheets * 0.72, 0, 99.7);

  setStatText(dom.stats.sheets, state.sheets, animate);
  setStatText(dom.stats.sessions, state.sessions, animate);
  setStatText(dom.stats.cleanliness, `${cleanliness.toFixed(0)}%`, animate);
  setStatText(dom.stats.comfort, comfort.toFixed(0), animate);
  setStatText(dom.stats.trees, trees.toFixed(6), animate);
  setStatText(dom.stats.co2, `${co2.toFixed(2)} g`, animate);
  setStatText(dom.stats.demat, `${demat.toFixed(1)}%`, animate);
}

function setStatText(node, value, animate) {
  if (!node) return;

  const text = String(value);
  const changed = node.textContent !== text;
  node.textContent = text;

  if (animate && changed && !reducedMotionQuery.matches) {
    node.classList.remove('is-bumping');
    void node.offsetWidth;
    node.classList.add('is-bumping');
  }
}

function renderBadges(newIds = []) {
  dom.badgesList.innerHTML = badgeDefinitions.map(badge => {
    const unlocked = state.unlockedBadges.includes(badge.id);
    const isNew = newIds.includes(badge.id);
    return `<article class="badge ${unlocked ? 'is-unlocked' : ''} ${isNew ? 'is-new' : ''}"><span class="badge-icon">${badge.icon}</span><div><strong>${badge.name}</strong><span>${badge.detail}</span></div></article>`;
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
  renderBadges(newlyUnlocked.map(badge => badge.id));
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  dom.toastRegion.append(toast);

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 2800);
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
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commitSwipe(145, 0.65);
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      commitSwipe(125, 0.45);
    }
  });

  dom.assistButton.addEventListener('click', () => commitSwipe(150, 0.52));
}

function initSettings() {
  dom.resetButton.addEventListener('click', resetData);
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
initSettings();
updateStats();
renderBadges();
checkBadges();
resetVisual();
registerServiceWorker();
