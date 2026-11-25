/* End Time Bible Studies — shared EN/TL position-aware switching.
   Stable routes and chapter/passage ids win; scroll position is a fallback.
   No user data, notes or account state are transferred. */
(function(){
 'use strict';
 const KEY='etbs-language-position-v1';
 const selector='a[hreflang="en"],a[hreflang="tl"],#bible-language-switch';
 function nearestPassage(){
  const nodes=document.querySelectorAll('[id^="section-"],[id^="passage-"],[id^="rev-passage-"]');
  let best=null,score=Infinity;
  for(const node of nodes){
   const box=node.getBoundingClientRect();
   if(box.bottom<=65||box.top>innerHeight*0.75)continue;
   const distance=Math.abs(box.top-105);
   if(distance<score){best=node;score=distance;}
  }
  return best&&best.id||'';
 }
 document.addEventListener('click',function(event){
  const link=event.target.closest&&event.target.closest(selector);
  if(!link||!link.getAttribute('href'))return;
  const destination=new URL(link.getAttribute('href'),location.href);
  if(destination.origin!==location.origin)return;
  const hash=location.hash;
  if(hash&&!destination.hash)destination.hash=hash;
  const passage=!hash?nearestPassage():'';
  if(passage&&!destination.hash)destination.hash='#'+encodeURIComponent(passage);
  const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
  const ratio=max?Math.max(0,Math.min(1,scrollY/max)):0;
  try{sessionStorage.setItem(KEY,JSON.stringify({destination:destination.pathname,ratio,
   hash:destination.hash,time:Date.now()}));}catch(_){}
  // Handle navigation once; older chapter scripts would otherwise overwrite
  // the more specific section anchor with location.hash.
  event.preventDefault();event.stopImmediatePropagation();
  location.assign(destination.href);
 },true);
 let pending;
 try{pending=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(_){}
 if(!pending||pending.destination!==location.pathname||
    Date.now()-pending.time>120000)return;
 try{sessionStorage.removeItem(KEY)}catch(_){}
 addEventListener('load',function(){
  setTimeout(function(){
   if(pending.hash && /^#(?:section-|passage-|rev-passage-)/.test(pending.hash)){
    const id=decodeURIComponent(pending.hash.slice(1));
    const anchor=document.getElementById(id);
    if(anchor){anchor.scrollIntoView({block:'start',behavior:'auto'});return;}
   }
   const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
   if(max&&pending.ratio>0)scrollTo({top:Math.round(max*pending.ratio),behavior:'instant'});
  },350);
 },{once:true});
})();
