const input=document.getElementById('qsearch');
const questions=Array.from(document.querySelectorAll('details.qa'));
const expand=document.getElementById('expand');
const empty=document.getElementById('nothing');
function updateEmpty(){if(empty)empty.classList.toggle('hidden',questions.some(q=>!q.classList.contains('hidden')));}
input?.addEventListener('input',()=>{const term=input.value.toLocaleLowerCase('tl').trim();questions.forEach(q=>q.classList.toggle('hidden',!q.textContent.toLocaleLowerCase('tl').includes(term)));updateEmpty();});
expand?.addEventListener('click',()=>{const displayed=questions.filter(q=>!q.classList.contains('hidden'));const shouldOpen=displayed.some(q=>!q.open);displayed.forEach(q=>q.open=shouldOpen);expand.textContent=shouldOpen?'Isara lahat ng sagot':'Buksan lahat ng sagot';});

/* Load shared clickable Scripture references and verse popups. */
(()=>{const script=document.createElement('script');script.src='/creation/assets/scripture-links.js?v=2';document.body.append(script);})();

(()=>{const script=document.createElement('script');script.src='/scripture-auto.js?v=1';document.body.append(script);})();
