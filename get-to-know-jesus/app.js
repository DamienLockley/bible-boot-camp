(()=>{
'use strict';

const STORAGE='discover-truth-v3';
const CONNECT_ENDPOINT=(window.SITE_CONFIG && window.SITE_CONFIG.contactWebAppUrl)||''; // Public Apps Script endpoint, never an email address.
const main=document.getElementById('main');
const modal=document.getElementById('connectModal');
const connectForm=document.getElementById('connectForm');
const connectStatus=document.getElementById('connectStatus');

const saved=(()=>{try{return JSON.parse(localStorage.getItem(STORAGE))||{}}catch{return {}}})();
const user={
  completed:Array.isArray(saved.completed)?saved.completed:[],
  notes:(saved.notes&&typeof saved.notes==='object')?saved.notes:{},
  read:(saved.read&&typeof saved.read==='object')?saved.read:{},
  theme:saved.theme||'light',
  font:Number(saved.font)||0
};
const state={search:''};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ORDER=STUDIES; // The original document’s heading order is the course order.
const STUDY_ART={
 word:'word', controversy:'controversy', spirit:'spirit', sanctuary:'sanctuary',
 salvation:'salvation',law:'law',antichrist:'antichrist','seventy-weeks':'seventy-weeks',
 history:'history',judgement:'judgement','1844':'1844',america:'america','blue-stone':'blue-stone',
 sabbath:'sabbath','second-coming':'second-coming',nature:'nature',mark:'mark',
 millennium:'millennium',hell:'hell','prophecy-gift':'prophecy-gift',remnant:'remnant',
 living:'living',prayer:'prayer',health:'health',baptism:'baptism',godhead:'godhead',
 stewardship:'stewardship',witnessing:'witnessing'
};

function completed(id){return user.completed.includes(id)}
function checkedCount(id){return new Set(user.read[id]||[]).size}
function allRead(id){return checkedCount(id)>=(DEPTH[id]?.steps?.length||0)}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(user));window.BIBLE_ACCOUNT?.save?.()}catch{toast('Storage is unavailable in this browser.')}}
let toastTimer;
function toast(msg){const e=document.getElementById('toast');e.textContent=msg;e.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('visible'),3000)}

function firstIncompleteIndex(){
  for(let i=0;i<ORDER.length;i++) if(!completed(ORDER[i].id)) return i;
  return ORDER.length;
}
function unlockedIndex(){return Math.min(firstIncompleteIndex(), ORDER.length-1)}
function isUnlocked(id){
  const ix=ORDER.findIndex(s=>s.id===id);
  if(ix===-1) return false;
  if(completed(id)) return true;
  return ix<=unlockedIndex();
}
function nextStudy(){
  const ix=firstIncompleteIndex();
  if(ix>=ORDER.length) return null;
  return ORDER[ix];
}
function completionPercent(){return Math.round((user.completed.length/ORDER.length)*100)}

function applyTheme(){
  document.documentElement.dataset.theme=user.theme;
  document.documentElement.style.setProperty('--reading',(1.05+user.font*.085)+'rem');
  document.getElementById('themeButton').textContent=user.theme==='light'?'☾':'☼';
}

function nav(section){
  location.hash=section==='home'?'':section==='progress'?'#journey':'#about';
  route();
  window.scrollTo({top:0,behavior:'instant'});
}

function goStudy(id){
  if(!isUnlocked(id)){
    const current=nextStudy();
    toast(current?`Complete “${current.title}” first to unlock the next study.`:'This study is still locked.');
    return;
  }
  location.hash='#study='+encodeURIComponent(id);
  route();
  window.scrollTo({top:0,behavior:'instant'});
}

function progressBanner(){
  const n=user.completed.length;
  return `<div class="progress-banner"><div class="progress-circle" style="--pct:${completionPercent()}%"><span>${completionPercent()}%</span></div><div class="progress-caption"><strong>${n} of ${ORDER.length} studies completed</strong><p>${n===0?'Begin with Study 1 and move through the lessons one step at a time.':n===ORDER.length?'You have completed the full set of studies.':`Your next study is <b>${esc(nextStudy()?.title||'complete')}</b>.`}</p></div><button class="btn btn-outline" data-action="journey">My journey</button></div>`
}

