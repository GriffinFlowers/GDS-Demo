// design.js — hardened init for the Design app

(function(){
  let inited = false;
  let rafId  = null;

  function $(id){ return document.getElementById(id); }

  function init(){
    if (inited) return; // bind once

    // --- REQUIRED ELEMENTS ---
    const canvas   = $('canvas');
    const color    = $('color');
    const size     = $('size');
    const penBtn   = $('pen');
    const eraserBtn= $('eraser');
    const bucketBtn= $('bucket');
    const pickerBtn= $('picker');
    const moveBtn  = $('move');
    const clearBtn = $('clear');
    const saveBtn  = $('savepng');

    // If any are missing, bail with a clear console error.
    const missing = [
      ['#canvas', canvas], ['#color', color], ['#size', size],
      ['#pen', penBtn], ['#eraser', eraserBtn], ['#bucket', bucketBtn],
      ['#picker', pickerBtn], ['#move', moveBtn],
      ['#clear', clearBtn], ['#savepng', saveBtn],
    ].filter(([_,el]) => !el).map(([k])=>k);

    if (missing.length){
      console.error('[Design] Missing DOM nodes:', missing.join(', '));
      return;
    }

    // Ensure canvas can receive pointer events even if layout changed
    canvas.style.pointerEvents = 'auto';
    canvas.style.display = 'block';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '1';

    // 2D context
    const view  = canvas.getContext('2d', { alpha: true });
    view.imageSmoothingEnabled = true;

    // Offscreen paint layer (where pen/eraser/bucket operate)
    const paint = document.createElement('canvas');
    paint.width  = canvas.width;
    paint.height = canvas.height;
    const pctx = paint.getContext('2d');
    pctx.fillStyle = '#111722';
    pctx.fillRect(0, 0, paint.width, paint.height);

    // ===== STATE =====
    let tool        = 'pen'; // 'pen' | 'eraser' | 'bucket' | 'picker' | 'move'
    let drawing     = false;
    let last        = null;
    let stickers    = [];    // {img,x,y,w,h,scale,selected}
    let dragSticker = null;
    const dragOffset = {x:0,y:0};

    // Make the size slider scale the currently selected sticker (asset)
    size.addEventListener('input', () => {
      const sel = stickers.find(s => s.selected);
      if (!sel) return;

      const v = Number(size.value) || 1;
      // map slider (1–32) → 0.1–3-ish
      const newScale = Math.max(0.1, Math.min(8, v / 10));
      sel.scale = newScale;
    });

    // Expose to other scripts like assets browser
    window.addStickerFromURL = addStickerFromURL;

    // ===== UI BINDINGS =====
    function setTool(t){
      tool = t;
      [penBtn, eraserBtn, bucketBtn, pickerBtn, moveBtn].forEach(b=> b.classList.remove('active'));
      ({pen:penBtn, eraser:eraserBtn, bucket:bucketBtn, picker:pickerBtn, move:moveBtn}[t].classList.add('active'));
    }
    penBtn.onclick    = () => setTool('pen');
    eraserBtn.onclick = () => setTool('eraser');
    bucketBtn.onclick = () => setTool('bucket');
    pickerBtn.onclick = () => setTool('picker');
    moveBtn.onclick   = () => setTool('move');

    clearBtn.onclick = () => {
      pctx.fillStyle = '#111722';
      pctx.fillRect(0, 0, paint.width, paint.height);
      // Optional: also clear stickers
      // stickers = [];
    };

    saveBtn.onclick = savePNG;

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); savePNG(); }
      if (e.key === '1') setTool('pen');
      if (e.key === '2') setTool('eraser');
      if (e.key === '3') setTool('bucket');
      if (e.key === '4') setTool('picker');
      if (e.key.toLowerCase() === 'm') setTool('move');

      // scale / delete selected sticker via keyboard
      const sel = stickers.find(s => s.selected);
      if (sel) {
        if (e.key === '+' || e.key === '=') sel.scale = Math.min(8, sel.scale * 1.1);
        if (e.key === '-') sel.scale = Math.max(0.1, sel.scale / 1.1);
        if (e.key === 'Delete' || e.key === 'Backspace') {
          stickers = stickers.filter(s => s !== sel);
        }
      }
    });

    // ===== MOUSE =====
    canvas.addEventListener('mousedown', (e) => {
      const { x, y } = canvasXY(e);

      if (tool === 'move') {
        const hit = hitTestSticker(x, y);
        stickers.forEach(s => s.selected = false);
        if (hit) {
          hit.selected = true;
          dragSticker = hit;
          const {cx, cy} = stickerCenter(hit);
          dragOffset.x = x - cx;
          dragOffset.y = y - cy;
        } else {
          dragSticker = null;
        }
        return;
      }

      if (tool === 'bucket') { floodFill(x, y, hexToRgba(color.value)); return; }
      if (tool === 'picker') {
        renderOnce(); // ensure latest
        const c = view.getImageData(x, y, 1, 1).data;
        color.value = rgbaToHex(c[0], c[1], c[2]);
        return;
      }

      drawing = true;
      last = { x, y };
      drawDot(x, y);
    }, {passive:false});

    window.addEventListener('mouseup', () => { drawing = false; dragSticker = null; });
    canvas.addEventListener('mousemove', (e) => {
      const { x, y } = canvasXY(e);

      if (tool === 'move' && dragSticker) {
        dragSticker.x = x - dragOffset.x;
        dragSticker.y = y - dragOffset.y;
        return;
      }

      if (!drawing) return;
      drawLine(last.x, last.y, x, y);
      last = { x, y };
    });

    // ===== DRAG & DROP STICKERS =====
    canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const dropX = Math.floor((e.clientX - rect.left) * (canvas.width  / rect.width));
      const dropY = Math.floor((e.clientY - rect.top)  * (canvas.height / rect.height));

      for (const file of e.dataTransfer.files) {
        if (!file.type.startsWith('image/')) continue;
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxSide = 256;
            let w = img.naturalWidth, h = img.naturalHeight;
            const scale0 = Math.min(1, maxSide / Math.max(w, h));
            w = Math.round(w * scale0);
            h = Math.round(h * scale0);

            stickers.push({ img, x: dropX, y: dropY, w, h, scale: 1, selected: false });
            setTool('move');
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // ===== HELPERS =====
    function canvasXY(e){
      const rect = canvas.getBoundingClientRect();
      return {
        x: Math.floor((e.clientX - rect.left) * (canvas.width  / rect.width)),
        y: Math.floor((e.clientY - rect.top)  * (canvas.height / rect.height))
      };
    }
    function drawDot(x, y){
      pctx.fillStyle = (tool === 'eraser') ? '#111722' : color.value;
      pctx.beginPath();
      pctx.arc(x, y, Number(size.value), 0, Math.PI*2);
      pctx.fill();
    }
    function drawLine(x1, y1, x2, y2){
      pctx.strokeStyle = (tool === 'eraser') ? '#111722' : color.value;
      pctx.lineWidth = Number(size.value) * 2;
      pctx.lineCap = 'round';
      pctx.beginPath();
      pctx.moveTo(x1, y1);
      pctx.lineTo(x2, y2);
      pctx.stroke();
    }

    function floodFill(x, y, newCol){
      const img = pctx.getImageData(0, 0, paint.width, paint.height);
      const data = img.data, w = paint.width, h = paint.height;
      const idx = (x, y) => (y * w + x) * 4;
      const start = idx(x, y);
      const target = [data[start], data[start+1], data[start+2]]; // ignore alpha
      if (equalRGB(target, newCol)) return;

      const stack = [[x, y]];
      while (stack.length){
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
        let i = idx(cx, cy);
        if (equalRGB([data[i],data[i+1],data[i+2]], target)){
          data[i]   = newCol[0];
          data[i+1] = newCol[1];
          data[i+2] = newCol[2];
          data[i+3] = 255;
          stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        }
      }
      pctx.putImageData(img, 0, 0);
    }
    function equalRGB(a,b){ return a[0]===b[0] && a[1]===b[1] && a[2]===b[2]; }
    function hexToRgba(hex){
      hex = hex.replace('#','');
      if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
      return [
        parseInt(hex.substr(0,2),16),
        parseInt(hex.substr(2,2),16),
        parseInt(hex.substr(4,2),16),
        255
      ];
    }
    function rgbaToHex(r,g,b){
      return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    }

    function hitTestSticker(x, y){
      for (let i = stickers.length - 1; i >= 0; i--){
        const s = stickers[i];
        const {cx, cy, halfW, halfH} = stickerBounds(s);
        if (x >= cx - halfW && x <= cx + halfW && y >= cy - halfH && y <= cy + halfH){
          return s;
        }
      }
      return null;
    }
    function stickerBounds(s){
      const cw = s.w * s.scale;
      const ch = s.h * s.scale;
      const cx = s.x, cy = s.y;
      return {cx, cy, halfW: cw/2, halfH: ch/2, cw, ch};
    }
    function stickerCenter(s){ return {cx: s.x, cy: s.y}; }

    // ===== RENDER LOOP =====
    function render(){
      view.clearRect(0,0,canvas.width, canvas.height);
      view.drawImage(paint, 0, 0);
      for (const s of stickers){
        const {cx, cy, cw, ch} = stickerBounds(s);
        view.drawImage(s.img, cx - cw/2, cy - ch/2, cw, ch);
        if (s.selected){
          view.save();
          view.strokeStyle = '#7bdcff';
          view.setLineDash([6,4]);
          view.lineWidth = 2;
          view.strokeRect(cx - cw/2, cy - ch/2, cw, ch);
          view.restore();
        }
      }
      rafId = requestAnimationFrame(render);
    }
    function startRender(){
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    }
    function renderOnce(){
      view.clearRect(0,0,canvas.width, canvas.height);
      view.drawImage(paint, 0, 0);
      for (const s of stickers){
        const {cx, cy, cw, ch} = stickerBounds(s);
        view.drawImage(s.img, cx - cw/2, cy - ch/2, cw, ch);
      }
    }

    // ===== EXPORT =====
    function savePNG(){
      const a = document.createElement('a');
      a.download = 'design.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    }

    // ===== External add via URL =====
    function addStickerFromURL(url){
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxSide = 256;
        let w = img.naturalWidth, h = img.naturalHeight;
        const scale0 = Math.min(1, maxSide / Math.max(w, h));
        w = Math.round(w * scale0);
        h = Math.round(h * scale0);

        stickers.push({
          img,
          x: canvas.width/2,
          y: canvas.height/2,
          w, h,
          scale: 1,
          selected: false
        });
        setTool('move');
      };
      img.src = url;
    }

    // Start!
    setTool('pen');
    startRender();
    inited = true;
    console.log('[Design] initialized');
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }

  // Ensure when the Design window is opened the canvas is active
  window.addEventListener('click', (e)=>{
    const btn = e.target.closest?.('.icon[data-open="#win-design"]');
    if (btn){
      setTimeout(()=>{
        const c = document.getElementById('canvas');
        if (c){
          c.style.pointerEvents = 'auto';
          c.style.zIndex = '1';
        }
      }, 0);
    }
  });
})();
