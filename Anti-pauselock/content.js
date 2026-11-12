// 0. Hide the "Programs made for kids are paused as you browse" toast popup
const style = document.createElement('style');
style.textContent = `
  ytu-toast,
  tp-yt-paper-toast,
  ytu-notification-toast,
  [aria-label*="paused as you browse" i] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;
(document.head || document.documentElement).appendChild(style);

let lastHumanInput = 0;
const nativePause = HTMLVideoElement.prototype.pause;

// 1. Track human input timestamps
['pointerdown', 'pointerup', 'click'].forEach((evt) => {
  window.addEventListener(evt, (e) => {
    if (e.isTrusted) lastHumanInput = Date.now();
  }, true);
});

window.addEventListener('keydown', (e) => {
  if (!e.isTrusted) return;
  if (['Space', 'KeyK', 'MediaPlayPause', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    lastHumanInput = Date.now();
  }
}, true);

// 2. Block automatic COPPA pauses when no human click or pause key occurred
HTMLVideoElement.prototype.pause = function () {
  if (Date.now() - lastHumanInput < 800) {
    return nativePause.apply(this, arguments);
  }
};

// 3. Fallback: If YTTV ignores #play-pause-button after COPPA scroll, force toggle video directly
document.addEventListener('click', (e) => {
  if (!e.isTrusted) return;
  const playBtn = e.target.closest && e.target.closest('#play-pause-button');
  if (playBtn && playBtn.getAttribute('aria-label') === 'Play (k)') {
    const video = document.querySelector('video');
    if (video && !video.paused) {
      nativePause.call(video);
    }
  }
}, true);

// 4. Unlock buttons & sync player ONLY when the video player is actually visible in the center of the screen
let syncCooldown = false;
window.addEventListener('pointermove', () => {
  if (syncCooldown) return;

  // Check what is physically visible at the center of the screen
  const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  const playerVisible = centerEl && centerEl.closest('ytu-player, ytu-player-controller, #movie_player');
  if (!playerVisible) return;

  // Always keep player icon buttons unlocked when the player is visible
  document.querySelectorAll('ytu-icon-button[disabled]').forEach((el) => {
    el.disabled = false;
    el.removeAttribute('disabled');
    const innerBtn = el.querySelector('button');
    if (innerBtn) {
      innerBtn.disabled = false;
      innerBtn.removeAttribute('disabled');
    }
  });

  const stuckPlayBtn = document.querySelector('#play-pause-button[aria-label="Play (k)"]');
  if (!stuckPlayBtn) return;

  syncCooldown = true;
  const player = document.querySelector('#movie_player, .html5-video-player');
  if (player && typeof player.seekBy === 'function') {
    lastHumanInput = Date.now();
    player.seekBy(-0.1);
    player.seekBy(0.1);
  }

  setTimeout(() => { syncCooldown = false; }, 1000);
}, { passive: true });
