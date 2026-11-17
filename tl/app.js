(()=>{
'use strict';

const STORAGE='discover-truth-tl-v1';
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
window.GTKJ_STUDY_CHOICES=STUDIES.map(s=>({id:s.id,title:s.title}));
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
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(user));window.BIBLE_ACCOUNT?.save?.()}catch{toast('Hindi magamit ang imbakan sa browser na ito.')}}
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
  if(window.BIBLE_ALL_UNLOCKED===true) return true;
  if(Array.isArray(window.BIBLE_SELECTED_STUDIES)&&window.BIBLE_SELECTED_STUDIES.includes(id)) return true;
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
    toast(current?`Tapusin muna ang “${current.title}” upang mabuksan ang susunod na aralin.`:'Naka-lock pa ang araling ito.');
    return;
  }
  location.hash='#study='+encodeURIComponent(id);
  route();
  window.scrollTo({top:0,behavior:'instant'});
}

function progressBanner(){
  const n=user.completed.length;
  return `<div class="progress-banner"><div class="progress-circle" style="--pct:${completionPercent()}%"><span>${completionPercent()}%</span></div><div class="progress-caption"><strong>${n} sa ${ORDER.length} araling natapos</strong><p>${n===0?'Magsimula sa Aralin 1 at magpatuloy nang sunod-sunod.':n===ORDER.length?'Natapos mo na ang lahat ng aralin.':`Ang kasunod mong aralin ay <b>${esc(nextStudy()?.title||'complete')}</b>.`}</p></div><button class="btn btn-outline" data-action="journey">Aking Paglalakbay</button></div>`
}

function card(s,index){
  const locked=!isUnlocked(s.id);
  const isNext=nextStudy()?.id===s.id;
  return `<article class="course-card ${locked?'is-locked':''}"><div class="card-inside"><div class="card-top"><span class="eyebrow">ARALIN ${String(index+1).padStart(2,'0')} · ${esc(s.tag)}</span>${completed(s.id)?'<span class="done-mark">✓ Tapos na</span>':locked?'<span class="lock-mark">🔒 Naka-lock</span>':isNext?'<span class="next-mark">Susunod</span>':''}</div><div class="card-title">${esc(s.title)}</div><p class="card-lead">${bibleRef(esc(s.lead))}</p></div><div class="card-footer"><span>${locked?'TAPUSIN MUNA ANG NAUNANG ARALIN':'30–45 MINUTONG PAG-AARAL'}</span><button type="button" ${locked?'disabled':''} data-study="${esc(s.id)}" aria-label="${locked?'Naka-lock: ':'Buksan '}${esc(s.title)}">${locked?'Naka-lock':'Buksan ang aralin →'}</button></div></article>`;
}

function renderCards(){
  const q=state.search.trim().toLowerCase();
  const results=ORDER.filter(s=>!q||[s.title,s.lead,s.intro,s.tag,...s.verses].join(' ').toLowerCase().includes(q));
  const el=document.getElementById('courseGrid');
  if(!el) return;
  el.innerHTML=results.length?results.map((s,i)=>card(s,ORDER.indexOf(s))).join(''):`<div class="empty" style="grid-column:1/-1"><h3>Walang katugmang aralin</h3><p class="muted">Subukan ang mas simpleng paghahanap.</p><button class="btn btn-outline" data-action="clear-search">Burahin ang paghahanap</button></div>`;
}

function renderStartHere(){
  const items=(START_HERE.sections||[]).map(s=>`<section class="panel"><h2>${esc(s.heading)}</h2>${(s.paragraphs||[]).map(p=>`<p>${bibleRef(esc(p))}</p>`).join('')}</section>`).join('');
  main.innerHTML=`<header class="detail-head"><a class="back-button" href="#">← Bumalik sa mga Aralin</a><span class="kicker">MALIGAYANG PAGDATING • MAGSIMULA DITO</span><h1>Pagkilala kay Hesus</h1><p class="lead">Panimula sa iyong paglalakbay sa pag-aaral ng Biblia</p></header><div class="detail-main">${items}<div class="foot-actions"><a class="btn btn-primary" href="#study=${esc(ORDER[0].id)}">Simulan ang Aralin 1 →</a></div></div>`;
}