function card(s,index){
  const locked=!isUnlocked(s.id);
  const isNext=nextStudy()?.id===s.id;
  return `<article class="course-card ${locked?'is-locked':''}"><div class="card-inside"><div class="card-top"><span class="eyebrow">STUDY ${String(index+1).padStart(2,'0')} · ${esc(s.tag)}</span>${completed(s.id)?'<span class="done-mark">✓ Complete</span>':locked?'<span class="lock-mark">🔒 Locked</span>':isNext?'<span class="next-mark">Next</span>':''}</div><div class="card-title">${esc(s.title)}</div><p class="card-lead">${esc(s.lead)}</p></div><div class="card-footer"><span>${locked?'COMPLETE PREVIOUS STUDY':'30–45 MIN GUIDED STUDY'}</span><button type="button" ${locked?'disabled':''} data-study="${esc(s.id)}" aria-label="${locked?'Locked: ':'Open '}${esc(s.title)}">${locked?'Locked':'Open study →'}</button></div></article>`;
}

function renderCards(){
  const q=state.search.trim().toLowerCase();
  const results=ORDER.filter(s=>!q||[s.title,s.lead,s.intro,s.tag,...s.verses].join(' ').toLowerCase().includes(q));
  const el=document.getElementById('courseGrid');
  if(!el) return;
  el.innerHTML=results.length?results.map((s,i)=>card(s,ORDER.indexOf(s))).join(''):`<div class="empty" style="grid-column:1/-1"><h3>No matching studies</h3><p class="muted">Try a simpler search.</p><button class="btn btn-outline" data-action="clear-search">Clear search</button></div>`;
}

function renderHome(){
  const next=nextStudy()||ORDER[0];
  main.innerHTML=`<section class="hero"><div class="hero-copy"><span class="kicker">BIBLE STUDIES TO DISCOVER TRUTH</span><h1>Discover God.<br>Discover truth.</h1><p>Clear Bible studies for people who want to understand Scripture step by step. Each lesson unlocks after the one before it is completed.</p><button class="btn btn-primary" data-study="${esc(next.id)}">${user.completed.length?'Continue with '+esc(next.title):'Begin with '+esc(next.title)} <span aria-hidden="true">→</span></button><div class="hero-stats"><span>✦ ${ORDER.length} studies</span><i class="dot"></i><span>Bible based</span><i class="dot"></i><span>One lesson at a time</span></div></div><div class="hero-art"><div class="verse">“You shall know the truth, and the truth shall make you free.”<span>JOHN 8:32</span></div></div></section>
    ${progressBanner()}
    <section class="feature-row" aria-label="How these studies work"><div class="feature"><div class="glyph">📖</div><div><strong>Simple Bible teaching</strong><p>Each study explains the topic in plain language without assuming prior knowledge.</p></div></div><div class="feature"><div class="glyph">💬</div><div><strong>Real-life questions</strong><p>Each lesson answers honest questions people commonly ask when discovering faith.</p></div></div><div class="feature"><div class="glyph">🔓</div><div><strong>Guided pathway</strong><p>Studies stay in order so each lesson builds naturally on the one before it.</p></div></div></section>
    <div id="library" class="section-head"><div><span class="kicker">YOUR STUDY PATHWAY</span><h2>Study in order</h2><p>Search the library below. Locked studies will open as you complete each lesson in sequence.</p></div><button class="btn btn-outline" data-action="connect">Connect / Get Help</button></div>
    <div class="library-control"><div class="search-wrap"><span class="search-icon" aria-hidden="true">⌕</span><input type="search" id="searchInput" placeholder="Search a topic or question..." aria-label="Search Bible study topics" value="${esc(state.search)}" /></div></div>
    <div class="course-grid" id="courseGrid"></div>`;
  renderCards();
  document.getElementById('searchInput').addEventListener('input',e=>{state.search=e.target.value;renderCards()});
}

