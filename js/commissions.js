// js/commissions.js
(function(){
  const root = document.getElementById('win-commissions');
  if(!root) return;

  const els = {
    list: root.querySelector('#c-list'),
    count: root.querySelector('#c-count'),
    fOpen: root.querySelector('#c-f-open'),
    fAcc:  root.querySelector('#c-f-acc'),
    fDone: root.querySelector('#c-f-done'),
    search:root.querySelector('#c-search'),
    newBtn:root.querySelector('#c-new')
  };

  ['change','input'].forEach(ev=>{
    els.fOpen.addEventListener(ev, render);
    els.fAcc.addEventListener(ev, render);
    els.fDone.addEventListener(ev, render);
    els.search.addEventListener(ev, render);
  });

  els.newBtn.addEventListener('click', ()=>{
    const id = 'C-' + Math.floor(100+Math.random()*900);
    GDS.state.commissions.unshift({
      id, title:'Poster design', client:'Local Arts Fair',
      fee: 120+Math.floor(Math.random()*200),
      due: GDS.daysFromNow(2+Math.floor(Math.random()*7)),
      status:'open'
    });
    // add an email
    GDS.state.inbox.unshift(GDS.email(`New brief: ${id}`, 'Brief Bot', `A new commission ${id} has arrived. Open Commissions to accept.`));
    GDS.save();
    render();
    GDS.notify(`New commission ${id}`);
  });

  function row(c){
    const div = document.createElement('div');
    div.className = 'item';
    div.style.padding = '10px';
    div.style.border = '1px solid #21335c';
    div.style.borderRadius = '12px';
    div.style.background = '#0b102044';

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
        <div>
          <div style="display:flex; gap:8px; align-items:center;">
            <strong>${c.title}</strong>
            <span class="tag">${c.id}</span>
          </div>
          <div class="muted">Client: <strong>${c.client}</strong></div>
          <div class="muted">Due: <strong>${c.due}</strong></div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="tag">${c.status}</span>
            <span class="${c.status==='done'?'money-pos':'tag'}">${GDS.fmtMoney(c.fee)}</span>
          </div>
          <div style="display:flex; gap:8px;">
            ${c.status==='open'     ? `<button data-act="accept">Accept</button>` : ''}
            ${c.status==='accepted' ? `<button data-act="submit">Mark Done</button>` : ''}
            ${c.status!=='done'     ? `<button data-act="decline">Decline</button>` : ''}
            ${c.status==='done'     ? `<button data-act="reopen">Reopen</button>` : ''}
          </div>
        </div>
      </div>
    `;

    div.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      const act = btn.dataset.act;
      if(act==='accept'){
        c.status='accepted'; GDS.save(); render(); GDS.notify(`Accepted ${c.id}`);
      }
      if(act==='submit'){
        c.status='done';
        GDS.state.cash += c.fee;
        GDS.state.history.unshift({type:'income', label:`Commission ${c.id}: ${c.title}`, amount:c.fee, ts:Date.now()});
        GDS.save(); render(); GDS.notify(`Completed ${c.id} +${GDS.fmtMoney(c.fee)}`);
        // If cash window is open, ask it to refresh
        window.dispatchEvent(new CustomEvent('cash:refresh'));
      }
      if(act==='decline'){
        GDS.state.commissions = GDS.state.commissions.filter(x=>x!==c);
        GDS.save(); render(); GDS.notify(`Declined ${c.id}`);
      }
      if(act==='reopen'){
        c.status='accepted'; GDS.save(); render();
      }
    });

    return div;
  }

  function render(){
    const q = (els.search.value||'').toLowerCase();
    const visible = GDS.state.commissions.filter(c=>{
      if(q && !(c.title.toLowerCase().includes(q)||c.client.toLowerCase().includes(q)||c.id.toLowerCase().includes(q))) return false;
      if(c.status==='open'     && !els.fOpen.checked) return false;
      if(c.status==='accepted' && !els.fAcc.checked)  return false;
      if(c.status==='done'     && !els.fDone.checked) return false;
      return true;
    });

    els.count.textContent = `${visible.length} shown / ${GDS.state.commissions.length} total`;
    els.list.innerHTML = '';
    if(!visible.length){
      els.list.innerHTML = `<div class="muted">No commissions match.</div>`;
      return;
    }
    visible.forEach(c=> els.list.appendChild(row(c)));
  }

  render();
})();
