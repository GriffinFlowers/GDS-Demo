// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  const screen = document.getElementById('screen');
  if (!screen) return;

  let zCounter = 20;

  function bringToFront(win) {
    zCounter += 1;
    win.style.zIndex = String(zCounter);
  }

  function centerWindow(win) {
    // size of the fake blue screen
    const sw = screen.clientWidth;
    const sh = screen.clientHeight;

    // size of the window
    const ww = win.offsetWidth;
    const wh = win.offsetHeight;

    const left = (sw - ww) / 2;
    const top  = (sh - wh) / 2;

    // IMPORTANT: wipe out any old bottom/right positioning
    win.style.left   = left + 'px';
    win.style.top    = top  + 'px';
    win.style.right  = 'auto';
    win.style.bottom = 'auto';
  }

  function clampIntoScreen(win) {
    const sw = screen.clientWidth;
    const sh = screen.clientHeight;
    const ww = win.offsetWidth;
    const wh = win.offsetHeight;

    if (ww > sw || wh > sh) return; // too big, don’t clamp

    let left = parseFloat(win.style.left || '0');
    let top  = parseFloat(win.style.top  || '0');

    if (left < 0) left = 0;
    if (top  < 0) top  = 0;
    if (left > sw - ww) left = sw - ww;
    if (top  > sh - wh) top  = sh - wh;

    win.style.left = left + 'px';
    win.style.top  = top  + 'px';
  }

  // ---- 1) Dock icons → open + center window ----
  document.querySelectorAll('.icon[data-open]').forEach(icon => {
    icon.addEventListener('click', () => {
      const sel = icon.getAttribute('data-open');
      if (!sel) return;
      const win = document.querySelector(sel);
      if (!win) return;

      win.classList.remove('hidden');

      // Wait a tick so the browser can layout & measure the window size
      requestAnimationFrame(() => {
        centerWindow(win);
        bringToFront(win);
      });
    });
  });

  // ---- 2) Close / Min buttons (red & yellow) ----
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const win = btn.closest('.win');
      if (!win) return;
      win.classList.add('hidden');
    });
  });

  document.querySelectorAll('[data-min]').forEach(btn => {
    btn.addEventListener('click', () => {
      const win = btn.closest('.win');
      if (!win) return;
      win.classList.add('hidden'); // later you can make this a real "minimize"
    });
  });

  // ---- 3) Green button = *recentre only*, no resize ----
  document.querySelectorAll('.btn-max').forEach(btn => {
    btn.addEventListener('click', () => {
      const win = btn.closest('.win');
      if (!win) return;
      centerWindow(win);
      bringToFront(win);
    });
  });

  // ---- 4) Dragging windows inside the fake screen ----
  document.querySelectorAll('.win .titlebar').forEach(bar => {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let currentWin = null;

    bar.addEventListener('mousedown', e => {
      const win = bar.closest('.win');
      if (!win) return;
      dragging = true;
      currentWin = win;
      bringToFront(win);

      const screenRect = screen.getBoundingClientRect();
      const winRect    = win.getBoundingClientRect();

      // mouse position relative to window’s top-left
      offsetX = e.clientX - winRect.left;
      offsetY = e.clientY - winRect.top;

      function onMove(ev) {
        if (!dragging || !currentWin) return;

        const xInScreen = ev.clientX - screenRect.left - offsetX;
        const yInScreen = ev.clientY - screenRect.top  - offsetY;

        let x = xInScreen;
        let y = yInScreen;

        const sw = screen.clientWidth;
        const sh = screen.clientHeight;
        const ww = currentWin.offsetWidth;
        const wh = currentWin.offsetHeight;

        // clamp so window stays inside blue screen
        if (ww <= sw) {
          if (x < 0) x = 0;
          if (x > sw - ww) x = sw - ww;
        }
        if (wh <= sh) {
          if (y < 0) y = 0;
          if (y > sh - wh) y = sh - wh;
        }

        currentWin.style.left   = x + 'px';
        currentWin.style.top    = y + 'px';
        currentWin.style.right  = 'auto';
        currentWin.style.bottom = 'auto';
      }

      function onUp() {
        dragging = false;
        currentWin = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);

      e.preventDefault();
    });
  });

  // ---- 5) On load: center any visible windows once ----
  document.querySelectorAll('.win').forEach(win => {
    if (!win.classList.contains('hidden')) {
      centerWindow(win);
      clampIntoScreen(win);
    }
  });
});