function renderHome(){
  const next=nextStudy()||ORDER[0];
  main.innerHTML=`<section class="hero"><div class="hero-copy"><span class="kicker">MGA PAG-AARAL SA BIBLIA UPANG MATUKLASAN ANG KATOTOHANAN</span><h1>Kilalanin ang Diyos.<br>Tuklasin ang katotohanan.</h1><p>Malinaw na mga pag-aaral sa Biblia para sa mga nais umunawa sa Kasulatan nang sunod-sunod. Mabubuksan ang susunod na aralin kapag natapos ang nauna.</p><button class="btn btn-primary" data-study="${esc(next.id)}">${user.completed.length?'Magpatuloy sa '+esc(next.title):'Magsimula sa '+esc(next.title)} <span aria-hidden="true">→</span></button><div class="hero-stats"><span>✦ ${ORDER.length} aralin</span><i class="dot"></i><span>Batay sa Biblia</span><i class="dot"></i><span>Isang aralin sa bawat pagkakataon</span></div></div><div class="hero-art"><div class="verse">“At inyong makikilala ang katotohanan, at ang katotohana'y magpapalaya sa inyo.”<span>JUAN 8:32</span></div></div></section>
    <section class="panel" style="margin:18px 0 24px;padding:22px;border:2px solid #4a8f80"><span class="kicker">BAGO KA RITO? MAGSIMULA DITO</span><h2 style="margin:9px 0">Magsimula Dito — Panimula</h2><p>Isang magiliw na panimula at gabay sa paggamit ng mga pag-aaral sa Biblia. Palaging mabubuksan at hindi kabilang sa 28 aralin.</p><a class="btn btn-primary" href="#start-here">Buksan ang Panimula →</a></section>
    <div class="welcome-guide-grid">
      <section class="panel how-guide-panel"><span class="kicker">BAGO KA MAGSIMULA</span><h2>Paano Mag-aral ng Biblia?</h2><p>Sampung praktikal na prinsipyo sa pagbabasa at pag-unawa sa Kasulatan at sa pagtuklas ng katotohanan. Ito ay libreng gabay, hindi isang bilang na aralin.</p><a class="btn btn-primary" href="how-to-study-the-bible.html">Basahin ang Gabay →</a></section>
      <div class="welcome-progress">${progressBanner()}</div>
    </div>
    <section class="feature-row" aria-label="Paano gamitin ang mga aralin"><div class="feature"><div class="glyph">📖</div><div><strong>Payak na pagtuturo ng Biblia</strong><p>Ipinapaliwanag ng bawat aralin ang paksa sa malinaw na pananalita.</p></div></div><div class="feature"><div class="glyph">💬</div><div><strong>Mga tanong sa buhay</strong><p>Sinasagot ng bawat aralin ang mga karaniwang tanong tungkol sa pananampalataya.</p></div></div><div class="feature"><div class="glyph">🔓</div><div><strong>Gabay na sunod-sunod</strong><p>Sunod-sunod ang mga aralin upang maging pundasyon ang naunang aralin sa kasunod.</p></div></div></section>
    <div id="library" class="section-head"><div><span class="kicker">IYONG GABAY SA PAG-AARAL</span><h2>Mag-aral nang sunod-sunod</h2><p>Maghanap ng paksa sa ibaba. Mabubuksan ang mga susunod na aralin kapag natapos ang nauna.</p></div><button class="btn btn-outline" data-action="connect">Humingi ng Tulong</button></div>
    <div class="library-control"><div class="search-wrap"><span class="search-icon" aria-hidden="true">⌕</span><input type="search" id="searchInput" placeholder="Maghanap ng paksa o tanong..." aria-label="Maghanap ng paksa sa Biblia" value="${esc(state.search)}" /></div></div>
    <div class="course-grid" id="courseGrid"></div>`;
  renderCards();
  document.getElementById('searchInput').addEventListener('input',e=>{state.search=e.target.value;renderCards()});
}

