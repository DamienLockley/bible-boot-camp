const inp=document.getElementById('qsearch');const qs=[...document.querySelectorAll('.qa')];const all=document.getElementById('expand');inp?.addEventListener('input',()=>{let n=0;qs.forEach(q=>{let hit=q.textContent.toLowerCase().includes(inp.value.toLowerCase());q.classList.toggle('hidden',!hit);if(hit)n++;});document.getElementById('nothing')?.classList.toggle('hidden',!!n);});all?.addEventListener('click',()=>{let open=all.textContent.startsWith('Open');qs.filter(q=>!q.classList.contains('hidden')).forEach(q=>q.open=open);all.textContent=open?'Close all answers':'Open all answers';});
/* Load shared clickable Scripture references and verse popups. */
(()=>{const script=document.createElement('script');script.src='/creation/assets/scripture-word-reader.js?v=1';document.body.append(script);})();

(()=>{const script=document.createElement('script');script.src='/creation/assets/scripture-auto.js?v=3';document.body.append(script);})();
