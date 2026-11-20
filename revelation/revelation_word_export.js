/* Revelation study: generate a complete, editable DOCX in the browser from
   the source KJV JSON and the visible narrative. No external JS library needed.
   Uses a simple ZIP (STORE) writer with CRC32 and fully valid WordprocessingML. */
(()=>{'use strict';
const btn=document.getElementById('export-kjv-word'), feedback=document.getElementById('export-status');
if(!btn||!feedback)return;
const xmlEscape=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const enc=new TextEncoder(), utf=s=>enc.encode(s);
const u16=n=>Uint8Array.of(n&255,(n>>>8)&255), u32=n=>Uint8Array.of(n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255);
const concat=items=>{const size=items.reduce((n,x)=>n+x.length,0),out=new Uint8Array(size);let off=0;for(const x of items){out.set(x,off);off+=x.length;}return out};
const CRC_TABLE=(()=>{let a=[];for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;a[i]=c>>>0;}return a})();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function zip(files){
 const locals=[],centers=[];let pos=0;
 for(const [name,content] of Object.entries(files)){
  const n=utf(name),b=typeof content==='string'?utf(content):content,crc=crc32(b);
  const h=concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(b.length),u32(b.length),u16(n.length),u16(0),n,b]);
  locals.push(h);
  centers.push(concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(b.length),u32(b.length),u16(n.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(pos),n]));
  pos+=h.length;
 }
 const center=concat(centers),trailer=concat([u32(0x06054b50),u16(0),u16(0),u16(centers.length),u16(centers.length),u32(center.length),u32(pos),u16(0)]);
 return concat([...locals,center,trailer]);
}
const relMap=new Map();
function rel(url){if(!relMap.has(url))relMap.set(url,'rId'+(relMap.size+1));return relMap.get(url);}
function textRun(s,bold=false){if(!s)return '';return '<w:r>'+(bold?'<w:rPr><w:b/></w:rPr>':'')+'<w:t xml:space="preserve">'+xmlEscape(s)+'</w:t></w:r>';}
function linkRun(s,url){return '<w:hyperlink r:id="'+rel(url)+'"><w:r><w:rPr><w:color w:val="176DA0"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">'+xmlEscape(s)+'</w:t></w:r></w:hyperlink>';}
let paragraphs=[],countVerses=0;
function add(s,style='Normal',opts={}){
 if(!String(s||'').trim())return;
 const pPr=style==='Normal'?'':'<w:pPr><w:pStyle w:val="'+style+'"/>'+(opts.breakBefore?'<w:pageBreakBefore/>':'')+'</w:pPr>';
 paragraphs.push('<w:p>'+pPr+textRun(s)+'</w:p>');
}
function addLink(label,url,style='Normal'){
 const pPr=style==='Normal'?'':'<w:pPr><w:pStyle w:val="'+style+'"/></w:pPr>';
 paragraphs.push('<w:p>'+pPr+linkRun(label,url)+'</w:p>');
}
function addVerse(ref,body){
 paragraphs.push('<w:p><w:pPr><w:pStyle w:val="Verse"/></w:pPr>'+linkRun(ref,'https://www.biblegateway.com/passage/?search='+encodeURIComponent(ref)+'&version=KJV')+textRun('  '+String(body).replace(/^#\s*/,''))+'</w:p>');countVerses++;
}
function appendStudyCard(card){
 const heading=card.querySelector('h3');if(heading)add(heading.textContent.trim(),'Heading2');
 for(const el of [...card.children]){
  if(el.tagName==='P' && !el.classList.contains('range') && !el.classList.contains('refs') && !el.classList.contains('direct-sources')){
   add(el.textContent.trim());
  }else if(el.classList.contains('application')){
   add('Living the message','Heading3');for(const p of el.querySelectorAll('p'))add(p.textContent.trim());
  }else if(el.classList.contains('source-trail')){
   add(el.textContent.trim(),'SmallText');
  }
 }
 const refs=card.querySelectorAll(':scope > p.refs a[data-bible-ref]');
 if(refs.length){add('Related Scripture passages','Heading3');for(const a of refs)addLink(a.textContent.trim(),a.href,'SmallText');}
 const source=card.querySelectorAll(':scope > p.direct-sources a');
 if(source.length){add('Source readings','Heading3');for(const a of source)addLink(a.textContent.trim(),a.href,'SmallText');}
}
const MINIMAL_STYLES=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/></w:rPr><w:pPr><w:spacing w:after="120" w:line="280" w:lineRule="auto"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="300"/></w:pPr><w:rPr><w:b/><w:color w:val="173953"/><w:sz w:val="60"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="1A5179"/><w:sz w:val="35"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="230" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="1A5179"/><w:sz w:val="27"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="170" w:after="90"/></w:pPr><w:rPr><w:b/><w:color w:val="345F7A"/><w:sz w:val="23"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Verse"><w:name w:val="Verse"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="75" w:line="280" w:lineRule="auto"/><w:ind w:left="200"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="SmallText"><w:name w:val="Source Note"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="18"/></w:rPr><w:pPr><w:spacing w:after="70"/></w:pPr></w:style></w:styles>`;
function composeDocx(){
 const rels=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'];
 for(const [url,id] of relMap.entries())rels.push('<Relationship Id="'+id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="'+xmlEscape(url)+'" TargetMode="External"/>');
 rels.push('<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'+paragraphs.join('')+'<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1100" w:right="1150" w:bottom="1100" w:left="1150" w:header="550" w:footer="550" w:gutter="0"/></w:sectPr></w:body></w:document>';
 return zip({
  '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
  '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>',
  'docProps/core.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Revelation — Complete KJV Narrative Study</dc:title><dc:description>Based on the KJV JSON supplied from DamienLockley/bible-boot-camp</dc:description></cp:coreProperties>',
  'word/document.xml':xml,'word/_rels/document.xml.rels':rels.join(''),'word/styles.xml':MINIMAL_STYLES
 });
}
function refsForScene(card){const ref=card.dataset.passage||card.querySelector('details.reading')?.dataset.readingRef||'';const m=ref.match(/^Revelation\s+(\d+)\s*:\s*(\d+)\s*[-–—]\s*(\d+)$/);if(!m)throw Error('Unexpected main reading: '+ref);const [c,a,b]=m.slice(1).map(Number);return Array.from({length:b-a+1},(_,i)=>'Revelation '+c+':'+(a+i));}
async function exportDocx(){
 btn.disabled=true;feedback.textContent='Checking the exact KJV Bible and assembling the Word document…';
 try{
  const lib=window.RevKJV;if(!lib)throw Error('Bible reader has not started. Reload the HTML and retry.');
  let bible=lib.get();if(!bible)bible=await lib.load();
  if(!bible)throw Error('Load the KJV Bible first.');
  const sections=[...document.querySelectorAll('.chapter')];
  if(sections.length!==22)throw Error('Expected 22 Revelation chapters; found '+sections.length);
  const scenes=sections.flatMap(c=>[...c.querySelectorAll('article.scene[id^="scene-"]')]);
  if(scenes.length!==53)throw Error('Expected 53 narrative scenes; found '+scenes.length);
  const refs=scenes.flatMap(refsForScene);const uniq=new Set(refs),missing=[...uniq].filter(r=>!Object.prototype.hasOwnProperty.call(bible,r));
  if(uniq.size!==404)throw Error('Main readings contain '+uniq.size+' distinct verses; expected 404.');
  if(missing.length)throw Error('KJV JSON is missing '+missing.length+' readings, beginning '+missing.slice(0,3).join(', ')+'.');
  paragraphs=[];relMap.clear();countVerses=0;
  add('REVELATION','Title');add('The Revelation of Jesus Christ — A complete KJV narrative study','Heading2');
  add('All 22 chapters • 404 KJV verses • 53 natural scenes • The Great Controversy (1888), Salvation in Symbols and Signs, Light Bearers and Preludes of Hope.');
  add('Scripture is the primary authority. The historicist identification of powers and dates represents an interpretive framework and is distinguished from the biblical wording. Ellen White’s original 1888 text is distinguished from the publisher’s supplementary charts.');
  for(let i=0;i<sections.length;i++){
   const sec=sections[i],head=sec.querySelector('.chapter-head h2')||sec.querySelector('h2');
   add(head?.textContent.trim()||'Revelation chapter '+(i+1),'Heading1',{breakBefore:true});
   const cards=sec.querySelectorAll('article.scene');
   for(const card of cards){
    if(card.id.startsWith('scene-')){
     add(card.querySelector('h3')?.textContent.trim()||'Narrative scene','Heading2');
     const passage=card.dataset.passage||card.querySelector('details.reading')?.dataset.readingRef;
     addLink('KJV reading — '+passage,'https://www.biblegateway.com/passage/?search='+encodeURIComponent(passage)+'&version=KJV','Heading3');
     for(const ref of refsForScene(card))addVerse(ref,bible[ref]);
     for(const el of [...card.children]){
      if(el.tagName==='P'&&!['range','refs','direct-sources'].some(c=>el.classList.contains(c)))add(el.textContent.trim());
      else if(el.classList.contains('application')){add('Living the message','Heading3');for(const p of el.querySelectorAll('p'))add(p.textContent.trim());}
     }
     const refs=card.querySelectorAll(':scope > p.refs a[data-bible-ref]');
     if(refs.length){add('Scripture connections','Heading3');for(const a of refs)addLink(a.textContent.trim(),a.href,'SmallText');}
     const source=card.querySelectorAll(':scope > p.direct-sources a');
     if(source.length){add('Underlying study sources','Heading3');for(const a of source)addLink(a.textContent.trim(),a.href,'SmallText');}
    }else appendStudyCard(card);
   }
  }
  if(countVerses!==404)throw Error('KJV validation failed: '+countVerses+' verse entries were produced.');
  const data=composeDocx(),blob=new Blob([data],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='Revelation_KJV_Full_Narrative_Master.docx';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),20000);
  feedback.textContent='Created complete Word document: '+countVerses+' KJV verses, '+scenes.length+' scenes, original source explanations and Bible links.';
 }catch(error){feedback.textContent='Word export could not finish: '+(error?.message||error)}finally{btn.disabled=false;}
}
btn.addEventListener('click',exportDocx);
})();