function bibleRef(text){return String(text||'').replace(new RegExp("(?:Awit\\ ng\\ mga\\ Awit|1\\ Thessalonians|Song\\ of\\ Solomon|2\\ Thessalonians|2\\ Corinthians|1\\ Corinthians|Deuteronomio|Lamentations|Mga\\ Kawikaan|Mga\\ Panaghoy|1\\ Tesalonica|Ecclesiastes|1\\ Chronicles|2\\ Tesalonica|2\\ Chronicles|Deuteronomy|Philippians|Apocalipsis|Mga\\ Bilang|Colossians|Revelation|Zechariah|Zephaniah|2\\ Timoteo|1\\ Corinto|2\\ Cronica|Galatians|Ephesians|2\\ Corinto|1\\ Timoteo|2\\ Timothy|1\\ Timothy|Mga\\ Hukom|1\\ Cronica|Leviticus|Jeremias|Mga\\ Awit|Panaghoy|2\\ Samuel|Philemon|Levitico|Zacarias|Zefanias|Nehemiah|1\\ Samuel|Proverbs|Nehemias|Santiago|Mga\\ Gawa|Jeremiah|Malakias|Habakkuk|Kawikaan|Obadias|Malachi|Filemon|1\\ Peter|Hebrews|Colosas|2\\ Pedro|Obadiah|Numbers|Matthew|Ezekiel|2\\ Peter|2\\ Kings|Genesis|Habacuc|Filipos|1\\ Pedro|1\\ Kings|Galacia|1\\ Hari|Esther|Judges|3\\ Juan|Marcos|Isaiah|1\\ John|Bilang|Haggai|Psalms|2\\ Juan|Hebreo|2\\ Hari|Isaias|Daniel|Exodus|Joshua|2\\ John|1\\ Juan|Romans|3\\ John|James|Mikas|Jonah|Exodo|Judas|Mateo|Hosea|Micah|Oseas|Titus|Hagai|Hukom|Jonas|Lucas|Efeso|Nahum|Josue|Joel|Luke|Roma|Awit|Mark|Tito|Amos|Acts|Ruth|John|Ezra|Juan|Gawa|Jude|Job)\\s+\\d{1,3}(?::\\s*\\d+(?:\\s*[\u2013\u2212-]\\s*\\d+)?(?:\\s*[,;]\\s*\\d+(?::\\d+)?(?:\\s*[\u2013\u2212-]\\s*\\d+)?)*)?",'g'),raw=>`<button type="button" class="verse-link" data-bible-ref="${esc(raw.trim())}">${esc(raw)}</button>`)}
function addedPics(id,section,index){
  const pics=(STUDY_INLINE_IMAGES[id]||[]).filter(p=>p.section===section&&p.index===index);
  if(!pics.length)return '';
  const blocks=[];
  let gallery=[];let galleryTitle='';
  function flush(){if(gallery.length){blocks.push(`<div class="study-gallery"><h4>${esc(galleryTitle)}</h4><div class="study-gallery-grid">${gallery.join('')}</div></div>`);gallery=[];galleryTitle='';}}
  for(const p of pics){
    const figure=`<figure class="inserted-larawan"><button type="button" class="image-zoom-button" data-image-zoom="${esc(p.src)}" data-image-alt="${esc(p.caption||'Larawan ng aralin sa Biblia')}" aria-label="Palakihin ${esc(p.caption||'larawan')}"><img src="${esc(p.src)}" loading="lazy" alt="${esc(p.caption||'Larawan ng aralin sa Biblia')}"/><span class="image-zoom-hint">⤢ Palakihin</span></button>${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`;
    if(p.gallery){if(gallery.length&&galleryTitle!==p.gallery)flush();galleryTitle=p.gallery;gallery.push(figure);}
    else{flush();blocks.push(figure);}
  }
  flush();return blocks.join('');
}

function media(s){
  const image=BIBLEWORLD_IMAGES[STUDY_ART[s.id]||s.art];
  if(!image) return '';
  return `<div class="media-box"><button type="button" class="image-zoom-button" data-image-zoom="${esc(image.src)}" data-image-alt="${esc(s.title)}"><img src="${esc(image.src)}" loading="lazy" alt="${esc(image.alt||image.credit||s.title)}" onerror="this.closest('.media-box').style.display='none'"></button></div>`;
}

