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
const dialog=document.createElement('dialog');dialog.className='bible-reader-dialog';
dialog.innerHTML='<div class="bible-reader-inner"><button class="bible-reader-close" aria-label="Close">×</button><h2 id="bibleReaderRef"></h2><div id="bibleReaderText" class="bible-reader-text"></div><p id="bibleReaderCredit" class="bible-reader-credit"></p></div>';
document.body.append(dialog);
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
const heading=dialog.querySelector('#bibleReaderRef'),body=dialog.querySelector('#bibleReaderText'),credit=dialog.querySelector('#bibleReaderCredit');
let biblePromise=null;
function loadBible(){
 if(!biblePromise)biblePromise=fetch('teachers-guide/kjv-verses.json',{cache:'default'})
   .then(r=>{if(!r.ok)throw Error('Local KJV file not available (HTTP '+r.status+')');return r.json()})
   .then(data=>{if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Unexpected local KJV format');return data})
   .catch(error=>{biblePromise=null;throw error});
 return biblePromise;
}
// Expands the same verse-key format used in the Teacher's Guide, including
// en/em dashes and comma/semicolon groups: John 3:16, 18; 4:1-3.
function expand(ref){
 const m=ref.trim().replace(/[–—−]/g,'-').match(/^(.+?)\.?\s+(\d+)\s*[:：]\s*(.+)$/);
 if(!m)return [];
 const book=aliases[key(m[1])];if(!book)return [];
 let chapter=Number(m[2]),out=[],count=0;
 for(const chunk of m[3].split(';')){
  for(const item of chunk.split(',')){
   const p=item.trim();if(!p)continue;
   const c=p.match(/^(\d+)\s*[:：]\s*(\d+)(?:\s*-\s*(\d+))?$/);
   const v=p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
   if(!c&&!v)continue;
   if(c)chapter=Number(c[1]);
   const first=Number(c?c[2]:v[1]),last=Number((c?c[3]:v[2])||(c?c[2]:v[1]));
   if(chapter<1||first<1||last<first||last-first>150)continue;
   for(let n=first;n<=last&&count<300;n++,count++)out.push(`${book} ${chapter}:${n}`);
  }
 }
 return [...new Set(out)];
}
let requestNumber=0;
document.addEventListener('click',async event=>{
 const target=event.target.closest('[data-bible-ref]');if(!target)return;
 event.preventDefault();
 const ref=(target.dataset.bibleRef||'').trim(),id=++requestNumber;
 heading.textContent=ref;body.textContent='Loading Scripture…';credit.textContent='';
 if(!dialog.open)dialog.showModal();
 const refs=expand(ref);
 if(!refs.length){body.textContent='This Scripture reference could not be interpreted. Please check the reference.';return;}
 try{
  const bible=await loadBible();if(id!==requestNumber||!dialog.open)return;
  const found=refs.filter(r=>Object.prototype.hasOwnProperty.call(bible,r));
  if(!found.length)throw Error('No matching verses were found in the local KJV file');
  body.replaceChildren();
  for(const verse of refs){
   const p=document.createElement('p');
   if(Object.prototype.hasOwnProperty.call(bible,verse)){
    const label=document.createElement('strong');label.textContent=verse+'  ';p.append(label,document.createTextNode(String(bible[verse]).replace(/^#\s*/,'')));
   }else{p.textContent=verse+' — not found in the stored KJV';}
   body.append(p);
  }
  credit.textContent='King James Version (KJV) · Local Bible text';
 }catch(err){if(id!==requestNumber||!dialog.open)return;
  body.textContent='This passage could not be loaded from the local Bible file. Check that teachers-guide/kjv-verses.json is present, then reload the page.';
  credit.textContent=err.message||String(err);
 }
});
})();