function bibleRef(text){return String(text||'').replace(/(?:[1-3]\s*)?[A-Za-z][A-Za-z. ]*?\s+\d{1,3}:\s*\d+(?:\s*[-–]\s*\d+)?/g, raw=>`<button type="button" class="verse-link" data-bible-ref="${esc(raw.trim())}" title="Read Bible passage">${esc(raw)}</button>`)}
function addedPics(id,section,index){
  const pics=(STUDY_INLINE_IMAGES[id]||[]).filter(p=>p.section===section&&p.index===index);
  if(!pics.length)return '';
  const blocks=[];
  let gallery=[];let galleryTitle='';
  function flush(){if(gallery.length){blocks.push(`<div class="study-gallery"><h4>${esc(galleryTitle)}</h4><div class="study-gallery-grid">${gallery.join('')}</div></div>`);gallery=[];galleryTitle='';}}
  for(const p of pics){
    const figure=`<figure class="inserted-illustration"><button type="button" class="image-zoom-button" data-image-zoom="${esc(p.src)}" data-image-alt="${esc(p.caption||'Bible study illustration')}" aria-label="Enlarge ${esc(p.caption||'illustration')}"><img src="${esc(p.src)}" loading="lazy" alt="${esc(p.caption||'Bible study illustration')}"/><span class="image-zoom-hint">⤢ Enlarge</span></button>${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`;
    if(p.gallery){if(gallery.length&&galleryTitle!==p.gallery)flush();galleryTitle=p.gallery;gallery.push(figure);}
    else{flush();blocks.push(figure);}
  }
  flush();return blocks.join('');
}

function media(s){
  const image=BIBLEWORLD_IMAGES[STUDY_ART[s.id]||s.art];
  if(!image) return '';
  return `<div class="media-box"><img src="${esc(image.src)}" loading="lazy" alt="${esc(image.alt||image.credit||s.title)}" onerror="this.closest('.media-box').style.display='none'"></div>`;
}

