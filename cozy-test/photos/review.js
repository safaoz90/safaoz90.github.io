// Script of the photo review page (copied next to content/review.html by tools/review-page.js).
const K='cj_review';let st={};try{st=JSON.parse(localStorage.getItem(K))||{}}catch(e){}
const figs=[...document.querySelectorAll('figure')];
figs.forEach(f=>{if(f.dataset.dec&&!st[f.dataset.id])st[f.dataset.id]=f.dataset.dec});
const hide=document.querySelector('.hide');document.body.classList.toggle('only',hide.checked);hide.onchange=()=>document.body.classList.toggle('only',hide.checked);
const paint=()=>{figs.forEach(f=>{f.className=st[f.dataset.id]||''});const v=Object.values(st);document.querySelector('.count').textContent=`${v.filter(x=>x==='keep').length} kept · ${v.filter(x=>x==='love').length} loved · ${v.filter(x=>x==='drop').length} dropped · ${figs.length-v.length} not tagged`;};
document.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b)return;const id=b.closest('figure').dataset.id;st[id]=st[id]===b.dataset.v?undefined:b.dataset.v;if(!st[id])delete st[id];try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}paint();});
document.querySelector('.copy').onclick=async()=>{const pick=v=>figs.filter(f=>st[f.dataset.id]===v).map(f=>f.dataset.id).join(',');const t=`LOVE: ${pick('love')}\nDROP: ${pick('drop')}\nKEEP: ${pick('keep')}`;const o=document.querySelector('.out');o.hidden=false;o.value=t;try{await navigator.clipboard.writeText(t);document.querySelector('.copy').textContent='Copied!'}catch(e){o.select()}};
paint();