function renderStudy(s){
  const ix=ORDER.findIndex(x=>x.id===s.id);
  const next=ORDER[ix+1];
  const previous=ORDER[ix-1];
  const nextLocked=next && !isUnlocked(next.id);
  main.innerHTML=`<header class="detail-head"><button class="back-button" data-action="home">← Bumalik sa mga Aralin</button><div><span class="kicker">ARALIN SA BIBLIA ${String(ix+1).padStart(2,'0')} · ${esc(s.tag)}</span> ${completed(s.id)?'<span class="pill">✓ Natapos</span>':''}</div><h1>${esc(s.title)}</h1><p class="lead">${bibleRef(esc(s.lead))}</p></header>
  <div class="detail-grid"><div class="detail-main">
  <section class="panel intro-panel"><span class="kicker">PANGKALAHATANG PANANAW · HUMIGIT-KUMULANG 30–45 MINUTO</span><p>${bibleRef(esc(s.intro))}</p></section>${media(s)}${addedPics(s.id,'intro',0)}
  <section class="panel"><div class="panel-header"><span class="small-round">01</span><h2>Unawain ang mensahe</h2></div>${s.ideas.map(p=>`<article class="idea"><h3>${esc(p[0])}</h3><p>${bibleRef(esc(p[1]))}</p><div class="scripture">Basahin: ${bibleRef(p[2])}</div>${addedPics(s.id,'idea',s.ideas.indexOf(p))}</article>`).join('')}</section>

  <section class="panel connection-panel"><div class="panel-header"><span class="small-round">✦</span><h2>Unawain ang mahahalagang ugnayan</h2></div><p class="reading-guidance">Ang mga karagdagang paliwanag na ito ay nagpapalalim sa aralin. Basahin ang mga talata at pag-isipan ang pagkakaugnay ng mga ito sa mga naunang aralin.</p>
    ${(CONNECTIONS[s.id]||[]).map((c,i)=>`<article class="connection-item"><div class="connection-top"><span class="step-number">${String(i+1).padStart(2,'0')}</span><h3>${esc(c[0])}</h3></div><div class="scripture">Basahin nang magkasama: ${bibleRef(c[1])}</div><p>${bibleRef(esc(c[2]))}</p>${addedPics(s.id,'connection',i)}</article>`).join('')}
  </section>
  <section class="panel depth-panel">
    <div class="panel-header"><span class="small-round">02</span><h2>Pag-aralan ang Biblia nang sunod-sunod</h2></div>
    <p class="reading-guidance">Maglaan ng mga 3–5 minuto sa bawat pagbasa. Basahin sa konteksto, pag-isipan ang paliwanag, at saka tingnan ang iminungkahing sagot. Markahan ang bawat pagbasa kapag natapos mo na.</p>
    <div class="principle-box"><span class="kicker">PRINSIPYONG DAPAT MAUNAWAAN</span><p>${bibleRef(esc(DEPTH[s.id]?.principle||s.intro))}</p>${addedPics(s.id,'principle',0)}</div>
    ${((DEPTH[s.id]&&DEPTH[s.id].steps)||[]).map((st,i)=>`<article class="bible-stop" id="stop-${i}"><div class="stop-head"><span class="step-number">${String(i+1).padStart(2,'0')}</span><div><div class="stop-ref">BASAHIN · ${bibleRef(st[0])}</div><h3>${esc(st[1])}</h3></div></div><p>${bibleRef(esc(st[2]))}</p>${addedPics(s.id,'step',i)}<div class="look-closer"><strong>Pag-isipan ito</strong><p>${bibleRef(esc(st[3]))}</p><details class="answer-reveal"><summary>Tingnan ang iminungkahing sagot</summary><p>${bibleRef(esc(st[4]))}</p></details></div><label class="read-toggle"><input type="checkbox" data-stepcheck="${i}" ${((user.read[s.id]||[]).includes(i))?'checked':''}><span>Nabasa at napag-isipan ko ang talatang ito</span></label></article>`).join('')}
    <div class="read-count" id="readCount">${checkedCount(s.id)} sa ${(DEPTH[s.id]?.steps||[]).length} talatang napag-aralan</div>
  </section>
  <section class="panel"><div class="panel-header"><span class="small-round">03</span><h2>Mga tanong sa buhay</h2></div><p class="muted">Pindutin ang tanong upang makita ang iminungkahing sagot.</p>${s.qa.map(({0:q,1:a})=>`<details class="qitem"><summary>${bibleRef(esc(q))}</summary><div class="answer"><strong>Sagot na batay sa Biblia:</strong> ${bibleRef(esc(a))}</div>${addedPics(s.id,'qa',s.qa.findIndex(z=>z[0]===q))}</details>`).join('')}</section>
  <section class="panel"><div class="panel-header"><span class="small-round">04</span><h2>Isabuhay ang aralin</h2></div><div class="prompt">${bibleRef(esc(s.act))}</div><div class="prompt" style="margin-top:12px"><strong>Karagdagang personal na gawain:</strong> ${bibleRef(esc(DEPTH[s.id]?.practice||s.act))}</div>${addedPics(s.id,'end',0)}<div class="journal-title" style="margin-top:21px"><strong>Aking pribadong pagninilay</strong><span>Naka-save sa iyong account kung naka-sign in; kung hindi, sa device na ito</span></div><textarea id="studyNotes" placeholder="Ano ang tumatak sa iyo? Anong mga tanong ang mayroon ka pa?" aria-label="Pribadong tala ng pagninilay"></textarea><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="study-notice" id="notesStatus">Naka-save sa browser na ito</span><button class="mini-link" type="button" data-action="save-notes">I-save ang tala</button></div></section>
  <div class="foot-actions"><button class="btn btn-dark" id="completeStudyBtn" data-action="complete" data-id="${esc(s.id)}" ${completed(s.id)||!allRead(s.id)?'disabled':''}>${completed(s.id)?'✓ Natapos ang aralin':allRead(s.id)?'✓ Tapusin at buksan ang kasunod':'Basahin muna ang lahat ng talata'}</button><button class="btn btn-outline" data-action="share" data-id="${esc(s.id)}">Ibahagi ang araling ito ↗</button></div>
  <div class="study-notice" id="finishHint">${completed(s.id)?'Maaari mong balikan ang araling ito anumang oras.':allRead(s.id)?'Natapos mo ang mga pagbasa. Maglaan ng oras upang magmuni-muni, saka tapusin ang aralin.':'Tapusin ang lahat ng anim na pagbasa upang mabuksan ang kasunod.'}</div>
  <div class="foot-actions">${previous?`<button class="btn btn-outline" data-study="${esc(previous.id)}">← Nakaraan</button>`:'<span></span>'}${next?`<button class="btn btn-outline" ${nextLocked?'disabled':''} data-study="${esc(next.id)}">${nextLocked?'Tapusin ang aralin upang mabuksan ang kasunod':'Susunod na aralin →'}</button>`:`<button class="btn btn-outline" data-action="journey">Tingnan ang paglalakbay →</button>`}</div>
  <p class="study-notice">Tinutulungan ka ng mga araling ito na maunawaan ang katotohanan ng Biblia. Suriin ang bawat turo ayon sa konteksto ng Kasulatan.</p>
  </div><aside class="detail-side" aria-label="Tulong sa pag-aaral"><div class="side-card"><h3>Iyong paglalakbay</h3><p>${completed(s.id)?'Tapos na ang araling ito. Maaari mo itong balikan anumang oras.':`Ikaw ay nasa Aralin ${String(ix+1).padStart(2,'0')} sa ${ORDER.length}.`}</p><p>${nextLocked?'Tapusin ang araling ito upang mabuksan ang kasunod.':next?`Susunod na aralin: <b>${esc(next.title)}</b>.`:'Ikaw ay nasa huling aralin.'}</p><button class="btn btn-outline" data-action="connect">Humingi ng Tulong</button></div></aside></div>`;
  const field=document.getElementById('studyNotes');
  field.value=user.notes[s.id]||'';
  let savedTimer;
  field.addEventListener('input',()=>{user.notes[s.id]=field.value;save();document.getElementById('notesStatus').textContent='Nai-save ✓';clearTimeout(savedTimer);savedTimer=setTimeout(()=>document.getElementById('notesStatus')&&(document.getElementById('notesStatus').textContent='Naka-save sa browser na ito'),2000)});
}