function renderStudy(s){
  const ix=ORDER.findIndex(x=>x.id===s.id);
  const next=ORDER[ix+1];
  const previous=ORDER[ix-1];
  const nextLocked=next && !isUnlocked(next.id);
  main.innerHTML=`<header class="detail-head"><button class="back-button" data-action="home">← Back to studies</button><div><span class="kicker">BIBLE STUDY ${String(ix+1).padStart(2,'0')} · ${esc(s.tag)}</span> ${completed(s.id)?'<span class="pill">✓ Completed</span>':''}</div><h1>${esc(s.title)}</h1><p class="lead">${esc(s.lead)}</p></header>
  <div class="detail-grid"><div class="detail-main">
  <section class="panel intro-panel"><span class="kicker">THE BIG PICTURE · APPROX. 30–45 MINUTES</span><p>${esc(s.intro)}</p></section>${media(s)}${addedPics(s.id,'intro',0)}
  <section class="panel"><div class="panel-header"><span class="small-round">01</span><h2>Understand the message</h2></div>${s.ideas.map(p=>`<article class="idea"><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p><div class="scripture">Read: ${bibleRef(p[2])}</div>${addedPics(s.id,'idea',s.ideas.indexOf(p))}</article>`).join('')}</section>

  <section class="panel connection-panel"><div class="panel-header"><span class="small-round">✦</span><h2>Understand the important connections</h2></div><p class="reading-guidance">These additional explanations develop the foundations behind the teaching. Read the passages for each connection and consider how they build on the lessons already studied.</p>
    ${(CONNECTIONS[s.id]||[]).map((c,i)=>`<article class="connection-item"><div class="connection-top"><span class="step-number">${String(i+1).padStart(2,'0')}</span><h3>${esc(c[0])}</h3></div><div class="scripture">Read together: ${bibleRef(c[1])}</div><p>${esc(c[2])}</p>${addedPics(s.id,'connection',i)}</article>`).join('')}
  </section>
  <section class="panel depth-panel">
    <div class="panel-header"><span class="small-round">02</span><h2>Explore the Bible step by step</h2></div>
    <p class="reading-guidance">Allow about 3–5 minutes for each Bible reading. Read the passage in context, work through the explanation, then reveal the suggested answer. Tick each reading after you have considered it. The six readings and reflection make this a guided 30–45 minute study.</p>
    <div class="principle-box"><span class="kicker">THE PRINCIPLE TO UNDERSTAND</span><p>${esc(DEPTH[s.id]?.principle||s.intro)}</p>${addedPics(s.id,'principle',0)}</div>
    ${((DEPTH[s.id]&&DEPTH[s.id].steps)||[]).map((st,i)=>`<article class="bible-stop" id="stop-${i}"><div class="stop-head"><span class="step-number">${String(i+1).padStart(2,'0')}</span><div><div class="stop-ref">READ · ${bibleRef(st[0])}</div><h3>${esc(st[1])}</h3></div></div><p>${esc(st[2])}</p>${addedPics(s.id,'step',i)}<div class="look-closer"><strong>Think it through</strong><p>${esc(st[3])}</p><details class="answer-reveal"><summary>See a suggested answer</summary><p>${esc(st[4])}</p></details></div><label class="read-toggle"><input type="checkbox" data-stepcheck="${i}" ${((user.read[s.id]||[]).includes(i))?'checked':''}><span>I’ve read and considered this passage</span></label></article>`).join('')}
    <div class="read-count" id="readCount">${checkedCount(s.id)} of ${(DEPTH[s.id]?.steps||[]).length} passages studied</div>
  </section>
  <section class="panel"><div class="panel-header"><span class="small-round">03</span><h2>Real-life questions</h2></div><p class="muted">Tap a question to explore a suggested answer.</p>${s.qa.map(({0:q,1:a})=>`<details class="qitem"><summary>${esc(q)}</summary><div class="answer"><strong>A Bible-based response:</strong> ${esc(a)}</div>${addedPics(s.id,'qa',s.qa.findIndex(z=>z[0]===q))}</details>`).join('')}</section>
  <section class="panel"><div class="panel-header"><span class="small-round">04</span><h2>Make it personal</h2></div><div class="prompt">${esc(s.act)}</div><div class="prompt" style="margin-top:12px"><strong>Extended personal exercise:</strong> ${esc(DEPTH[s.id]?.practice||s.act)}</div>${addedPics(s.id,'end',0)}<div class="journal-title" style="margin-top:21px"><strong>My private reflection</strong><span>Saved in your account when signed in, otherwise on this device</span></div><textarea id="studyNotes" placeholder="What stood out? What questions do you still have?" aria-label="Private reflection notes"></textarea><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="study-notice" id="notesStatus">Saved in this browser</span><button class="mini-link" type="button" data-action="save-notes">Save notes</button></div></section>
  <div class="foot-actions"><button class="btn btn-dark" id="completeStudyBtn" data-action="complete" data-id="${esc(s.id)}" ${completed(s.id)||!allRead(s.id)?'disabled':''}>${completed(s.id)?'✓ Study completed':allRead(s.id)?'✓ Finish study & unlock next':'Review all passages to finish'}</button><button class="btn btn-outline" data-action="share" data-id="${esc(s.id)}">Share this study ↗</button></div>
  <div class="study-notice" id="finishHint">${completed(s.id)?'You can revisit this study at any time.':allRead(s.id)?'You have worked through the readings. Take time for reflection, then finish the study.':'Complete all six reading checkpoints to unlock the next study.'}</div>
  <div class="foot-actions">${previous?`<button class="btn btn-outline" data-study="${esc(previous.id)}">← Previous</button>`:'<span></span>'}${next?`<button class="btn btn-outline" ${nextLocked?'disabled':''} data-study="${esc(next.id)}">${nextLocked?'Complete this study to unlock next':'Next study →'}</button>`:`<button class="btn btn-outline" data-action="journey">View journey →</button>`}</div>
  <p class="study-notice">These studies are written to help people discover Bible truth clearly and simply. Check every teaching by Scripture in context.</p>
  </div><aside class="detail-side" aria-label="Study support"><div class="side-card"><h3>Your pathway</h3><p>${completed(s.id)?'This study is complete. You can review it any time.':`You are currently on Study ${String(ix+1).padStart(2,'0')} of ${ORDER.length}.`}</p><p>${nextLocked?'Complete this study to unlock the next lesson.':next?`Next lesson: <b>${esc(next.title)}</b>.`:'You are on the final lesson.'}</p><button class="btn btn-outline" data-action="connect">Connect / Get Help</button></div></aside></div>`;
  const field=document.getElementById('studyNotes');
  field.value=user.notes[s.id]||'';
  let savedTimer;
  field.addEventListener('input',()=>{user.notes[s.id]=field.value;save();document.getElementById('notesStatus').textContent='Saved locally ✓';clearTimeout(savedTimer);savedTimer=setTimeout(()=>document.getElementById('notesStatus')&&(document.getElementById('notesStatus').textContent='Saved in this browser'),2000)});
}

