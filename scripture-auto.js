/* Automatic Bible-reference linking for End Time Bible Studies sites.
   Works with dynamically rendered study text, and skips existing hyperlinks.
   Source Bibles: /teachers-guide/kjv-verses.json and /tl/verses.json. */
(()=>{'use strict';
if(window.__ETBS_AUTO_SCRIPTURE__)return;
window.__ETBS_AUTO_SCRIPTURE__=true;
const tagalog=(document.documentElement.lang||'').toLowerCase().startsWith('tl') || location.pathname.split('/').includes('tl');
const en='Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation'.split('|');
const tl='Genesis|Exodo|Levitico|Mga Bilang|Deuteronomio|Josue|Mga Hukom|Ruth|1 Samuel|2 Samuel|1 Hari|2 Hari|1 Cronica|2 Cronica|Ezra|Nehemias|Esther|Job|Mga Awit|Mga Kawikaan|Eclesiastes|Awit ng mga Awit|Isaias|Jeremias|Mga Panaghoy|Ezekiel|Daniel|Oseas|Joel|Amos|Obadias|Jonas|Mikas|Nahum|Habacuc|Zefanias|Hagai|Zacarias|Malakias|Mateo|Marcos|Lucas|Juan|Mga Gawa|Roma|1 Corinto|2 Corinto|Galacia|Efeso|Filipos|Colosas|1 Tesalonica|2 Tesalonica|1 Timoteo|2 Timoteo|Tito|Filemon|Hebreo|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis'.split('|');
const aliases=new Map();en.forEach(name=>aliases.set(name.toLowerCase(),name));tl.forEach((name,i)=>{if(en[i])aliases.set(name.toLowerCase(),en[i]);});
Object.entries({'psalm':'Psalms','ps':'Psalms','gen':'Genesis','ex':'Exodus','lev':'Leviticus','deut':'Deuteronomy','neh':'Nehemiah','jn':'John','jhn':'John','rev':'Revelation','revelations':'Revelation','matt':'Matthew','mt':'Matthew','lk':'Luke','rom':'Romans','isa':'Isaiah','1 cor':'1 Corinthians','2 cor':'2 Corinthians','1 pet':'1 Peter','2 pet':'2 Peter','1 tim':'1 Timothy','2 tim':'2 Timothy','1 thess':'1 Thessalonians','2 thess':'2 Thessalonians','acts':'Acts','heb':'Hebrews','phil':'Philippians','eccl':'Ecclesiastes','prov':'Proverbs','dan':'Daniel','ezek':'Ezekiel'}).forEach(([k,v])=>aliases.set(k,v));
tl.forEach((name,i)=>aliases.set(name.toLowerCase().replace(/^mga /,''),en[i]));
Object.entries({"solomon's song":"Song of Solomon","song of songs":"Song of Solomon","awit":"Psalms","pahayag":"Revelation","mga taga-roma":"Romans","1 mga hari":"1 Kings","2 mga hari":"2 Kings","mga hebreo":"Hebrews","mga taga-efeso":"Ephesians"}).forEach(([a,b])=>aliases.set(a,b));
const shorts='Gen|Ex|Lev|Num|Deut|Josh|Judg|Ruth|1 Sam|2 Sam|1 Kgs|2 Kgs|1 Chron|2 Chron|Ezra|Neh|Est|Job|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|1 Cor|2 Cor|Gal|Eph|Phil|Col|1 Thess|2 Thess|1 Tim|2 Tim|Titus|Philem|Heb|James|1 Pet|2 Pet|1 John|2 John|3 John|Jude|Rev'.split('|');
shorts.forEach((name,i)=>aliases.set(name.toLowerCase(),en[i]));
for(const [name,book] of [...aliases]){
  const numbered=/^([123]) (.+)$/.exec(name);
  if(!numbered)continue;
  aliases.set(numbered[1]+numbered[2],book);
  aliases.set(['first','second','third'][Number(numbered[1])-1]+' '+numbered[2],book);
}
Object.entries({sofonias:'Zephaniah',mat:'Matthew',luk:'Luke',joh:'John',ecc:'Ecclesiastes',
  eze:'Ezekiel',roman:'Romans',jud:'Judges','1 thes':'1 Thessalonians','2 thes':'2 Thessalonians',
  '1 corinthains':'1 Corinthians',phillipians:'Philippians',galations:'Galatians'}).forEach(([name,book])=>aliases.set(name,book));
const chapters={"Genesis":[31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],"Exodus":[22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],"Leviticus":[17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],"Numbers":[54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],"Deuteronomy":[46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],"Joshua":[18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],"Judges":[36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],"Ruth":[22,23,18,22],"1 Samuel":[28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13],"2 Samuel":[27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],"1 Kings":[53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],"2 Kings":[18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],"1 Chronicles":[54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],"2 Chronicles":[17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],"Ezra":[11,70,13,24,17,22,28,36,15,44],"Nehemiah":[11,20,32,23,19,19,73,18,38,39,36,47,31],"Esther":[22,23,15,17,14,14,10,17,32,3],"Job":[22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17],"Psalms":[6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],"Proverbs":[33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],"Ecclesiastes":[18,26,22,16,20,12,29,17,18,20,10,14],"Isaiah":[31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],"Jeremiah":[19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],"Lamentations":[22,22,66,22,22],"Ezekiel":[28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],"Daniel":[21,49,30,37,31,28,28,27,27,21,45,13],"Hosea":[11,23,5,19,15,11,16,14,17,15,12,14,16,9],"Joel":[20,32,21],"Amos":[15,16,15,13,27,14,17,14,15],"Obadiah":[21],"Jonah":[17,10,10,11],"Micah":[16,13,12,13,15,16,20],"Nahum":[15,13,19],"Habakkuk":[17,20,19],"Zephaniah":[18,15,20],"Haggai":[15,23],"Zechariah":[21,13,10,14,11,15,14,23,17,12,17,14,9,21],"Malachi":[14,17,18,6],"Matthew":[25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],"Mark":[45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],"Luke":[80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],"John":[51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],"Acts":[26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],"Romans":[32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],"1 Corinthians":[31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24],"2 Corinthians":[24,17,18,18,21,18,16,24,15,18,33,21,14],"Galatians":[24,21,29,31,26,18],"Ephesians":[23,22,21,32,33,24],"Philippians":[30,30,21,23],"Colossians":[29,23,25,18],"1 Thessalonians":[10,20,13,18,28],"2 Thessalonians":[12,17,18],"1 Timothy":[20,15,16,16,25,21],"2 Timothy":[18,26,17,22],"Titus":[16,15,15],"Philemon":[25],"Hebrews":[14,18,19,16,14,20,28,13,28,39,40,29,25],"James":[27,26,18,17,20],"1 Peter":[25,25,22,19,14],"2 Peter":[21,22,18],"1 John":[10,29,24,21,21],"2 John":[13],"3 John":[14],"Jude":[25],"Revelation":[20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21],"Song of Solomon":[17,17,11,16,16,13,13,14]};
if(tagalog)chapters['3 John']=[15];
const counts={};
for(const [book, sizes] of Object.entries(chapters))sizes.forEach((n,i)=>counts[book+" "+(i+1)]=n);
  const names = [...aliases.keys()].sort((a, b) => b.length - a.length)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')).join('|');
  const dash = '[-‐‑‒–—−]';
  const number = '\\d{1,3}(?!\\d)';
  const chapter = number + '\\s*[:：]\\s*';
  const span = number + '(?:\\s*' + dash + '\\s*(?:' + chapter + ')?' + number + ')?';
  const singleChapter = 'Obadiah|Obadias|Filemon|Judas|2\\s+Juan|3\\s+Juan|Philemon|2\\s+John|3\\s+John|Jude';
  const starts = '(?<![\\w:])(?:(' + names + ')\\.?\\s*(' + chapter + ')|('
    + singleChapter + ')\\s+|(?:(?<=\\()|(?<=\\bin )|(?<=\\bat )|(?<=\\bsa )|(?<=\\bsee )|(?<=\\bcompare ))(' + chapter + '))';
  const citation = new RegExp(starts + '(' + span + ')(?!\\w)', 'gi');
  const continuation = new RegExp('^(?:\\s*[,;]\\s*|\\s+(?:and|at)\\s+(?=' + chapter
    + '|' + span + '(?=\\s*(?:$|[).,;!?])))' + ')(' + chapter + ')?(' + span + ')(?!\\w|\\s*:)', 'i');
  const nextBook = new RegExp('^\\s*[,;]\\s*(?:' + names + ')\\.?\\s*' + number, 'i');
  const verseSpan = new RegExp('^(' + number + ')(?:\\s*' + dash
    + '\\s*(?:(' + number + ')\\s*:\\s*)?(' + number + '))?$');

  function expand(book, firstChapter, spanText) {
    const match = verseSpan.exec(spanText);
    if (!match) return [];
    const start = Number(match[1]);
    const lastChapter = Number(match[2] || firstChapter);
    const end = Number(match[3] || start);
    if (start < 1 || end < 1 || lastChapter < firstChapter ||
        start > (counts[book + ' ' + firstChapter] || 0) ||
        end > (counts[book + ' ' + lastChapter] || 0) ||
        (firstChapter === lastChapter && end < start)) return [];
    const verses = [];
    for (let ch = firstChapter; ch <= lastChapter; ch++) {
      const first = ch === firstChapter ? start : 1;
      const last = ch === lastChapter ? end : counts[book + ' ' + ch];
      for (let verse = first; verse <= last; verse++) verses.push(book + ' ' + ch + ':' + verse);
    }
    return verses;
  }

  function find(text, contextBook) {
    const matches = [];
    let end = 0;
    for (const match of text.matchAll(citation)) {
      if (match.index < end) continue;
      const book = match[1] || match[3]
        ? aliases.get((match[1] || match[3]).toLowerCase().replace(/\s+/g, ' '))
        : contextBook;
      if (!book) continue;
      let ch = parseInt(match[2] || match[4] || '1', 10);
      const verses = expand(book, ch, match[5]);
      if (!verses.length) continue;
      ch = Number(verses[verses.length-1].match(/ (\d+):\d+$/)[1]);
      let nextEnd = match.index + match[0].length;
      if (!match[1] && !match[4] && counts[book + ' 2']) continue;
      for (let next; !nextBook.test(text.slice(nextEnd)) &&
          (next = continuation.exec(text.slice(nextEnd)));) {
        const nextChapter = next[1] ? parseInt(next[1], 10) : ch;
        const more = expand(book, nextChapter, next[2]);
        if (!more.length) break;
        ch = Number(more[more.length-1].match(/ (\d+):\d+$/)[1]);
        verses.push(...more);
        nextEnd += next[0].length;
      }
      if (match[4] && text[match.index - 1] === '(' && !/^\s*\)/.test(text.slice(nextEnd))) continue;
      end = nextEnd;
      matches.push({from: match.index, to: end, verses: [...new Set(verses)]});
    }
    return matches;
  }

const css=document.createElement('style');css.textContent='.etbs-verse-link{color:#136aa8;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;cursor:pointer;font-weight:600}.etbs-verse-link:focus-visible{outline:2px solid #1b70aa;outline-offset:2px}.etbs-verse-dialog{border:0;border-radius:17px;width:min(92vw,700px);max-height:85dvh;padding:0;background:#fff;color:#19394b;box-shadow:0 18px 68px #061a3566}.etbs-verse-dialog::backdrop{background:#061826b8}.etbs-verse-inner{max-height:85dvh;overflow:auto;padding:24px}.etbs-verse-close{float:right;border:1px solid #bad1df;background:white;border-radius:9px;color:#154d6f;font-size:26px;min-width:42px;min-height:42px;cursor:pointer}.etbs-verse-text p{border-bottom:1px solid #e6edf1;padding:0 0 11px;margin:0 0 11px;line-height:1.6}.etbs-verse-text strong{color:#1b6797}.etbs-verse-credit{color:#587487;font-size:.88rem}';document.head.append(css);
const ignore='dialog,.kjv,.versetable,a,button,input,textarea,select,option,script,style,code,pre,[contenteditable],.creation-scripture-refs,.bible-reader-dialog,.creation-bible-dialog,.etbs-verse-dialog,[data-scripture-ref],[data-bible-ref],[data-scripture],[data-auto-scripture-skip]';
const selectors=['main','#main','#body','#readerPane','#preview','article','.study-content','.lesson-content','.reader-body','#study','.answer', '.chapter'];
function isAllowed(node){const e=node.parentElement;if(!e||e.closest(ignore))return false;return !!e.closest(selectors.join(','));}
const contextBook=location.pathname.includes('/daniel/')?'Daniel':location.pathname.includes('/revelation/')?'Revelation':undefined;
function linkText(node){
  if(!isAllowed(node))return;
  const text=node.nodeValue;
  const refs=find(text,contextBook);
  if(!refs.length)return;
  const fragment=document.createDocumentFragment();
  let cursor=0;
  for(const ref of refs){
    fragment.append(text.slice(cursor,ref.from));
    const link=document.createElement('a');
    link.className='etbs-verse-link';
    link.href='#';
    link.dataset.autoScriptureRef=ref.verses.join('|');
    link.textContent=text.slice(ref.from,ref.to);
    fragment.append(link);
    cursor=ref.to;
  }
  fragment.append(text.slice(cursor));
  node.replaceWith(fragment);
}
function restorePartialLinks(root){
  // Some original readers linked just the first verse before a continuation.
  const selector='button.inline-ref[data-ref],a[data-bible-ref],.bible-ref';
  for(const link of root.querySelectorAll(selector)){
    const tail=link.nextSibling;
    const label=link.textContent;
    const suffix=tail?.nodeType===3?tail.nodeValue:'';
    const match=find(label+suffix,contextBook)[0];
    if(!match || match.from!==0 || !(match.to!==label.length || (tagalog && contextBook==='Daniel')))continue;
    const text=document.createTextNode(label+suffix);
    if(suffix)tail.remove();
    const parent=link.parentNode;
    link.replaceWith(text);
    parent.normalize();
  }
}
const queue=new Set();let scheduled=false;function schedule(root){if(root&&root.nodeType===1||root&&root.nodeType===3)queue.add(root);if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;for(const el of queue){if(el.nodeType===3){linkText(el);continue;}if(!el.isConnected||el.closest?.(ignore))continue;restorePartialLinks(el);const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(linkText);}queue.clear();});}
const scope=document.body;
schedule(scope);const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')schedule(r.target);for(const node of r.addedNodes)schedule(node);}});observer.observe(scope,{subtree:true,childList:true,characterData:true});
let english=null,enPromise=null,metadata=null,metaPromise=null;const partCache=new Map(),partPromises=new Map();
const json=async u=>{const r=await fetch(u);if(!r.ok)throw Error('HTTP '+r.status);return r.json();};
async function verse(key){if(!tagalog){if(!enPromise)enPromise=json('/teachers-guide/kjv-verses.json').then(x=>(english=x)).catch(e=>{enPromise=null;throw e});return (english||await enPromise)[key.replace(/^Song of Solomon /,"Solomon's Song ")];}if(!metaPromise)metaPromise=json('/tl/verses.json').then(x=>(metadata=x)).catch(e=>{metaPromise=null;throw e});const m=metadata||await metaPromise;const book=key.match(/^(.+?)\s+\d+:/)?.[1],part=m.bookParts[book];if(!part)return undefined;if(!partPromises.has(part))partPromises.set(part,json('/tl/bible/part-'+part+'.json').then(v=>{partCache.set(part,v);return v}).catch(e=>{partPromises.delete(part);throw e}));return (partCache.get(part)||await partPromises.get(part))[key];}
let dialog=null,request=0;function setup(){if(dialog)return;dialog=document.createElement('dialog');dialog.className='etbs-verse-dialog';dialog.innerHTML='<div class="etbs-verse-inner"><button type="button" class="etbs-verse-close" aria-label="Close">×</button><h2 class="etbs-verse-heading"></h2><div class="etbs-verse-text" aria-live="polite"></div><p class="etbs-verse-credit"></p></div>';document.body.append(dialog);dialog.querySelector('button').setAttribute('aria-label',tagalog?'Isara':'Close');dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};}
document.addEventListener('click',async e=>{
 const a=e.target.closest?.('[data-auto-scripture-ref],[data-bible-ref],[data-scripture-ref],button[data-ref],.bible-ref');
 if(!a)return;
 let keys=a.dataset.autoScriptureRef?.split('|');
 if(!keys){
   let ref=(a.dataset.bibleRef||a.dataset.scriptureRef||a.dataset.ref||a.textContent).trim();
   if(/^\d+\s*:/.test(ref) && a.closest('.time-links')){
     for(let prev=a.previousElementSibling;prev;prev=prev.previousElementSibling){
       const named=/^(.+?)\s+\d/.exec(prev.dataset.ref||'');
       if(named){ref=named[1]+' '+ref;break;}
     }
   }
   const match=find(ref,contextBook)[0];
   if(match && match.from===0 && match.to===ref.length)keys=match.verses;
   else {
     const whole=/^((?:[123]\s*)?[a-z]+(?:[ .'-]+[a-z]+)*?)\.?\s*(\d+)(?:\s*[-‐‑‒–—−]\s*(\d+))?$/i.exec(ref);
     if(!whole)return;
     const book=aliases.get(whole[1].toLowerCase().replace(/\s+/g,' '));
     const first=+whole[2], last=+(whole[3]||first);
     if(!counts[book+' '+first]||!counts[book+' '+last]||last<first)return;
     keys=[];
     for(let ch=first;ch<=last;ch++)for(let v=1;v<=counts[book+' '+ch];v++)keys.push(book+' '+ch+':'+v);
   }
 }
 e.preventDefault();e.stopPropagation();setup();
 const n=++request,title=dialog.querySelector('.etbs-verse-heading'),area=dialog.querySelector('.etbs-verse-text'),credit=dialog.querySelector('.etbs-verse-credit');title.textContent=a.textContent;area.textContent=tagalog?'Kinukuha ang talata…':'Loading Scripture…';credit.textContent='';if(!dialog.open)dialog.showModal();try{const values=await Promise.all(keys.map(async key=>({key,text:await verse(key)})));if(n!==request||!dialog.open)return;area.replaceChildren();for(const {key,text} of values){const p=document.createElement('p');if(text){const b=document.createElement('strong');b.textContent=key+'  ';p.append(b,document.createTextNode(String(text).replace(/^#\s*/,'')));}else{p.textContent=key+' — '+(tagalog?'Hindi matagpuan ang talata':'Verse unavailable');}area.append(p);}credit.textContent=tagalog?'Ang Dating Biblia (1905)':'King James Version (KJV)';}catch(err){if(n===request&&dialog.open)area.textContent=tagalog?'Hindi mabuksan ang talata.':'Unable to load the verse.';console.warn('Automatic Scripture',err);}},true);
})();