function renderJourney(){
  const current=nextStudy();
  main.innerHTML=`<header class="article-hero"><span class="kicker">IYONG PAGLALAKBAY SA PAG-AARAL</span><h1>Isa-isang hakbang.</h1><p>Naka-save ang progreso at tala mo sa iyong online account kapag naka-sign in; kung hindi, sa browser na ito.</p></header>${progressBanner()}<section class="reading-card"><h3>Magpatuloy sa huli mong aralin</h3><p>${current?`Ang kasunod mong aralin ay <b>${esc(current.title)}</b>.`:'Natapos mo na ang lahat ng aralin. Maaari mong balikan ang alinmang paksa.'}</p>${current?`<button class="btn btn-dark" data-study="${esc(current.id)}">Magpatuloy sa ${esc(current.title)} →</button>`:''}</section><div class="section-head"><div><h2>Lahat ng aralin</h2><p>${user.completed.length} natapos · ${ORDER.length-user.completed.length} natitira</p></div><button class="btn btn-outline" data-action="connect">Humingi ng Tulong</button></div><div class="my-list">${ORDER.map((s,index)=>{const locked=!isUnlocked(s.id);const label=completed(s.id)?'✓ Natapos':locked?'🔒 Naka-lock':'▶ Kasalukuyan';return `<div class="my-item ${locked?'is-locked-row':''}"><div><strong>${label} · Aralin ${String(index+1).padStart(2,'0')} — ${esc(s.title)}</strong><small>${user.notes[s.id]?'Nai-save ang personal na pagninilay':'Wala pang naitalang pagninilay'}</small></div><button ${locked?'disabled':''} data-study="${esc(s.id)}">${locked?'Naka-lock':'Buksan ang aralin →'}</button></div>`}).join('')}</div><section class="reading-card"><h3>Magtago ng kopya ng mga pagninilay</h3><p>I-export ang iyong mga tala at progreso bilang JSON file. Maaari mo itong i-import muli, kahit sa ibang device.</p><div class="foot-actions" style="justify-content:start"><button class="btn btn-outline" data-action="export">I-export ang progreso</button><button class="btn btn-outline" data-action="import">I-import ang na-save na progreso</button><input id="importFile" type="file" accept="application/json,.json" hidden></div></section><div class="privacy"><b>Ang iyong pribasiya:</b> Hindi kailangang gumawa ng account. Kapag naka-sign in, naka-save ang progreso at mga tala sa iyong pribadong account; kung hindi, sa browser na ito. Maaaring mawala ang lokal na progreso kapag binura ang datos ng browser.</div>`;
}

