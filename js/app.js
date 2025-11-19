// Window manager for desktop windows inside #screen

const wins = Array.from(document.querySelectorAll('.win'));
const screenEl = document.getElementById('screen');
let z = 10;

function bringToFront(win){
  z += 1;
  win.style.zIndex = z;
  wins.forEach(w => w.classList.remove('active'));
  win.classList.add('active');
}

function clampToScreen(win, left, top){
  const screen = screenEl.getBoundingClientRect();
  const r = win.getBoundingClientRect();
  // keep window edges inside screen with 8px padding
  left = Math.max(screen.left + 8, Math.min(screen.right - r.width - 8, left));
  top  = Math.max(screen.top  + 8, Math.min(screen.bottom - 8, top));
  win.style.left = (left - screen.left) + 'px';
  win.style.top  = (top  - screen.top)  + 'px';
}

document.querySelectorAll('.icon').forEach(icon=>{
  icon.addEventListener('click', ()=>{
    const sel = icon.getAttribute('data-open');
    const win = document.querySelector(sel);
    if(!win) return;
    win.classList.remove('hidden');

    // random-ish first open position
    if(!win.dataset.pos){
      win.style.left = (260 + Math.floor(Math.random()*60)) + 'px';
      win.style.top  = (140 + Math.floor(Math.random()*60)) + 'px';
      win.dataset.pos = '1';
    }
    bringToFront(win);
  });
});

wins.forEach(win=>{
  const tb = win.querySelector('.titlebar');
  let sx=0, sy=0, sl=0, st=0, dragging=false;

  tb.addEventListener('mousedown', (e)=>{
    dragging = true; bringToFront(win);
    sx = e.clientX; sy = e.clientY;
    const rect = win.getBoundingClientRect();
    sl = rect.left; st = rect.top;
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    clampToScreen(win, sl + dx, st + dy);
  });

  window.addEventListener('mouseup', ()=>{
    dragging=false;
    document.body.style.userSelect = '';
  });

  tb.querySelector('[data-close]')?.addEventListener('click', ()=>{
    win.classList.add('hidden');
  });

  tb.querySelector('[data-min]')?.addEventListener('click', ()=>{
    win.style.transform = 'scale(0.96)';
    win.style.opacity = '0.0';
    setTimeout(()=>{
      win.classList.add('hidden');
      win.style.transform = '';
      win.style.opacity = '';
    }, 120);
  });

  tb.querySelector('[data-max]')?.addEventListener('click', ()=>{
    const screen = screenEl.getBoundingClientRect();
    bringToFront(win);
    win.style.left = '12px';
    win.style.top  = '12px';
    win.style.width = (screen.width - 24) + 'px';
    win.style.minHeight = (screen.height - 24) + 'px';
  });

  win.addEventListener('mousedown', ()=> bringToFront(win));
});

// ===== Expose helpers globally so other scripts can open/stack windows =====
window.wmBringToFront = bringToFront;
window.wmOpen = (selector) => {
  const win = document.querySelector(selector);
  if (!win) return null;
  win.classList.remove('hidden');
  bringToFront(win);
  // ensure it's inside screen bounds on first open
  if (!win.dataset.pos){
    const screen = screenEl.getBoundingClientRect();
    const left = screen.left + 40;
    const top  = screen.top  + 60;
    win.style.left = (left - screen.left) + 'px';
    win.style.top  = (top  - screen.top)  + 'px';
    win.dataset.pos = '1';
  }
  return win;
};
