// Shared registry for the active media element / iframe.
// Screen.jsx registers the video element (MP4).
// Room.jsx registers the YouTube iframe ref via setYTIframe.

let videoEl = null;
let ytIframe = null;

export function registerVideoEl(el) { videoEl = el; }
export function unregisterVideoEl() { videoEl = null; }
export function getVideoEl() { return videoEl; }

export function setYTIframe(el) { ytIframe = el; }

// Detect YouTube URL and return embed URL, or null if not YouTube
export function toYouTubeEmbed(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}?autoplay=1&controls=1&rel=0&enablejsapi=1`;
}

export function isYouTubeUrl(url) {
  return /youtu(be\.com|\.be)/i.test(url);
}

// Apply a sync command to whichever media is active
export function applyCommand(msg) {
  // MP4 video element
  if (videoEl) {
    if (msg.time !== undefined) videoEl.currentTime = msg.time;
    if (msg.type === 'play')  videoEl.play().catch(() => {});
    if (msg.type === 'pause') videoEl.pause();
    return;
  }
  // YouTube iframe via postMessage (YouTube IFrame API)
  if (ytIframe) {
    try {
      const win = ytIframe.contentWindow;
      if (msg.time !== undefined) {
        win.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [msg.time, true] }), '*');
      }
      if (msg.type === 'play') {
        win.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      }
      if (msg.type === 'pause') {
        win.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
      }
    } catch { /* cross-origin block — ignore */ }
  }
}
