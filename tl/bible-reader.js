// Get to Know Jesus — KJV Scripture popup
// Reads the existing local Bible at teachers-guide/kjv-verses.json.
// The Teacher's Guide remains the single source for KJV text.
(()=>{'use strict';
const books='Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation'.split('|');
const shorts='Gen|Ex|Lev|Num|Deut|Josh|Judg|Ruth|1 Sam|2 Sam|1 Kgs|2 Kgs|1 Chron|2 Chron|Ezra|Neh|Est|Job|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|1 Cor|2 Cor|Gal|Eph|Phil|Col|1 Thess|2 Thess|1 Tim|2 Tim|Titus|Philem|Heb|James|1 Pet|2 Pet|1 John|2 John|3 John|Jude|Rev'.split('|');
const aliases=Object.create(null);
const key=x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,'');
books.forEach((name,i)=>{aliases[key(name)]=name;aliases[key(shorts[i])]=name;});
Object.assign(aliases,{psalm:'Psalms',ps:'Psalms',jn:'John',mt:'Matthew',mk:'Mark',lk:'Luke',revelations:'Revelation',songs:'Song of Solomon'});
const tlNames="Genesis|Exodo|Levitico|Mga Bilang|Deuteronomio|Josue|Mga Hukom|Ruth|1 Samuel|2 Samuel|1 Hari|2 Hari|1 Cronica|2 Cronica|Ezra|Nehemias|Esther|Job|Mga Awit|Mga Kawikaan|Ecclesiastes|Awit ng mga Awit|Isaias|Jeremias|Mga Panaghoy|Ezekiel|Daniel|Oseas|Joel|Amos|Obadias|Jonas|Mikas|Nahum|Habacuc|Zefanias|Hagai|Zacarias|Malakias|Mateo|Marcos|Lucas|Juan|Mga Gawa|Roma|1 Corinto|2 Corinto|Galacia|Efeso|Filipos|Colosas|1 Tesalonica|2 Tesalonica|1 Timoteo|2 Timoteo|Tito|Filemon|Hebreo|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis".split('|');tlNames.forEach((name,i)=>{aliases[key(name)]=books[i];aliases[key(name.replace(/^Mga /,''))]=books[i]});
const dialog=document.createElement('dialog');dialog.className='bible-reader-dialog';
dialog.innerHTML='<div class="bible-reader-inner"><button class="bible-reader-close" aria-label="Isara">×</button><h2 id="bibleReaderRef"></h2><div id="bibleReaderText" class="bible-reader-text"></div><p id="bibleReaderCredit" class="bible-reader-credit"></p></div>';
document.body.append(dialog);
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
const heading=dialog.querySelector('#bibleReaderRef'),body=dialog.querySelector('#bibleReaderText'),credit=dialog.querySelector('#bibleReaderCredit');
let biblePromise=null;
function loadBible(){
 if(!biblePromise)biblePromise=fetch('verses.json').then(r=>{if(!r.ok)throw Error('Hindi mabuksan ang talaan ng Biblia');return r.json()})
 .then(async index=>Object.assign({},...(await Promise.all(index.parts.map(async path=>{const r=await fetch(path);if(!r.ok)throw Error(path);return r.json()})))))
 .catch(error=>{biblePromise=null;throw error});
 return biblePromise;
}
// Expands the same verse-key format used in the Teacher's Guide, including
// en/em dashes and comma/semicolon groups: John 3:16, 18; 4:1-3.
function expand(ref, bible){
 const m=String(ref).trim().replace(/[‐‑‒–—−]/g,'-').replace(/：/g,':').match(/^((?:[1-3]\s*)?[a-z]+(?:[ .]+[a-z]+)*\.?)\s*(\d+)\s*(.*)$/i);
 if(!m)return [];
 const book=aliases[key(m[1])];if(!book)return [];
 let chapter=Number(m[2]), tail=m[3].trim(), verses=[];
 const chapterKeys=c=>Object.keys(bible||{}).filter(k=>k.startsWith(book+' '+c+':')).sort((a,b)=>Number(a.split(':').pop())-Number(b.split(':').pop()));
 const append=(c,first,last)=>{if(first<1||last<first||last-first>1000)return;for(let v=first;v<=last;v++)verses.push(book+' '+c+':'+v);};
 const chapters=(a,b)=>{if(a<1||b<a||b-a>150)return;for(let c=a;c<=b;c++)verses.push(...chapterKeys(c));};
 if(!tail){chapters(chapter,chapter);return verses;}
 if(/^-\s*\d+$/.test(tail)){chapters(chapter,Number(tail.slice(1)));return verses;}
 if(!tail.startsWith(':'))return [];
 for(const token of tail.slice(1).split(/\s*[,;]\s*/)){
   const item=token.trim().match(/^(?:(\d+)\s*:\s*)?(\d+)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?$/);
   if(!item)continue;
   if(item[1])chapter=Number(item[1]);
   const first=Number(item[2]),last=Number(item[4]||item[2]),endChapter=Number(item[3]||chapter);
   if(endChapter===chapter)append(chapter,first,last);
   else if(endChapter>chapter&&endChapter-chapter<=150){
     const keys=chapterKeys(chapter);
     if(!keys.length)continue;
     append(chapter,first,Number(keys[keys.length-1].split(':').pop()));
     for(let c=chapter+1;c<endChapter;c++)verses.push(...chapterKeys(c));
     append(endChapter,1,last);
   }
   chapter=endChapter;
 }
 return [...new Set(verses)];
}
let requestNumber=0;
document.addEventListener('click',async event=>{
 const target=event.target.closest('[data-bible-ref]');if(!target)return;
 event.preventDefault();
 const ref=(target.dataset.bibleRef||'').trim(),id=++requestNumber;
 heading.textContent=ref;body.textContent='Binubuksan ang Kasulatan…';credit.textContent='';
 if(!dialog.open)dialog.showModal();
 try{
  const bible=await loadBible();if(id!==requestNumber||!dialog.open)return;
  const refs=expand(ref,bible);
  if(!refs.length){body.textContent='Hindi maunawaan ang reperensiya. Suriin ang pagkakasulat nito.';return;}

  const found=refs.filter(r=>Object.prototype.hasOwnProperty.call(bible,r));
  if(!found.length)throw Error('Walang katugmang talata sa lokal na Biblia');
  body.replaceChildren();
  for(const verse of refs){
   const p=document.createElement('p');
   if(Object.prototype.hasOwnProperty.call(bible,verse)){
    const label=document.createElement('strong');label.textContent=verse+'  ';p.append(label,document.createTextNode(String(bible[verse]).replace(/^#\s*/,'')));
   }else{p.textContent=verse+' — hindi natagpuan sa lokal na Biblia';}
   body.append(p);
  }
  credit.textContent='Ang Dating Biblia (1905) · Lokal na teksto';
 }catch(err){if(id!==requestNumber||!dialog.open)return;
  body.textContent='Hindi mabuksan ang talata. Suriin ang lokal na mga file ng Biblia at i-reload ang pahina.';
  credit.textContent=err.message||String(err);
 }
});
})();

(()=>{const names="Genesis|Exodo|Levitico|Mga Bilang|Deuteronomio|Josue|Mga Hukom|Ruth|1 Samuel|2 Samuel|1 Hari|2 Hari|1 Cronica|2 Cronica|Ezra|Nehemias|Esther|Job|Mga Awit|Mga Kawikaan|Ecclesiastes|Awit ng mga Awit|Isaias|Jeremias|Mga Panaghoy|Ezekiel|Daniel|Oseas|Joel|Amos|Obadias|Jonas|Mikas|Nahum|Habacuc|Zefanias|Hagai|Zacarias|Malakias|Mateo|Marcos|Lucas|Juan|Mga Gawa|Roma|1 Corinto|2 Corinto|Galacia|Efeso|Filipos|Colosas|1 Tesalonica|2 Tesalonica|1 Timoteo|2 Timoteo|Tito|Filemon|Hebreo|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis".split('|').concat('Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Psalms|Proverbs|Isaiah|Jeremiah|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Revelation'.split('|'));
 const rx=new RegExp('(?:'+names.sort((a,b)=>b.length-a.length).join('|')+')\\s+\\d{1,3}(?::\\s*\\d+(?:[–−-]\\d+)?)?','g');
 function link(){for(const parent of document.querySelectorAll('#main p,#main .answer,article p')){const walker=document.createTreeWalker(parent,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){if(node.parentElement.closest('button,a,script,style,textarea,input'))continue;const text=node.textContent;rx.lastIndex=0;let m,last=0,frag=document.createDocumentFragment(),found=false;while((m=rx.exec(text))){found=true;frag.append(text.slice(last,m.index));const b=document.createElement('button');b.type='button';b.className='verse-link';b.dataset.bibleRef=m[0];b.textContent=m[0];frag.append(b);last=rx.lastIndex}if(found){frag.append(text.slice(last));node.replaceWith(frag)}}}}
 let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;link()})}).observe(document.querySelector('#main')||document.querySelector('article'),{childList:true,subtree:true});link();})();
