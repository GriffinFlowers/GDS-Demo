// js/cash.js
(function(){
  const root = document.getElementById('win-cash');
  if(!root) return;

  const els = {
    bal: root.querySelector('#cash-balance'),
    hist: root.querySelector('#cash-history'),
    addIncome: root.querySelector('#cash-add-income'),
    expLabel: root.querySelector('#cash-exp-label'),
    expAmt: root.querySelector('#cash-exp-amt'),
    addExp: root.querySelector('#cash-add-exp'),
    reset: root.querySelector('#cash-reset')
  };

  root.querySelectorAll('[data-qexp]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const [label, amt] = btn.dataset.qexp.split(':');
      const n = Number(amt);
      GDS.state.cash -= n;
      GDS.state.history.unshift({type:'expense', label, amount:n, ts:Date.now()});
      GDS.save(); render();
    });
  });

  els.addIncome.addEventListener('click', ()=>{
    const amt = 50 + Math.floor(Math.random()*150);
    GDS.state.cash += amt;
    GDS.state.history.unshift({type:'income', label:'Test Income', amount:amt, ts:Date.now()});
    GDS.save(); render();
  });

  els.addExp.addEventListener('click', ()=>{
    const label = (els.expLabel.value||'Expense').trim();
    const amt = parseFloat(els.expAmt.value||'0');
    if(!amt || amt<=0) { alert('Enter a positive amount'); return; }
    GDS.state.cash -= amt;
    GDS.state.history.unshift({type:'expense', label, amount:amt, ts:Date.now()});
    GDS.save(); render();
    els.expAmt.value='';
  });

  els.reset.addEventListener('click', ()=>{
    if(confirm('Reset your save?')){
      // simple reset: wipe localStorage to defaults
      localStorage.removeItem('gds_state_v1');
      GDS.state = (function(){ const d={}; return Object.assign(d, (window.GDS && GDS) ? GDS : {}, {state: undefined}); })(); // noop
      // reload state via state.js loader
      window.location.reload();
    }
  });

  function render(){
    els.bal.textContent = GDS.fmtMoney(GDS.state.cash);
    els.hist.innerHTML = '';
    if(!GDS.state.history.length){
      els.hist.innerHTML = `<div class="muted">No transactions yet.</div>`;
      return;
    }
    GDS.state.history.slice(0,50).forEach(h=>{
      const div = document.createElement('div');
      div.className='item';
      div.style.padding='10px';
      div.style.border='1px solid #21335c';
      div.style.borderRadius='12px';
      div.style.background='#0b102044';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div><strong>${h.label}</strong></div>
            <div class="muted">${new Date(h.ts).toLocaleString()}</div>
          </div>
          <div style="font-family:ui-monospace, Menlo, monospace; font-weight:800; ${h.type==='income'?'color:#34d399;':'color:#f87171;'}">
            ${h.type==='income' ? '+' : '-'}${GDS.fmtMoney(h.amount)}
          </div>
        </div>`;
      els.hist.appendChild(div);
    });
  }

  // allow other apps to ping a refresh when balance changes
  window.addEventListener('cash:refresh', render);

  render();
})();