function renderAbout(){
  main.innerHTML=`<header class="article-hero"><span class="kicker">TUNGKOL SA WEBSITE NA ITO</span><h1>Pagkilala kay Hesus</h1><p>Layunin ng website na ito na tulungan ang mga tao na matuklasan ang katotohanan ng Biblia nang malinaw at sunod-sunod. Para ito sa mga nagnanais ng payak na paliwanag, tapat na mga tanong at praktikal na gabay mula sa Biblia.</p></header><div class="reading-card"><h3>Layunin</h3><p>Ipinapakilala ng mga araling ito ang mahahalagang turo ng Biblia sa payak na wika, na nakasentro sa Kasulatan.</p><p>Batay sa Biblia ang mga aralin. Hinihikayat ang mga mambabasa na ihambing mismo ang bawat aralin sa Biblia.</p><button class="btn btn-dark" data-action="home">Tuklasin ang mga aralin →</button></div>`;
}

function route(){
  const hash=decodeURIComponent(location.hash||'');
  const study=hash.startsWith('#study=')?hash.slice(7):null;
  ['homeTab','progressTab','aboutTab'].forEach(x=>document.getElementById(x).classList.remove('active'));
  if(study&&STUDIES.some(x=>x.id===study)){
    if(!isUnlocked(study)){document.getElementById('homeTab').classList.add('active');renderHome();toast(`Tapusin muna ang mga naunang aralin upang mabuksan ang araling iyon.`)}
    else{document.getElementById('homeTab').classList.add('active');renderStudy(STUDIES.find(s=>s.id===study));}
  }else if(hash==='#start-here'){
    document.getElementById('homeTab').classList.add('active');renderStartHere();
  }else if(hash==='#journey'){
    document.getElementById('progressTab').classList.add('active');renderJourney();
  }else if(hash==='#about'){
    document.getElementById('aboutTab').classList.add('active');renderAbout();
  }else{
    document.getElementById('homeTab').classList.add('active');renderHome();
  }
  document.title=(study&&isUnlocked(study)?`${STUDIES.find(s=>s.id===study)?.title} — `:'')+'Pagkilala kay Hesus';
}