function renderJourney(){
  const current=nextStudy();
  main.innerHTML=`<header class="article-hero"><span class="kicker">YOUR PERSONAL STUDY JOURNEY</span><h1>One step at a time.</h1><p>Your progress and notes are saved in your online account when signed in, otherwise in this browser.</p></header>${progressBanner()}<section class="reading-card"><h3>Continue where you left off</h3><p>${current?`Your next study is <b>${esc(current.title)}</b>.`:'All studies are complete. You can review any topic at any time.'}</p>${current?`<button class="btn btn-dark" data-study="${esc(current.id)}">Continue with ${esc(current.title)} →</button>`:''}</section><div class="section-head"><div><h2>All studies</h2><p>${user.completed.length} completed · ${ORDER.length-user.completed.length} still ahead</p></div><button class="btn btn-outline" data-action="connect">Connect / Get Help</button></div><div class="my-list">${ORDER.map((s,index)=>{const locked=!isUnlocked(s.id);const label=completed(s.id)?'✓ Completed':locked?'🔒 Locked':'▶ Current';return `<div class="my-item ${locked?'is-locked-row':''}"><div><strong>${label} · Study ${String(index+1).padStart(2,'0')} — ${esc(s.title)}</strong><small>${user.notes[s.id]?'Personal reflection saved':'No reflection recorded'}</small></div><button ${locked?'disabled':''} data-study="${esc(s.id)}">${locked?'Locked':'Open study →'}</button></div>`}).join('')}</div><section class="reading-card"><h3>Keep a copy of your reflections</h3><p>Export your notes and progress as a JSON file to save privately. You can import that file later, including on another device.</p><div class="foot-actions" style="justify-content:start"><button class="btn btn-outline" data-action="export">Export my progress</button><button class="btn btn-outline" data-action="import">Import saved progress</button><input id="importFile" type="file" accept="application/json,.json" hidden></div></section><div class="privacy"><b>Your privacy:</b> An account is optional. When signed in, progress and personal notes are saved in your private account; otherwise they remain in this browser. Clearing browser data may erase progress saved only locally.</div>`;
}

function renderAbout(){
  main.innerHTML=`<header class="article-hero"><span class="kicker">ABOUT THIS SITE</span><h1>Get to Know Jesus</h1><p>This site exists to help people discover Bible truth in a clear, step-by-step way. It is designed for learners who want simple explanations, honest questions and practical Bible-based guidance.</p></header><div class="reading-card"><h3>Purpose</h3><p>These studies are built to introduce people to key Bible teachings in plain language while keeping Scripture at the centre.</p><p>All material is intended to be Bible based. Readers are encouraged to compare every lesson with the Bible for themselves.</p><button class="btn btn-dark" data-action="home">Explore the studies →</button></div>`;
}

function route(){
  const hash=decodeURIComponent(location.hash||'');
  const study=hash.startsWith('#study=')?hash.slice(7):null;
  ['homeTab','progressTab','aboutTab'].forEach(x=>document.getElementById(x).classList.remove('active'));
  if(study&&STUDIES.some(x=>x.id===study)){
    if(!isUnlocked(study)){document.getElementById('homeTab').classList.add('active');renderHome();toast(`Complete the earlier studies first to unlock that lesson.`)}
    else{document.getElementById('homeTab').classList.add('active');renderStudy(STUDIES.find(s=>s.id===study));}
  }else if(hash==='#journey'){
    document.getElementById('progressTab').classList.add('active');renderJourney();
  }else if(hash==='#about'){
    document.getElementById('aboutTab').classList.add('active');renderAbout();
  }else{
    document.getElementById('homeTab').classList.add('active');renderHome();
  }
  document.title=(study&&isUnlocked(study)?`${STUDIES.find(s=>s.id===study)?.title} — `:'')+'Get to Know Jesus';
}

