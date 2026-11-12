let userPaused = false;
let isForcingPlay = false;

// 1. Track intentional user pauses (click or keyboard)
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('video') || e.target.closest('[aria-label*="Pause" i]')) {
    userPaused = true;
    setTimeout(() => { userPaused = false; }, 1000);
  }
}, true);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
    userPaused = true;
    setTimeout(() => { userPaused = false; }, 1000);
  }
}, true);

// 2. Block YouTube TV from seeing the forced 'play' event so it doesn't close the guide
['play', 'playing'].forEach(evt => {
  document.addEventListener(evt, (e) => {
    if (isForcingPlay && e.target.tagName === 'VIDEO') {
      e.stopImmediatePropagation();
    }
  }, true);
});

// 3. Block programmatic focus/scroll jumps when forcing playback
const origFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function(...args) {
  if (isForcingPlay) return;
  return origFocus.apply(this, args);
};

// 4. Resume playback silently when YouTube TV auto-pauses
document.addEventListener('pause', (e) => {
  const video = e.target;
  if (video.tagName === 'VIDEO' && !userPaused) {
    isForcingPlay = true;
    video.play()
      .catch(() => {})
      .finally(() => {
        setTimeout(() => { isForcingPlay = false; }, 150);
      });
  }
}, true);
