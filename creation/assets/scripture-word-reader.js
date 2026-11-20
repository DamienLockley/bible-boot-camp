/* Creation Word-master Scripture links, English KJV / Tagalog Ang Dating Biblia.
   Word citations are the only per-answer source; no old JSON map is appended. */
(()=>{'use strict';
if(window.__creationWordBibleReader)return;
window.__creationWordBibleReader=true;
const tl=document.documentElement.lang.toLowerCase().startsWith('tl');
const titles=tl?{close:'Isara',loading:'Binubuksan ang talata…',missing:'Hindi makita ang talata sa Biblia.',error:'Hindi mabuksan ang lokal na Biblia.',version:'Ang Dating Biblia (1905)'}:{close:'Close',loading:'Loading Scripture…',missing:'Verse not found in the stored Bible.',error:'Could not open the local Bible.',version:'King James Version (KJV)'};
const enBooks='Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|3 John|1 John|2 John|Jude|Revelation'.split('|');
const tlBooks='Genesis|Exodo|Levitico|Mga Bilang|Deuteronomio|Josue|Mga Hukom|Ruth|1 Samuel|2 Samuel|1 Hari|2 Hari|1 Cronica|2 Cronica|Ezra|Nehemias|Esther|Job|Mga Awit|Mga Kawikaan|Eclesiastes|Awit ng mga Awit|Isaias|Jeremias|Mga Panaghoy|Ezekiel|Daniel|Oseas|Joel|Amos|Obadias|Jonas|Mikas|Nahum|Habacuc|Zefanias|Hagai|Zacarias|Malakias|Mateo|Marcos|Lucas|Juan|Mga Gawa|Roma|1 Corinto|2 Corinto|Galacia|Efeso|Filipos|Colosas|1 Tesalonica|2 Tesalonica|1 Timoteo|2 Timoteo|Tito|Filemon|Hebreo|Santiago|1 Pedro|2 Pedro|3 Juan|1 Juan|2 Juan|Judas|Apocalipsis'.split('|');
const aliases=new Map();enBooks.forEach(b=>aliases.set(b.toLowerCase(),b));tlBooks.forEach((b,i)=>aliases.set(b.toLowerCase(),enBooks[i]));aliases.set('psalm','Psalms');aliases.set('ps','Psalms');aliases.set('awit','Psalms');
const style=document.createElement('style');
style.textContent='.creation-scripture-refs{padding:10px 0 1px;margin-top:12px;border-top:1px solid #dbeaf5;font-size:.94rem;line-height:1.9}.creation-scripture-refs a{color:#136aa8;text-decoration:underline;text-underline-offset:3px;font-weight:650;display:inline-block;padding:2px 1px}.creation-scripture-refs a:hover,.creation-scripture-refs a:focus-visible{color:#064777;background:#e9f6ff;border-radius:4px}.creation-bible-dialog{border:0;border-radius:17px;padding:0;width:min(92vw,690px);max-height:85dvh;box-shadow:0 20px 70px #071b3566;color:#23455b;background:white}.creation-bible-dialog::backdrop{background:rgba(4,22,40,.7)}.creation-bible-inner{padding:23px;overflow:auto;max-height:85dvh}.creation-bible-close{float:right;width:42px;height:42px;font-size:28px;color:#1c6798;background:#fff;border:1px solid #bad2e2;border-radius:8px;cursor:pointer}.creation-bible-verses p{margin:0 0 11px;padding:0 0 11px;border-bottom:1px solid #e5eef5;line-height:1.6}.creation-bible-verses strong{color:#236b9e}.creation-bible-credit{color:#657f91;font-size:.85rem}';
document.head.append(style);
let enPromise=null,metaPromise=null,meta=null;
const parts=new Map();
const json=async url=>{const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status);return r.json();};
async function verse(key){
 key=key.replace(/^Psalm\s+(?=\d+:)/,'Psalms ');
 if(!tl){
  if(!enPromise)enPromise=json('/teachers-guide/kjv-verses.json').catch(err=>{enPromise=null;throw err;});
  return (await enPromise)[key];
 }
 if(!metaPromise)metaPromise=json('/tl/verses.json').then(d=>(meta=d)).catch(err=>{metaPromise=null;throw err;});
 const m=meta||await metaPromise;
 const book=key.match(/^(.+?)\s+\d+:/)?.[1];
 const part=m.bookParts?.[book];
 if(!part)return undefined;
 if(!parts.has(part))parts.set(part,json('/tl/bible/part-'+part+'.json').catch(err=>{parts.delete(part);throw err;}));
 return (await parts.get(part))[key];
}
function expand(ref){
 const m=ref.trim().replace(/[–—−]/g,'-').match(/^(.+?)\s+(\d+)\s*:\s*(.+)$/);
 if(!m)return [];
 const book=aliases.get(m[1].toLowerCase().trim())||m[1],chapter=+m[2],out=[];
 for(const group of m[3].split(/[;,]/)){
  const text=group.trim();
  const full=text.match(/^(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/);
  const simple=text.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!simple&&!full)continue;
  const ch=full?+full[1]:chapter,from=full?+full[2]:+simple[1],to=full?+(full[3]||full[2]):+(simple[2]||simple[1]);
  if(ch<1||from<1||to<from||to-from>150)continue;
  for(let v=from;v<=to&&out.length<300;v++)out.push(`${book} ${ch}:${v}`);
 }
 return [...new Set(out)];
}
let dialog=null,heading=null,body=null,credit=null,serial=0;
function setup(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.className='creation-bible-dialog';
 dialog.innerHTML='<div class="creation-bible-inner"><button type="button" class="creation-bible-close">×</button><h2 class="creation-bible-heading"></h2><div class="creation-bible-verses" aria-live="polite"></div><p class="creation-bible-credit"></p></div>';
 document.body.append(dialog);
 heading=dialog.querySelector('.creation-bible-heading');body=dialog.querySelector('.creation-bible-verses');credit=dialog.querySelector('.creation-bible-credit');
 const close=dialog.querySelector('button');close.setAttribute('aria-label',titles.close);close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
}
document.addEventListener('click',async event=>{
 const link=event.target.closest?.('a[data-scripture-ref]');if(!link)return;
 event.preventDefault();event.stopPropagation();setup();
 const ref=link.dataset.scriptureRef,id=++serial;
 heading.textContent=ref;body.textContent=titles.loading;credit.textContent='';
 if(!dialog.open)dialog.showModal();
 const keys=expand(ref);if(!keys.length){body.textContent=titles.missing;return;}
 try{
  const list=await Promise.all(keys.map(async key=>({key,text:await verse(key)})));
  if(id!==serial||!dialog.open)return;
  body.replaceChildren();
  for(const item of list){const p=document.createElement('p');
   if(item.text){const strong=document.createElement('strong');strong.textContent=item.key+'  ';p.append(strong,document.createTextNode(String(item.text).replace(/^#\s*/,'')));}
   else p.textContent=item.key+' — '+titles.missing;
   body.append(p);
  }
  credit.textContent=titles.version;
 }catch(err){if(id===serial&&dialog.open)body.textContent=titles.error;console.warn('Creation Scripture popup',err);}
});
})();