function shareStudy(id){
  const link=location.href.split('#')[0]+'#study='+encodeURIComponent(id);
  if(navigator.share){navigator.share({title:STUDIES.find(s=>s.id===id)?.title||'Bible study',url:link}).catch(()=>{});return}
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(link).then(()=>toast('Nakopya ang link ng aralin')).catch(()=>fallbackCopy(link))}
  else fallbackCopy(link);
}
function fallbackCopy(t){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch{}ta.remove();toast(ok?'Nakopya ang link':'Piliin ang address ng pahina upang ibahagi ang aralin')}
function exportProgress(){const blob=new Blob([JSON.stringify({application:'Rooted in Hope',version:2,exported:new Date().toISOString(),...user},null,2)],{type:'application/json'});const objectUrl=URL.createObjectURL(blob);const a=document.createElement('a');a.href=objectUrl;a.download='my-bible-study-journey.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);toast('Handa na ang file ng progreso')}
function importProgress(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const dat=JSON.parse(reader.result);if(!dat||!Array.isArray(dat.completed)||typeof dat.notes!=='object')throw Error();const received=new Set(dat.completed);user.completed=ORDER.map(s=>s.id).filter((id,i)=>ORDER.slice(0,i+1).every(x=>received.has(x.id)));user.read=(dat.read&&typeof dat.read==='object')?Object.fromEntries(Object.entries(dat.read).filter(([id,v])=>ORDER.some(s=>s.id===id)&&Array.isArray(v)).map(([id,v])=>[id,v.filter(n=>Number.isInteger(n)&&n>=0&&n<6)])):{};user.notes=Object.fromEntries(Object.entries(dat.notes).filter(([key,val])=>STUDIES.some(s=>s.id===key)&&typeof val==='string').map(([k,v])=>[k,v.slice(0,50000)]));save();route();toast('Na-import ang na-save na progreso')}catch{toast('Hindi wastong file ng progreso ang napili')}};reader.readAsText(file)}

function openConnect(){clearTimeout(window.contactSuccessTimer);document.getElementById('contactStarted').value=Date.now();modal.hidden=false;document.body.classList.add('modal-open');setTimeout(()=>document.getElementById('connectEmail')?.focus(),25)}
function closeConnect(){clearTimeout(window.contactSuccessTimer);modal.hidden=true;document.body.classList.remove('modal-open');connectStatus.textContent='';}

