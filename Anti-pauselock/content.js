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
const nativePlay = HTMLVideoElement.prototype.play;

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

// 4. On scroll up: unlock disabled buttons & call YouTube's internal player seekBy() API
let resetTimer;
window.addEventListener('wheel', (e) => {
  if (e.deltaY >= 0) return;

  document.querySelectorAll('ytu-icon-button[disabled]').forEach((el) => {
    el.disabled = false;
    el.removeAttribute('disabled');
    if (el.set) el.set('disabled', false);

    const innerBtn = el.querySelector('button');
    if (innerBtn) {
      innerBtn.disabled = false;
      innerBtn.removeAttribute('disabled');
    }
  });

  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    const player = document.querySelector('#movie_player, .html5-video-player');
    const stuckPlayBtn = document.querySelector('#play-pause-button[aria-label="Play (k)"]');
    if (player && typeof player.seekBy === 'function' && stuckPlayBtn) {
      lastHumanInput = Date.now();
      player.seekBy(-0.1);
      player.seekBy(0.1);
    }
  }, 150);
}, { passive: true, capture: true });