function shareStudy(id){
  const link=location.href.split('#')[0]+'#study='+encodeURIComponent(id);
  if(navigator.share){navigator.share({title:STUDIES.find(s=>s.id===id)?.title||'Bible study',url:link}).catch(()=>{});return}
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(link).then(()=>toast('Study link copied')).catch(()=>fallbackCopy(link))}
  else fallbackCopy(link);
}
function fallbackCopy(t){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch{}ta.remove();toast(ok?'Link copied':'Select the page address to share this study')}
function exportProgress(){const blob=new Blob([JSON.stringify({application:'Rooted in Hope',version:2,exported:new Date().toISOString(),...user},null,2)],{type:'application/json'});const objectUrl=URL.createObjectURL(blob);const a=document.createElement('a');a.href=objectUrl;a.download='my-bible-study-journey.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);toast('Progress file prepared')}
function importProgress(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const dat=JSON.parse(reader.result);if(!dat||!Array.isArray(dat.completed)||typeof dat.notes!=='object')throw Error();const received=new Set(dat.completed);user.completed=ORDER.map(s=>s.id).filter((id,i)=>ORDER.slice(0,i+1).every(x=>received.has(x.id)));user.read=(dat.read&&typeof dat.read==='object')?Object.fromEntries(Object.entries(dat.read).filter(([id,v])=>ORDER.some(s=>s.id===id)&&Array.isArray(v)).map(([id,v])=>[id,v.filter(n=>Number.isInteger(n)&&n>=0&&n<6)])):{};user.notes=Object.fromEntries(Object.entries(dat.notes).filter(([key,val])=>STUDIES.some(s=>s.id===key)&&typeof val==='string').map(([k,v])=>[k,v.slice(0,50000)]));save();route();toast('Saved progress imported')}catch{toast('This does not appear to be a valid journey export file')}};reader.readAsText(file)}

function openConnect(){document.getElementById('contactStarted').value=Date.now();modal.hidden=false;document.body.classList.add('modal-open');setTimeout(()=>document.getElementById('connectEmail')?.focus(),25)}
function closeConnect(){modal.hidden=true;document.body.classList.remove('modal-open');connectStatus.textContent='';}

function submitConnectForm(e){
  e.preventDefault();
  if(window.pendingContact){connectStatus.textContent='A message is still awaiting confirmation.';return;}
  if(!CONNECT_ENDPOINT){
    connectStatus.textContent='This form is not yet connected. The site owner needs to activate secure email delivery.';
    return;
  }
  if(!connectForm.reportValidity())return;
  const nonce=String(Date.now())+'-'+Math.random().toString(36).slice(2);
  document.getElementById('contactNonce').value=nonce;
  connectForm.action=CONNECT_ENDPOINT;
  connectForm.method='POST';
  connectForm.target='contactResponseFrame';
  connectStatus.textContent='Sending securely…';
  connectForm.querySelector('[type="submit"]').disabled=true;
  window.pendingContact=nonce;
  // Google Apps Script may not be able to acknowledge an iframe response in all browsers.
  // Restore the form rather than leaving the sender staring at “Sending…” indefinitely.
  clearTimeout(window.contactWatchdog);
  window.contactWatchdog=setTimeout(()=>{
    if(window.pendingContact!==nonce)return;
    window.pendingContact=null;
    connectForm.querySelector('[type="submit"]').disabled=false;
    connectStatus.textContent='Delivery could not be confirmed. Please check before sending again, or try later.';
  },20000);
  connectForm.submit();
}
window.addEventListener('message',event=>{
  // The confirmation contains the nonce that was included with this submission.
  // The destination email never appears in the public page.
  const data=event.data;
  if(!data||data.source!=='rooted-hope-contact'||!window.pendingContact||data.nonce!==window.pendingContact)return;
  if(!/^https:\/\/(script\.googleusercontent\.com|script\.google\.com)$/.test(event.origin))return;
  clearTimeout(window.contactWatchdog);
  window.pendingContact=null;
  connectForm.querySelector('[type="submit"]').disabled=false;
  connectStatus.textContent=data.ok?'Your message has been sent. Thank you.':(data.message||'The message could not be sent. Please try again.');
  if(data.ok){connectForm.reset();document.getElementById('contactStarted').value=Date.now();}
});