function submitConnectForm(e){
  e.preventDefault();
  if(window.pendingContact){connectStatus.textContent='Hinihintay pa ang kumpirmasyon ng naunang mensahe.';return;}
  if(!CONNECT_ENDPOINT){
    connectStatus.textContent='Hindi pa nakakonekta ang form. Kailangang i-activate ng may-ari ang ligtas na pagpapadala.';
    return;
  }
  if(!connectForm.reportValidity())return;
  const nonce=String(Date.now())+'-'+Math.random().toString(36).slice(2);
  document.getElementById('contactNonce').value=nonce;
  connectForm.action=CONNECT_ENDPOINT;
  connectForm.method='POST';
  connectForm.target='contactResponseFrame';
  connectStatus.textContent='Ligtas na ipinapadala…';
  connectForm.querySelector('[type="submit"]').disabled=true;
  window.pendingContact=nonce;
  // Google Apps Script may not be able to acknowledge an iframe response in all browsers.
  // Restore the form rather than leaving the sender staring at “Sending…” indefinitely.
  clearTimeout(window.contactWatchdog);
  window.contactWatchdog=setTimeout(()=>{
    if(window.pendingContact!==nonce)return;
    window.pendingContact=null;
    connectForm.querySelector('[type="submit"]').disabled=false;
    connectStatus.textContent='Hindi makumpirma ang paghahatid. Suriin muna bago muling magpadala o subukan mamaya.';
  },20000);
  connectForm.submit();
}
window.addEventListener('message',event=>{
  const data=event.data;
  if(!data||data.source!=='rooted-hope-contact'||!window.pendingContact||data.nonce!==window.pendingContact)return;
  // Apps Script HTML responses can originate from Google-hosted subdomains or
  // a sandboxed iframe ('null' origin). A sandboxed response is only trusted
  // when it comes from our own dedicated response frame, and all responses
  // must include the unpredictable per-submission nonce.
  let trustedGoogleOrigin=false;
  try{
    const url=new URL(event.origin);
    trustedGoogleOrigin=url.protocol==='https:' &&
      (url.hostname==='script.google.com' || url.hostname==='script.googleusercontent.com' ||
       url.hostname.endsWith('.googleusercontent.com') || url.hostname.endsWith('.google.com'));
  }catch{}
  const frame=document.getElementById('contactResponseFrame');
  const fromOwnFrame=event.source===frame.contentWindow;
  if(!trustedGoogleOrigin && !(event.origin==='null' && fromOwnFrame))return;
  clearTimeout(window.contactWatchdog);
  window.pendingContact=null;
  connectForm.querySelector('[type="submit"]').disabled=false;
  connectStatus.textContent=data.ok?'Naipadala na ang iyong mensahe. Salamat.':(data.message||'Hindi naipadala ang mensahe. Subukan muli.');
  if(data.ok){
    connectForm.reset();
    document.getElementById('contactStarted').value=Date.now();
    // Show confirmation briefly before closing, without hiding failed submissions.
    clearTimeout(window.contactSuccessTimer);
    window.contactSuccessTimer=setTimeout(()=>{
      if(modal.hidden)return;
      closeConnect();
      toast('Naipadala na ang iyong mensahe. Salamat.');
    },1400);
  }
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
  if(a==='save-notes'){save();toast('Nai-save sa device ang pagninilay');}
  if(a==='complete'){
    const id=target.dataset.id;
    if(completed(id)) return;
    if(!isUnlocked(id)||!allRead(id)){toast('Tapusin ang anim na pagbasa bago markahang tapos ang aralin.');return;}
    user.completed.push(id);
    save();
    const unlocked=nextStudy();
    route();
    toast(unlocked?`Natapos ang aralin. ${unlocked.title} ay maaari nang buksan.`:'Natapos mo na ang lahat ng aralin. Mahusay!');
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
   const cnt=document.getElementById('readCount');if(cnt)cnt.textContent=`${checkedCount(id)} sa ${(DEPTH[id]?.steps||[]).length} talatang napag-aralan`;
   const btn=document.getElementById('completeStudyBtn');
   if(btn&&!completed(id)){btn.disabled=!allRead(id);btn.textContent=allRead(id)?'✓ Tapusin at buksan ang kasunod':'Basahin muna ang lahat ng talata';}
   const hint=document.getElementById('finishHint');if(hint)hint.textContent=allRead(id)?'Natapos mo ang mga pagbasa. Maglaan ng oras upang magmuni-muni, saka tapusin ang aralin.':'Tapusin ang lahat ng anim na pagbasa upang mabuksan ang kasunod.';
 }
});
document.getElementById('brandButton').addEventListener('click',()=>nav('home'));
document.getElementById('homeTab').addEventListener('click',()=>nav('home'));
document.getElementById('progressTab').addEventListener('click',()=>nav('progress'));
document.getElementById('aboutTab').addEventListener('click',()=>nav('about'));
document.getElementById('themeButton').addEventListener('click',()=>{user.theme=user.theme==='light'?'dark':'light';save();applyTheme()});
document.getElementById('fontButton').addEventListener('click',()=>{user.font=(user.font+1)%4;save();applyTheme();toast(['Karaniwang laki ng teksto','Mas malaking teksto','Higit na malaking teksto','Pinakamalaking teksto'][user.font])});
window.addEventListener('hashchange',route);
window.addEventListener('bible-access-changed',route);
modal.addEventListener('click',e=>{if(e.target===modal) closeConnect()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden) closeConnect()});
connectForm.addEventListener('submit',submitConnectForm);

window.BIBLE_PROGRESS={get:()=>JSON.parse(JSON.stringify(user)),replace:(data)=>{if(!data||typeof data!=='object')return;const set=new Set(Array.isArray(data.completed)?data.completed:[]);user.completed=ORDER.map(x=>x.id).filter((id,i)=>ORDER.slice(0,i+1).every(x=>set.has(x.id)));user.read=(data.read&&typeof data.read==='object')?data.read:{};user.notes=(data.notes&&typeof data.notes==='object')?data.notes:{};save();route()}};
applyTheme();
route();
})();

// Direct links from the introductory guide to the existing Get Help form.
window.addEventListener('load',()=>{if(location.hash==='#help'){document.querySelector('[data-action="connect"]')?.click();}});
