// js/state.js
(function(){
  const STORE = 'gds_state_v1';

  const DEFAULT = {
    cash: 250,
    history: [ {type:'income', label:'Starting Bonus', amount:250, ts:Date.now()} ],
    commissions: [
      {id:'C-101', title:'Logo refresh', client:'Sunview Cafe',     fee:180, due:daysFromNow(3), status:'open'},
      {id:'C-102', title:'Flyer set (A5 x2)', client:'BSA Local',   fee:220, due:daysFromNow(5), status:'open'},
      {id:'C-103', title:'Social pack (6 posts)', client:'Gröttnäs Lodge', fee:300, due:daysFromNow(7), status:'open'}
    ],
    inbox: [
      email('Welcome', 'GDS System', 'Welcome to your studio! Check Commissions to accept work and earn 💵.'),
      email('New brief: Logo refresh (C-101)', 'Sunview Cafe', 'We need a fresh logo by Friday. Accept in Commissions to proceed.'),
      email('Invoice reminder', 'Landlord Bot', 'Rent is due in 3 days. Track funds in Cash Tracker.')
    ]
  };

  function email(subject, from, body){
    return { id:rid(), subject, from, body, ts:Date.now(), read:false };
  }
  function rid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function daysFromNow(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

  function load(){
    try{
      const raw = localStorage.getItem(STORE);
      return raw ? JSON.parse(raw) : structuredClone(DEFAULT);
    }catch(e){ return structuredClone(DEFAULT); }
  }
  function save(){ localStorage.setItem(STORE, JSON.stringify(GDS.state)); }

  function fmtMoney(n){ return (n<0?'-':'') + '$' + Math.abs(n).toFixed(2); }
  function timeAgo(ts){
    const s=Math.floor((Date.now()-ts)/1000);
    if(s<60) return s+'s'; const m=Math.floor(s/60);
    if(m<60) return m+'m'; const h=Math.floor(m/60);
    if(h<24) return h+'h'; const d=Math.floor(h/24);
    return d+'d';
  }

  function notify(text){
    const host = document.getElementById('screen') || document.body;
    const n = document.createElement('div');
    n.textContent = text;
    Object.assign(n.style, {
      position:'absolute', right:'20px', bottom:'20px',
      padding:'10px 14px', borderRadius:'12px',
      background:'#111b32', border:'1px solid #1e2b4d',
      boxShadow:'0 10px 30px rgba(0,0,0,.45)', opacity:'0',
      transition:'opacity .15s ease, transform .2s ease', transform:'translateY(0)'
    });
    host.appendChild(n);
    requestAnimationFrame(()=>{ n.style.opacity='1'; n.style.transform='translateY(-6px)'; });
    setTimeout(()=>{ n.style.opacity='0'; n.style.transform='translateY(0)'; n.addEventListener('transitionend', ()=> n.remove(), {once:true}); }, 1800);
  }

  window.GDS = {
    state: load(),
    save,
    fmtMoney,
    timeAgo,
    daysFromNow,
    notify,
    rid,
    email
  };
})();