document.body.addEventListener('click',e=>{
  const target=e.target.closest('[data-study],[data-action],[data-modal-close]');
  if(!target) return;
  if(target.hasAttribute('data-modal-close')){closeConnect();return;}
  const id=target.dataset.study;
  if(id){goStudy(id);return}
  const a=target.dataset.action;
  if(a==='home') nav('home');
  if(a==='journey') nav('progress');
  if(a==='about') nav('about');
  if(a==='share') shareStudy(target.dataset.id);
  if(a==='clear-search'){state.search='';renderHome();}
  if(a==='save-notes'){save();toast('Reflection saved locally');}
  if(a==='complete'){
    const id=target.dataset.id;
    if(completed(id)) return;
    if(!isUnlocked(id)||!allRead(id)){toast('Work through all six readings before completing this study.');return;}
    user.completed.push(id);
    save();
    const unlocked=nextStudy();
    route();
    toast(unlocked?`Study completed. ${unlocked.title} is now available.`:'All studies completed. Well done!');
  }
  if(a==='export') exportProgress();
  if(a==='import') document.getElementById('importFile')?.click();
  if(a==='connect') openConnect();
});

main.addEventListener('change',e=>{
 if(e.target.id==='importFile'){importProgress(e.target.files?.[0]);return;}
 if(e.target.matches('[data-stepcheck]')){
   const id=decodeURIComponent(location.hash.slice(7));
   if(!STUDIES.some(s=>s.id===id))return;
   const n=Number(e.target.dataset.stepcheck);
   const set=new Set(user.read[id]||[]);
   if(e.target.checked)set.add(n);else set.delete(n);
   user.read[id]=Array.from(set).sort((a,b)=>a-b);save();
   const cnt=document.getElementById('readCount');if(cnt)cnt.textContent=`${checkedCount(id)} of ${(DEPTH[id]?.steps||[]).length} passages studied`;
   const btn=document.getElementById('completeStudyBtn');
   if(btn&&!completed(id)){btn.disabled=!allRead(id);btn.textContent=allRead(id)?'✓ Finish study & unlock next':'Review all passages to finish';}
   const hint=document.getElementById('finishHint');if(hint)hint.textContent=allRead(id)?'You have worked through the readings. Take time for reflection, then finish the study.':'Complete all six reading checkpoints to unlock the next study.';
 }
});
document.getElementById('brandButton').addEventListener('click',()=>nav('home'));
document.getElementById('homeTab').addEventListener('click',()=>nav('home'));
document.getElementById('progressTab').addEventListener('click',()=>nav('progress'));
document.getElementById('aboutTab').addEventListener('click',()=>nav('about'));
document.getElementById('themeButton').addEventListener('click',()=>{user.theme=user.theme==='light'?'dark':'light';save();applyTheme()});
document.getElementById('fontButton').addEventListener('click',()=>{user.font=(user.font+1)%4;save();applyTheme();toast(['Standard text','Larger text','Even larger text','Extra-large text'][user.font])});
window.addEventListener('hashchange',route);
modal.addEventListener('click',e=>{if(e.target===modal) closeConnect()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden) closeConnect()});
connectForm.addEventListener('submit',submitConnectForm);

window.BIBLE_PROGRESS={get:()=>JSON.parse(JSON.stringify(user)),replace:(data)=>{if(!data||typeof data!=='object')return;const set=new Set(Array.isArray(data.completed)?data.completed:[]);user.completed=ORDER.map(x=>x.id).filter((id,i)=>ORDER.slice(0,i+1).every(x=>set.has(x.id)));user.read=(data.read&&typeof data.read==='object')?data.read:{};user.notes=(data.notes&&typeof data.notes==='object')?data.notes:{};save();route()}};
applyTheme();
route();
})();
