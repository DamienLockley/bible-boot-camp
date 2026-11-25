
(function(){
  function init(){
    const header=document.querySelector('.head-actions');
    if(!header || document.getElementById('tg-supplement-button')) return;
    const tl=/(?:^|\/)tl(?:\/|$)/.test(location.pathname);
    const label=tl?'Mga Karagdagang Pag-aaral':'Supplementary Studies';
    const button=document.createElement('button');
    button.id='tg-supplement-button'; button.type='button'; button.textContent=label; button.className='nav-link'; button.style.gridColumn='1/-1'; button.style.gridRow='3';
    header.prepend(button);
    const dialog=document.createElement('dialog');
    dialog.style.cssText='width:min(92vw,850px);max-height:85vh;overflow:auto;padding:1.25rem;border:1px solid #aaa;border-radius:12px;color:#203c52;background:white;';
    document.body.append(dialog);
    function makeButton(text,fn,parent){
      const b=document.createElement('button');b.type='button';b.textContent=text;
      b.style.cssText='margin:.25rem;padding:.55rem .8rem;white-space:normal;';
      b.addEventListener('click',fn);parent.append(b);return b;
    }
    function heading(text,parent){
      const h=document.createElement('h2');h.textContent=text;parent.append(h);
    }
    function paragraphs(list,parent){
      list.forEach(text=>{
        const p=document.createElement('p');
        if(typeof highlightRefs==='function')p.innerHTML=highlightRefs(text);
        else p.textContent=text;
        parent.append(p);
      });
    }
    function reset(title,back){
      dialog.replaceChildren();
      makeButton(tl?'Isara':'Close',()=>dialog.close(),dialog);
      if(back)makeButton(tl?'Bumalik':'Back',back,dialog);
      heading(title,dialog);
    }
    function menu(){
      reset(label);
      const studies=window.TG_SUPPLEMENTARY||[];
      studies.forEach(study=>makeButton(study.title,()=>openStudy(study),dialog));
      if(!studies.length)paragraphs([tl?'Wala pang karagdagang pag-aaral.':'No supplementary studies yet.'],dialog);
    }
    function openStudy(study){
      reset(study.title,menu);
      paragraphs(study.intro,dialog);
      const nav=document.createElement('nav');dialog.append(nav);
      const content=document.createElement('section');dialog.append(content);
      study.sections.forEach(section=>makeButton(section.title,()=>{
        content.replaceChildren();heading(section.title,content);paragraphs(section.paragraphs,content);
      },nav));
    }
    button.addEventListener('click',()=>{menu();dialog.showModal();});
    // Existing verse overlay is outside the dialog; temporarily close the
    // supplementary dialog so the site's original scripture reader can open.
    dialog.addEventListener('click',e=>{
      if(e.target.closest('.bible-ref')){
        dialog.close();
        const modal=document.getElementById('verse-modal');
        if(modal){
          const observer=new MutationObserver(()=>{
            if(modal.classList.contains('hidden')){
              observer.disconnect();dialog.showModal();
            }
          });
          observer.observe(modal,{attributes:true,attributeFilter:['class']});
        }
      }
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
