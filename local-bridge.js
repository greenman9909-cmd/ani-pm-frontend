(() => {
  'use strict';

  // Branding Banner
  console.log(
    '%c ✨ AML mock %c Extracted by SPA-Ripper %c Built by Owais (@greenman9909-cmd) ✨ ',
    'background: #0f172a; color: #818cf8; font-size: 13px; font-weight: 800; padding: 6px 10px; border-radius: 6px 0 0 6px; border: 1px solid #312e81;',
    'background: #4f46e5; color: #ffffff; font-size: 13px; font-weight: 800; padding: 6px 10px;',
    'background: #1e1b4b; color: #34d399; font-size: 13px; font-weight: 800; padding: 6px 10px; border-radius: 0 6px 6px 0; border: 1px solid #312e81;'
  );

  const managed = new Map();
  let backup = false;
  let changing = false;
  let soundUnmuted = false;

  const routeKey = () => {
    const params = new URLSearchParams(location.search);
    return location.pathname + '?ep=' + (params.get('ep') || params.get('episode') || '');
  };
  let currentRoute = routeKey();

  // Strip and prevent sandbox on all iframes so MegaPlay player loads cleanly
  try {
    const origSetAttribute = HTMLIFrameElement.prototype.setAttribute;
    HTMLIFrameElement.prototype.setAttribute = function(name, val) {
      if (typeof name === 'string' && name.toLowerCase() === 'sandbox') {
        this.removeAttribute('sandbox');
        return;
      }
      return origSetAttribute.apply(this, arguments);
    };
    Object.defineProperty(HTMLIFrameElement.prototype, 'sandbox', {
      get() { return null; },
      set(v) { this.removeAttribute('sandbox'); },
      configurable: true
    });
  } catch (e) {}

  // Forward client-side unhandled errors to /api/client-error for telemetry & diagnosis
  window.addEventListener('error', (event) => {
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.message || String(event),
          stack: (event.error && event.error.stack) || null,
          url: location.href
        })
      }).catch(() => {});
    } catch (e) {}
  });
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: (reason && reason.message) || String(reason),
          stack: (reason && reason.stack) || null,
          url: location.href
        })
      }).catch(() => {});
    } catch (e) {}
  });

  const isWatch = () => /^\/watch(?:\/|$)/.test(location.pathname);
  const isTitle = () => /^\/(?:anime|ani)\//.test(location.pathname);

  // Styles for backup switcher and hero audio toggle
  const style = document.createElement('style');
  style.textContent = `
    .ani-local-backup{position:fixed;right:20px;bottom:22px;z-index:1000;display:flex;align-items:center;gap:10px;padding:10px 16px;border:1px solid #ffffff26;border-radius:999px;background:#27232bea;color:#fff;backdrop-filter:blur(18px);font:500 14px system-ui;cursor:pointer}
    .ani-local-backup:focus-visible,.ani-local-resume button:focus-visible{outline:2px solid white;outline-offset:4px}
    .ani-local-backup[aria-checked=true]{background:#62516b}
    .ani-local-backup i{display:block;width:30px;height:18px;border-radius:99px;background:#ffffff35;position:relative}
    .ani-local-backup i:before{content:"";position:absolute;left:3px;top:3px;width:12px;height:12px;background:white;border-radius:50%}
    .ani-local-backup[aria-checked=true] i:before{left:15px}
    .ani-local-resume{border:0;background:#080808;color:#fff;border-radius:18px;padding:40px 30px;text-align:center;width:min(560px,90vw);font:16px system-ui}
    .ani-local-resume::backdrop{background:#000d}
    .ani-local-resume h2{font-size:24px;margin:0 0 20px}
    .ani-local-resume button{border:0;border-radius:999px;padding:12px 20px;margin:5px;background:#fff;color:#000;font:inherit;cursor:pointer}
    .ani-local-resume button+button{background:transparent;color:#bbb}
    .ani-local-status{position:fixed;bottom:78px;right:20px;z-index:1001;max-width:320px;padding:12px;background:#111;color:white;border-radius:10px;font:14px system-ui}
    .ani-local-backup[hidden]{display:none}
    
    /* Floating Hero Sound Toggle */
    .ani-hero-audio-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: rgba(18, 16, 23, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 9999px;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      backdrop-filter: blur(16px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ani-hero-audio-btn:hover {
      background: rgba(35, 30, 45, 0.95);
      border-color: rgba(255, 255, 255, 0.4);
      transform: scale(1.04);
    }
    .ani-hero-audio-btn[hidden] {
      display: none !important;
    }
  `;
  document.head.append(style);

  // Backup server button
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'ani-local-backup';
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-label', 'Use backup server');
  toggle.innerHTML = '<i aria-hidden="true"></i><span>Backup server</span>';
  toggle.hidden = true;
  document.body.append(toggle);

  // Sound toggle button for Hero Preview
  const audioBtn = document.createElement('button');
  audioBtn.type = 'button';
  audioBtn.className = 'ani-hero-audio-btn';
  audioBtn.setAttribute('aria-label', 'Toggle preview sound');
  audioBtn.innerHTML = '<span>🔇</span><span>Unmute Preview</span>';
  audioBtn.hidden = true;
  document.body.append(audioBtn);

  function broadcastSound(on) {
    soundUnmuted = on;
    audioBtn.innerHTML = on ? '<span>🔊</span><span>Mute Preview</span>' : '<span>🔇</span><span>Unmute Preview</span>';
    // Send to managed videos
    for (const [target] of managed) {
      if (target.tagName === 'VIDEO') {
        target.muted = !on;
      } else if (target.tagName === 'IFRAME') {
        try {
          target.contentWindow?.postMessage({
            source: 'settlar-embed',
            version: 1,
            type: 'sound',
            on: on
          }, '*');
        } catch(e) {}
      }
    }
    // Also find any preview iframe in DOM
    document.querySelectorAll('iframe').forEach(f => {
      try {
        f.contentWindow?.postMessage({
          source: 'settlar-embed',
          version: 1,
          type: 'sound',
          on: on
        }, '*');
      } catch(e) {}
    });
  }

  audioBtn.addEventListener('click', (e) => {
    e.preventDefault();
    broadcastSound(!soundUnmuted);
  });

  const status = document.createElement('p');
  status.className = 'ani-local-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  document.body.append(status);

  function paintToggle() {
    toggle.setAttribute('aria-checked', String(backup));
    const native = [...document.querySelectorAll('button,[role="switch"]')].find(el => el !== toggle && /^backup server$/i.test(el.textContent.trim()));
    toggle.hidden = !isWatch() || !!native;
    if (native) native.setAttribute(native.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(backup));
    
    // Show audio button when on title page with preview player
    audioBtn.hidden = !isTitle();
  }

  async function changeBackup() {
    if (changing) return;
    changing = true;
    toggle.disabled = true;
    try {
      const response = await fetch('/api/local/backup', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:!backup})});
      if (!response.ok) throw Error('The server setting could not be changed.');
      location.reload();
    } catch (error) {
      status.textContent = error.message;
      status.hidden = false;
      changing = false;
      toggle.disabled = false;
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('button,[role="switch"]');
    if (button && isWatch() && (button === toggle || /^backup server$/i.test(button.textContent.trim()))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      changeBackup();
    }
  }, true);

  fetch('/api/local/preferences').then(response => response.json()).then(value => {
    backup = value.backup === true;
    paintToggle();
  }).catch(() => {});

  // Scroll observer: pauses video when scrolled down, resumes when scrolled back up
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const target = entry.target;
      const state = managed.get(target);
      if (!state || state.kind !== 'preview') continue;
      
      const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      state.visible = isVisible;

      if (!isVisible || document.hidden) {
        if (target.tagName === 'VIDEO') {
          state.resume = state.resume || !target.paused;
          target.pause();
        } else if (target.tagName === 'IFRAME') {
          state.resume = true;
          try {
            target.contentWindow?.postMessage({
              source: 'settlar-embed',
              version: 1,
              type: 'pause'
            }, '*');
          } catch(e) {}
        }
      } else if (state.resume && isTitle()) {
        state.resume = false;
        if (target.tagName === 'VIDEO') {
          target.play().catch(() => {});
        } else if (target.tagName === 'IFRAME') {
          try {
            target.contentWindow?.postMessage({
              source: 'settlar-embed',
              version: 1,
              type: 'play'
            }, '*');
          } catch(e) {}
        }
      }
    }
  }, {threshold:[0, 0.15]});

  function wireElement(el) {
    if (managed.has(el) || (!isTitle() && !isWatch())) return;
    const isVid = el.tagName === 'VIDEO';
    const isIfr = el.tagName === 'IFRAME';
    if (!isVid && !isIfr) return;

    const kind = isTitle() ? 'preview' : 'episode';
    const state = {kind, resume: false, visible: false, cleanup: () => {}};
    managed.set(el, state);

    if (kind === 'preview') {
      observer.observe(el);
      // Auto-start preview video after approx 3 seconds
      setTimeout(() => {
        if (!el.isConnected) return;
        if (isVid) {
          el.muted = !soundUnmuted;
          el.play().catch(() => {});
        } else if (isIfr) {
          try {
            el.contentWindow?.postMessage({
              source: 'settlar-embed',
              version: 1,
              type: 'play'
            }, '*');
          } catch(e) {}
        }
      }, 3000);
      return;
    }

    if (isVid) {
      const key = 'ani-local-position:' + routeKey();
      let lastSaved = 0;
      const save = () => {
        if (!Number.isFinite(el.currentTime) || !Number.isFinite(el.duration) || Date.now()-lastSaved<5000) return;
        lastSaved = Date.now();
        try {
          localStorage.setItem(key, String(el.duration-el.currentTime<15 ? 0 : el.currentTime));
        } catch {}
      };

      let prompted = false;
      const restore = () => {
        if (prompted) return;
        prompted = true;
        let seconds = 0;
        try {
          seconds = Number(localStorage.getItem(key)||0);
        } catch {}
        if (!Number.isFinite(seconds) || seconds < 5 || seconds >= el.duration-15) return;
        if (/continue watching\?/i.test(document.body.innerText)) return;
        el.pause();
        const previous = document.activeElement;
        const dialog = document.createElement('dialog');
        dialog.className = 'ani-local-resume';
        dialog.setAttribute('aria-label', 'Continue watching');
        const title = document.createElement('h2');
        title.textContent = 'Continue watching?';
        const resume = document.createElement('button');
        resume.textContent = 'Continue from ' + Math.floor(seconds/60) + ':' + String(Math.floor(seconds%60)).padStart(2,'0');
        const restart = document.createElement('button');
        restart.textContent = 'Start from the beginning';
        const close = () => {
          dialog.close();
          dialog.remove();
          previous?.focus?.();
        };
        resume.onclick = () => {
          el.currentTime = seconds;
          close();
          el.play().catch(() => {});
        };
        restart.onclick = () => {
          el.currentTime = 0;
          close();
          el.play().catch(() => {});
        };
        dialog.addEventListener('cancel', () => {
          dialog.remove();
          previous?.focus?.();
        });
        dialog.append(title, resume, restart);
        document.body.append(dialog);
        dialog.showModal();
        resume.focus();
      };

      el.addEventListener('loadedmetadata', restore);
      el.addEventListener('timeupdate', save);
      el.addEventListener('pause', save);
      if (el.readyState >= 1) restore();
      state.cleanup = () => {
        el.removeEventListener('loadedmetadata', restore);
        el.removeEventListener('timeupdate', save);
        el.removeEventListener('pause', save);
      };
    }
  }

  function scan() {
    const routeChanged = currentRoute !== routeKey();
    if (routeChanged) currentRoute = routeKey();
    for (const [el, state] of managed) {
      if (!el.isConnected || routeChanged) {
        if (state.kind === 'preview') {
          if (el.tagName === 'VIDEO') el.pause();
        }
        observer.unobserve(el);
        state.cleanup();
        managed.delete(el);
      }
    }
    document.querySelectorAll('video').forEach(wireElement);
    document.querySelectorAll('iframe').forEach(wireElement);
    document.querySelectorAll('iframe[sandbox]').forEach(f => f.removeAttribute('sandbox'));
    paintToggle();
  }

  let pending = false;
  new MutationObserver(() => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        scan();
      });
    }
  }).observe(document.body, {childList: true, subtree: true});

  document.addEventListener('visibilitychange', () => {
    for (const [el, state] of managed) {
      if (state.kind === 'preview') {
        if (document.hidden) {
          if (el.tagName === 'VIDEO') {
            state.resume = state.resume || !el.paused;
            el.pause();
          }
        } else if (state.resume && state.visible && isTitle()) {
          state.resume = false;
          if (el.tagName === 'VIDEO') {
            el.play().catch(() => {});
          }
        }
      }
    }
  });

  window.addEventListener('popstate', scan);
  scan();
})();
