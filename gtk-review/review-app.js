/* GTKJ 28-LESSON REVIEW: isolated from live progress/Firebase. */
(() => {
'use strict';
const STORE='gtkj-educational-review-v1';
const COURSE_IDS=['word','history','controversy','salvation','spirit','sanctuary','blue-stone','law','sabbath','prayer','baptism','living','health','stewardship','nature','second-coming','millennium','hell','seventy-weeks','judgement','1844','antichrist','america','mark','prophecy-gift','godhead','remnant','witnessing'];\nconst COURSE=COURSE_IDS.map(id=>STUDIES.find(s=>s.id===id));\nconst ids=COURSE_IDS;
const model=window.GTKJ_REVIEW;
const transform=window.GTKJ_REVIEW_PASS3;
const nav=document.getElementById('lessonNav');
const content=document.getElementById('lessonContent');
const reviewer=document.getElementById('reviewerMode');
const progress=document.getElementById('progressCount');
const fill=document.getElementById('progressFill');
if(!Array.isArray(STUDIES)||STUDIES.length!==28||COURSE.some(s=>!s)||new Set(COURSE_IDS).size!==28||!model||!model.quizzes){
  content.innerHTML='<div class="warning"><strong>Review data could not be loaded.</strong><p>Check that the current website files lessons.js, lesson-depth.js, principles.js and gtk-review/review-data.js are present.</p></div>';return;
}
let state={passed:{},notes:{},reviewer:true};
try{
  const stored=JSON.parse(localStorage.getItem(STORE)||'null');
  if(stored&&typeof stored==='object'){
    state.passed=stored.passed&&typeof stored.passed==='object'?stored.passed:{};
    state.notes=stored.notes&&typeof stored.notes==='object'?stored.notes:{};
    state.reviewer=typeof stored.reviewer==='boolean'?stored.reviewer:true;
  }
}catch(_){}
reviewer.checked=state.reviewer;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=x=>Array.isArray(x)?x:[];
const byId=id=>STUDIES.find(s=>s.id===id);
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch(_){}}
function countPassed(){return ids.filter(id=>state.passed[id]===true).length}
function unlockedAt(){
 let i=0;while(i<ids.length&&state.passed[ids[i]]===true)i++;return i;
}
function canOpen(id){return state.reviewer||state.passed[id]===true||ids.indexOf(id)<=unlockedAt();}
function currentId(){
 const v=decodeURIComponent((location.hash||'').replace(/^#study=/,''));
 return ids.includes(v)?v:ids[0];
}
function navigate(id){if(!canOpen(id)){alert('You are moving through the studies one step at a time. Finish the study before this one, and this lesson will be ready next.');return;}
 if(location.hash==='#study='+encodeURIComponent(id)){render();return;}
 location.hash='#study='+encodeURIComponent(id);
}
function renderNav(){
 const active=currentId();
 progress.textContent=countPassed()+' / '+ids.length+' passed';
 fill.style.width=(countPassed()/ids.length*100)+'%';
 nav.innerHTML=COURSE.map((s,i)=>'<button type="button" class="navbtn '+(s.id===active?'active ':'')+(!canOpen(s.id)?'locked':'')+'" data-id="'+E(s.id)+'" '+(!canOpen(s.id)?'aria-label="Study '+(i+1)+', coming up after Study '+(unlockedAt()+1)+'."':'')+'><span class="navnum">'+String(i+1).padStart(2,'0')+'</span><span>'+E(s.title)+'</span><span class="mark">'+(state.passed[s.id]?'✓':canOpen(s.id)?(ids.indexOf(s.id)===unlockedAt()?'Next':'Open'):'Up ahead')+'</span></button>').join('');
 nav.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.id)));
}
function verseChips(verses){return '<div class="versechips">'+arr(verses).map(x=>'<span>'+E(x)+'</span>').join('')+'</div>'}
function cardIdea(x){return '<div class="idea"><h4>'+E(x[0])+'</h4><p>'+E(x[1])+'</p><p class="refs">'+E(x[2])+'</p></div>'}
function stepCard(x,i){return '<section class="step" id="step-'+i+'"><small>READ '+(i+1)+' · '+E(x[0])+'</small><h4>'+E(x[1])+'</h4><p>'+E(x[2])+'</p><div class="question"><b>Consider: '+E(x[3])+'</b><details><summary>Show suggested answer</summary><p>'+E(x[4])+'</p></details></div></section>'}
function noteArea(id){
 return '<section class="section review-note" id="reviewNotes"><div class="eyebrow-dark">FOR REVIEWERS</div><h3>My comments on this study</h3><p>Record wording changes, questions or doctrinal points for further checking. Notes stay only in this browser until you export them.</p><textarea id="myNotes" placeholder="What should be clearer? What is missing from the central message? Do the questions accurately test the teaching?" aria-label="Your review notes">'+E(state.notes[id]||'')+'</textarea><small>Saved locally as you type · Use Export review notes at the top to keep a copy.</small></section>';
}
function quizQuestions(id){
 const base=arr(model.quizzes[id]).map(q=>q.slice());
 const applied=transform?.studies?.[id]?.quiz;
 if(base.length===5&&applied){base[4]=[applied.question,applied.correct,...applied.wrong]}
 return base;
}
function quizHtml(s){
 const questions=quizQuestions(s.id);
 if(questions.length!==5)return '<div class="warning">This study has not yet received its five review questions.</div>';
 const fields=questions.map((q,i)=>{
 const choices=q.slice(1).map((t,j)=>({t,correct:j===0}));
 const shift=(i*3+s.id.length)%4;const order=choices.slice(shift).concat(choices.slice(0,shift));
 return '<fieldset class="quiz-item"><legend>'+(i+1)+'. '+E(q[0])+'</legend>'+order.map((c,j)=>'<label class="choice"><input type="radio" name="q'+i+'" value="'+(c.correct?'1':'0')+'" data-answer="'+j+'"><span>'+E(c.t)+'</span></label>').join('')+'</fieldset>'
 }).join('');
 return '<section class="section" id="quiz"><div class="quiz"><div class="eyebrow-dark">CHECK YOUR UNDERSTANDING</div><h3>Five important questions</h3><p class="quiz-intro">These questions test the biblical teaching, possible misunderstandings, and a practical response. The fifth question concerns how the truth should shape your character. A correct response demonstrates understanding, not proven transformation. Complete all five questions to continue to the next study. Try as often as you like; there is no penalty.</p><form id="quizForm">'+fields+'<button class="btn" type="submit">Check my answers →</button></form><div id="quizResult" role="status" aria-live="polite"></div></div></section>';
}
function transformationHtml(id){
 const t=transform?.studies?.[id];
 if(!t)return '';
 const cards=[
 ['What this reveals about God',t.reveal,'✦'],
 ['Follow this biblical example',t.follow,'✓'],
 ['Learn from this warning',t.avoid,'!'],
 ['A response in my life',t.response,'→']
 ];
 return '<section class="section" id="becoming"><div class="becoming"><div class="eyebrow-dark">THE GOSPEL CHANGES US · REVIEW 3</div><h3>Becoming More Like Jesus</h3><p class="becoming-intro">Knowing the teaching is only the beginning. By abiding in Christ, we learn to reflect His character in the way we live.</p><div class="becoming-rows">'+cards.map(c=>'<div><span class="becoming-icon">'+E(c[2])+'</span><strong>'+E(c[0])+'</strong><p>'+E(c[1])+'</p></div>').join('')+'</div><p class="refs">READ AND COMPARE: '+E(t.refs)+'</p><p class="transform-footer">Christ is our standard. We follow people only as they follow Christ (1 Corinthians 11:1). Transformation is the work of the Holy Spirit as we respond to Him, not a score produced by this quiz.</p></div></section>';
}
function render(){
 let id=currentId();
 if(!canOpen(id)){id=ids[Math.min(unlockedAt(),ids.length-1)];history.replaceState(null,'','#study='+encodeURIComponent(id))}
 const s=byId(id),d=DEPTH[id],conn=arr(CONNECTIONS[id]),i=ids.indexOf(id);
 if(!s||!d){content.innerHTML='<div class="warning">A source study is missing. The main website was not changed.</div>';return}
 const mainPoints=arr(window.GTKJ_REVIEW_PASS2?.studies?.[id]?.points);
 const art=encodeURIComponent(s.art||id);
 const img='<figure class="illustration"><img src="../assets/custom/'+art+'.jpg" loading="lazy" alt="Illustration for '+E(s.title)+'" onerror="this.closest(\'.illustration\').hidden=true"><figcaption>Illustration from the existing GTKJ study • original proportions preserved</figcaption></figure>';
 const prev=i>0?'<button class="btn alt" type="button" data-go="'+E(ids[i-1])+'">← Previous study</button>':'';
 const next=i<27?'<button class="btn alt" type="button" data-go="'+E(ids[i+1])+'">Next study →</button>':'';
 const intro='<section class="lesson-cover"><div class="kicker">STUDY '+String(i+1).padStart(2,'0')+' OF 28 · '+E(s.tag)+'</div><h2>'+E(s.title)+'</h2><p class="lead">'+E(s.lead)+'</p><p>'+E(s.intro)+'</p>'+verseChips(s.verses)+'</section>';
 const main='<section class="section"><div class="points"><div class="eyebrow-dark">WHAT YOU WILL DISCOVER · PROPOSED MAIN POINTS — REVIEW 2</div><h3>Four truths to remember</h3><p class="principle">'+E(d.principle)+'</p><ol>'+mainPoints.map((t,i)=>'<li class="outcome"><strong>'+E(t.text)+'</strong><small>READ: '+E(t.ref)+'</small>'+(i===3?'<span class="god-character">✦ What this teaches us about God</span>':'')+'</li>').join('')+'</ol></div></section>';
 const analogy='<section class="section"><div class="analogy"><div class="eyebrow-dark">MAKING IT REAL · PROPOSED ILLUSTRATION</div><h3>Think about this</h3><p>'+E(model.analogy[id]||'')+'</p></div></section>';
 const ideas='<section class="section"><div class="eyebrow-dark">BUILDING THE FOUNDATION</div><h3>Three introductory teaching points</h3>'+arr(s.ideas).map(cardIdea).join('')+'</section>';
 const reading='<section class="section"><div class="eyebrow-dark">READ THE SCRIPTURE FOR YOURSELF</div><h3>Guided Bible readings</h3><p>Six readings build the understanding gradually. Open each suggested answer only after considering the Bible question yourself.</p>'+arr(d.steps).map(stepCard).join('')+'</section>';
 const extra='<section class="section connections"><div class="eyebrow-dark">SCRIPTURE CONNECTIONS</div><h3>Understanding the wider picture</h3>'+conn.map(x=>'<details><summary>'+E(x[0])+'</summary><p class="refs">'+E(x[1])+'</p><p>'+E(x[2])+'</p></details>').join('')+'</section>';
 const qa='<section class="section"><div class="eyebrow-dark">APPLYING THE TEACHING</div><h3>Questions people really ask</h3>'+arr(s.qa).map(x=>'<div class="idea"><h4>'+E(x[0])+'</h4><p>'+E(x[1])+'</p></div>').join('')+'<div class="recap"><h3>Put it into practice</h3><p>'+E(s.act||'')+'</p><p><strong>Further reflection:</strong> '+E(d.practice||'')+'</p></div></section>';
 const recap='<section class="section"><div class="recap"><div class="eyebrow-dark">BEFORE MOVING ON</div><h3>Remember the main truth</h3><p class="principle">'+E(d.principle)+'</p><p>Return to the Scripture readings if this teaching is not yet clear. Understanding matters more than speed.</p></div></section>';
 const shell='<article class="lesson-inner">'+intro+'<div class="lesson-body">'+main+analogy+img+ideas+reading+extra+qa+transformationHtml(id)+recap+quizHtml(s)+noteArea(id)+'<div class="page-nav">'+prev+'<a class="btn secondary" href="../#study='+encodeURIComponent(id)+'">Open current GTKJ study ↗</a>'+next+'</div></div></article>';
 content.innerHTML=shell;
 content.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
 const ta=document.getElementById('myNotes');
 ta.addEventListener('input',()=>{state.notes[id]=ta.value;save()});
 const quiz=document.getElementById('quizForm');
 quiz.addEventListener('submit',e=>{e.preventDefault();grade(s,quiz)});
 renderNav();
 document.title=s.title+' — GTKJ Review';
}
function grade(s,form){
 const qs=quizQuestions(s.id);
 let selected=[],missing=[];
 for(let i=0;i<5;i++){
 const checked=form.querySelector('input[name="q'+i+'"]:checked');
 if(!checked)missing.push(i+1);
 selected.push(checked);
 }
 const result=document.getElementById('quizResult');
 if(missing.length){result.className='result bad';result.innerHTML='<strong>Please answer all five questions.</strong><p>Questions still to answer: '+missing.join(', ')+'.</p>';result.scrollIntoView({behavior:'smooth',block:'nearest'});return}
 const wrong=[];selected.forEach((r,i)=>{
 const ok=r.value==='1';
 if(!ok)wrong.push(i);
 const labels=form.querySelectorAll('input[name="q'+i+'"]');
 labels.forEach(el=>{el.closest('.choice').classList.remove('good','bad');if(el.value==='1')el.closest('.choice').classList.add('good');else if(el.checked)el.closest('.choice').classList.add('bad')})
 });
 if(wrong.length){
 result.className='result bad';
 result.innerHTML='<strong>'+ (5-wrong.length)+'/5 correct — review these key ideas</strong><ul>'+wrong.map(i=>'<li><strong>Question '+(i+1)+':</strong> '+E(qs[i][1])+'</li>').join('')+'</ul><p>Revisit the Bible readings and the Becoming More Like Jesus section, change any answers and choose Check my answers again. There is no penalty.</p>';
 }else{
 state.passed[s.id]=true;save();renderNav();
 const idx=ids.indexOf(s.id);
 result.className='result good';
 result.innerHTML='<strong>✓ 5/5 — all answers correct!</strong><p>You have answered the understanding questions correctly. Character transformation grows through trust in Jesus and the Holy Spirit. '+(idx<27?'The next study is now unlocked in learner mode.':'You have completed all 28 study checks!')+'</p>'+(idx<27?'<button type="button" class="btn" id="quizNext">Continue to study '+(idx+2)+' →</button>':'');
 const go=document.getElementById('quizNext');if(go)go.addEventListener('click',()=>navigate(ids[idx+1]));
 }
 result.scrollIntoView({behavior:'smooth',block:'nearest'});
}
reviewer.addEventListener('change',()=>{state.reviewer=reviewer.checked;save();render()});
document.getElementById('exportNotes').addEventListener('click',()=>{
 const notes={};for(const [id,n] of Object.entries(state.notes)){if(ids.includes(id)&&String(n).trim())notes[id]=String(n)}
 const payload={project:'Getting to Know Jesus — educational review',edition:model.version,savedAt:new Date().toISOString(),notes,passed:Object.keys(state.passed).filter(id=>state.passed[id]===true)};
 const obj=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(obj),a=document.createElement('a');
 a.href=url;a.download='GTKJ_Review_Notes.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'})});
render();
})();
