/* Creation study Scripture references. Shared by English and Tagalog study pages.
   Verse text comes from the existing Bible files in this repository. */
(()=>{'use strict';
const items=[...document.querySelectorAll('#questions > details.qa')];
if(!items.length)return;
const tl=document.documentElement.lang.toLowerCase().startsWith('tl');
const root='/creation/assets/';
const locale=tl?{
 close:'Isara',loading:'Kinukuha ang talata…',error:'Hindi mabuksan ang talata. Subukang muli.',notFound:'Hindi makita ang talatang ito sa nakaimbak na Biblia.',version:'Ang Dating Biblia (1905)',
}:{close:'Close',loading:'Loading Scripture…',error:'Unable to load the Bible text. Please try again.',notFound:'Verse not found in the stored Bible.',version:'King James Version (KJV)'};
const css=document.createElement('link');css.rel='stylesheet';css.href=root+'scripture-links.css?v=2';document.head.append(css);
let englishBible=null,englishRequest=null,parts=null,partsRequest=new Map(),metaRequest=null;
const getJson=async url=>{const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status+': '+url);return r.json();};
async function readVerse(key){
 key=key.replace(/^Psalm\s+(?=\d+:)/,'Psalms ');
 if(!tl){
  if(!englishRequest)englishRequest=getJson('/teachers-guide/kjv-verses.json').then(d=>(englishBible=d)).catch(e=>{englishRequest=null;throw e});
  const b=englishBible||await englishRequest;return b[key];
 }
 if(!metaRequest)metaRequest=getJson('/tl/verses.json').catch(e=>{metaRequest=null;throw e});
 const meta=await metaRequest;
 const book=key.match(/^(.+?)\s+\d+:/)?.[1];
 const number=meta.bookParts?.[book];
 if(!number)return undefined;
 if(!parts)parts=new Map();
 if(!parts.has(number)){
  if(!partsRequest.has(number))partsRequest.set(number,getJson('/tl/bible/part-'+number+'.json').then(d=>{parts.set(number,d);return d}).catch(e=>{partsRequest.delete(number);throw e}));
  await partsRequest.get(number);
 }
 return parts.get(number)?.[key];
}
function expand(ref){
 const match=ref.trim().replace(/[–—−]/g,'-').match(/^(.+?)\s+(\d+)\s*:\s*(.+)$/);
 if(!match)return [];
 const book=match[1],out=[];let chapter=Number(match[2]);
 for(const group of match[3].split(/[;,]/)){
  const t=group.trim();if(!t)continue;
  const changed=t.match(/^(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/);
  const same=t.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!changed&&!same)continue;
  if(changed)chapter=Number(changed[1]);
  const from=Number(changed?changed[2]:same[1]),to=Number((changed?changed[3]:same[2])||(changed?changed[2]:same[1]));
  if(!chapter||!from||to<from||to-from>150)continue;
  for(let v=from;v<=to&&out.length<300;v++)out.push(book+' '+chapter+':'+v);
 }
 return [...new Set(out)];
}
const dialog=document.createElement('dialog');dialog.className='creation-bible-dialog';
dialog.innerHTML='<div class="creation-bible-inner"><button type="button" class="creation-bible-close" aria-label="Close">×</button><h2 class="creation-bible-heading"></h2><div class="creation-bible-verses" aria-live="polite"></div><p class="creation-bible-credit"></p></div>';
document.body.append(dialog);
const heading=dialog.querySelector('.creation-bible-heading'),verses=dialog.querySelector('.creation-bible-verses'),credit=dialog.querySelector('.creation-bible-credit');
dialog.querySelector('.creation-bible-close').setAttribute('aria-label',locale.close);
dialog.querySelector('.creation-bible-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
let request=0;
document.addEventListener('click',async event=>{
 const link=event.target.closest('a[data-scripture-ref]');if(!link)return;
 event.preventDefault();const ref=link.dataset.scriptureRef,id=++request;
 heading.textContent=ref;verses.textContent=locale.loading;credit.textContent='';
 if(!dialog.open)dialog.showModal();
 const refs=expand(ref);if(!refs.length){verses.textContent=locale.notFound;return;}
 try{
  const values=await Promise.all(refs.map(async key=>({key,text:await readVerse(key)})));
  if(id!==request||!dialog.open)return;
  verses.replaceChildren();
  for(const {key,text} of values){const p=document.createElement('p');
   if(text){const strong=document.createElement('strong');strong.textContent=key+'  ';p.append(strong,document.createTextNode(String(text).replace(/^#\s*/,'')));}
   else p.textContent=key+' — '+locale.notFound;
   verses.append(p);
  }
  credit.textContent=locale.version;
 }catch(err){if(id===request&&dialog.open)verses.textContent=locale.error;console.warn('Creation Bible reference:',err);}
});
const topic=decodeURIComponent(location.pathname.split('/').pop()).replace(/\.html$/,'');
getJson(root+'scripture-refs.json?v=2').then(map=>{
 const sets=map[topic];if(!sets||sets.length!==items.length){console.warn('Creation Scripture alignment mismatch',topic,sets?.length,items.length);return;}
 items.forEach((detail,i)=>{
  const refs=sets[i];if(!refs||!refs.length)return;
  const answer=detail.querySelector('.answer');if(!answer)return;
  const para=document.createElement('div');para.className='creation-scripture-refs';
  refs.forEach((ref,j)=>{
   if(j)para.append(document.createTextNode('; '));
   const a=document.createElement('a');a.href='#scripture';a.dataset.scriptureRef=ref;a.textContent=ref;
   a.setAttribute('aria-label',ref+(tl?' — buksan ang talata':' — open Bible verse'));
   para.append(a);
  });
  answer.append(para);
 });
}).catch(e=>console.warn('Creation Scripture references unavailable',e));
})();