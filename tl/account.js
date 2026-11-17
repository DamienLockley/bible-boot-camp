/* Pagkilala kay Hesus: Firebase Authentication and Firestore account sync.
   Firebase client configuration is public; never place service-account or Resend
   secrets in browser code. */
(()=>{'use strict';
const conf=window.SITE_CONFIG||{};
let auth=null,db=null,current=null,hydrating=false,authFlow=false,view='signin',syncTimer=null;
let actionCode='',actionMode='';
const EMAIL_ACTION_URL='https://endtimebiblestudies.org/tl/';
const query=new URLSearchParams(location.search);
const requestedAction=query.get('mode')||'';
const requestedCode=query.get('oobCode')||'';
const button=document.createElement('button');
button.type='button';button.className='btn btn-outline';button.textContent='Aking account';
button.style.cssText='padding:9px 13px;white-space:nowrap;font-size:.83rem';
document.querySelector('.header-actions')?.insertBefore(button,document.querySelector('.header-actions').firstChild);
const dialog=document.createElement('dialog');dialog.className='account-dialog';
dialog.setAttribute('aria-label','Aking account sa pag-aaral ng Biblia');
dialog.innerHTML=`<div class="account-inner">
  <h2 id="accountHeading" style="margin:0">Aking account sa pag-aaral ng Biblia</h2>
  <p id="accountDescription" style="margin:0"></p>
  <form id="accountForm" autocomplete="on" novalidate>
    <label id="accountEmailLabel">Iyong email<input id="accountEmail" type="email" autocomplete="email" required></label>
    <label id="accountPasswordLabel">Password<input id="accountPassword" type="password" autocomplete="current-password" minlength="8"></label>
    <label id="accountConfirmLabel" hidden>Kumpirmahin ang bagong password<input id="accountConfirmPassword" type="password" autocomplete="new-password" minlength="8"></label>
    <button id="accountPrimary" type="submit" class="btn btn-dark">Mag-sign in</button>
  </form>
  <div id="accountLinks" class="account-links">
    <button type="button" id="accountForgot">Nakalimutan ang password?</button>
    <button type="button" id="accountRegister">Gumawa ng account</button>
    <button type="button" id="accountBack" hidden>Bumalik sa pag-sign in</button>
  </div>
  <button type="button" id="accountLogout" class="btn btn-outline" hidden>Mag-sign out</button>
  <p id="accountStatus" role="status" aria-live="polite" style="margin:0;overflow-wrap:anywhere"></p>
  <button type="button" id="accountClose" class="btn btn-outline">Isara</button>
</div>`;
document.body.append(dialog);
const css=document.createElement('style');css.textContent=`
.account-dialog [hidden]{display:none!important}
.account-dialog{width:min(450px,94vw);max-height:min(86vh,760px);overflow:auto}
.account-dialog .account-inner{display:grid;gap:14px}
.account-dialog form{display:grid;gap:13px;margin:0}
.account-dialog label{display:grid;gap:5px;font-weight:600;font-size:.92rem}
.account-dialog input{width:100%;padding:12px;font-size:1rem;box-sizing:border-box}
.account-dialog .account-links{display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between}
.account-dialog .account-links button{border:0;background:none;color:#18594b;text-decoration:underline;font:inherit;cursor:pointer;padding:6px 0}
.account-dialog .account-links button:hover{text-decoration-thickness:2px}
.account-dialog #accountPrimary{width:100%;justify-content:center}
`;document.head.append(css);
const $=id=>dialog.querySelector('#'+id),msg=text=>{$('accountStatus').textContent=text||''};
function open(){if(!dialog.open)dialog.showModal()}
function cleanActionUrl(){history.replaceState(null,'',location.pathname+location.hash)}
function mode(next,keepMessage=false){
 view=next;const signed=!!current;
 const titles={signin:'Maligayang pagbabalik',signup:'Gumawa ng iyong account',forgot:'Nakalimutan mo ba ang password?',recovery:'Pumili ng bagong password',signed:'Aking account sa pag-aaral ng Biblia'};
 $('accountHeading').textContent=titles[next]||titles.signin;
 $('accountDescription').textContent=({
   signin:'Mag-sign in upang maipagpatuloy ang pag-aaral sa alinmang device.',
   signup:'Gumawa ng libreng account upang i-save ang iyong progreso.',
   forgot:'Ilagay ang iyong email at padadalhan ka namin ng link upang palitan ang password.',
   recovery:'Ilagay at kumpirmahin ang bagong password upang matapos ang pagpapalit.',
   signed:`Naka-sign in bilang ${current?.email||''}. Naka-save sa account mo ang iyong progreso.`
 })[next];
 $('accountForm').hidden=next==='signed';$('accountLogout').hidden=next!=='signed';
 $('accountEmailLabel').hidden=next==='recovery';
 $('accountPasswordLabel').hidden=next==='forgot';$('accountConfirmLabel').hidden=next!=='recovery';
 $('accountPasswordLabel').firstChild.textContent=next==='recovery'?'Bagong password':'Password';
 $('accountPassword').autocomplete=next==='signin'?'current-password':'new-password';
 $('accountPrimary').textContent=({signin:'Mag-sign in',signup:'Gumawa ng account',forgot:'Ipadala ang email sa pagpapalit',recovery:'I-save ang bagong password'})[next]||'Mag-sign in';
 $('accountLinks').hidden=next==='signed'||next==='recovery';
 $('accountForgot').hidden=next!=='signin';$('accountRegister').hidden=next!=='signin';
 $('accountBack').hidden=next==='signin';
 if(!keepMessage)msg('');
 button.textContent=signed?'Aking account ✓':'Aking account';
}
function showNormal(){mode(current?'signed':'signin');open()}
button.onclick=()=>{if(actionMode==='resetPassword')mode('recovery',true);else showNormal();open()};
$('accountClose').onclick=()=>dialog.close();
$('accountForgot').onclick=()=>mode('forgot');$('accountRegister').onclick=()=>mode('signup');$('accountBack').onclick=()=>mode('signin');
function firebaseError(error){
 const messages={
  'auth/invalid-credential':'Mali ang email o password.',
  'auth/invalid-email':'Maglagay ng wastong email address.',
  'auth/user-disabled':'Hindi aktibo ang account. Makipag-ugnayan sa may-ari ng website.',
  'auth/too-many-requests':'Napakaraming pagsubok. Maghintay muna at subukan muli.',
  'auth/weak-password':'Pumili ng mas matibay na password na may hindi bababa sa 8 karakter.',
  'auth/email-already-in-use':'May account na ang email na ito. Subukang mag-sign in o palitan ang password.',
  'auth/expired-action-code':'Paso na ang link sa email. Humiling ng bago.',
  'auth/invalid-action-code':'Hindi wasto o nagamit na ang link. Humiling ng bago kung kailangan.'
 };
 return messages[error?.code]||error?.message||'Hindi natuloy ang kahilingan. Subukan muli.';
}
$('accountForm').onsubmit=async e=>{
 e.preventDefault();if(!auth||!db){msg('Hindi pa nakaayos ang serbisyo ng account. Makipag-ugnayan sa may-ari ng website.');return}
 const email=$('accountEmail').value.trim(),password=$('accountPassword').value;
 if(view!=='recovery'&&!email){msg('Ilagay ang iyong email address.');return}
 if(view!=='forgot'&&password.length<8){msg('Kailangan ng hindi bababa sa 8 karakter ang password.');return}
 if(view==='recovery'&&password!==$('accountConfirmPassword').value){msg('Hindi magkatugma ang mga bagong password.');return}
 $('accountPrimary').disabled=true;msg('Isinasagawa…');
 try{
   if(view==='signin'){
     authFlow=true;
     const credential=await auth.signInWithEmailAndPassword(email,password);
     if(!credential.user.emailVerified){
       await credential.user.sendEmailVerification({url:EMAIL_ACTION_URL,handleCodeInApp:false});
       await auth.signOut();current=null;authFlow=false;await onSession(null);
       mode('signin',true);$('accountEmail').value=email;
       msg('Kumpirmahin ang email gamit ang link na ipinadala namin. Nagpadala kami ngayon ng bagong email sa pagkumpirma.');open();return;
     }
     authFlow=false;
     await onSession(credential.user);
     msg('Naka-sign in na. Binubuksan ang na-save mong progreso…');mode('signed',true);
   }
   if(view==='signup'){
     authFlow=true;
     const credential=await auth.createUserWithEmailAndPassword(email,password);
     await credential.user.sendEmailVerification({url:EMAIL_ACTION_URL,handleCodeInApp:false});
     await auth.signOut();current=null;authFlow=false;await onSession(null);
     mode('signin',true);$('accountEmail').value=email;
     msg('Handa na ang account mo. Tingnan ang inbox at kumpirmahin ang email bago mag-sign in.');
   }
   if(view==='forgot'){
     await auth.sendPasswordResetEmail(email,{url:EMAIL_ACTION_URL,handleCodeInApp:false});
     msg('Kung may account ang address na iyon, padadalhan ka ng link upang palitan ang password.');
   }
   if(view==='recovery'){
     if(!actionCode)throw new Error('Hindi makumpirma ang link. Humiling ng bagong email sa pagpapalit ng password.');
     await auth.confirmPasswordReset(actionCode,password);
     actionCode='';actionMode='';cleanActionUrl();
     $('accountPassword').value='';$('accountConfirmPassword').value='';
     mode('signin',true);msg('Napalitan na ang password. Maaari ka nang mag-sign in.');open();
   }
 }catch(error){authFlow=false;msg(firebaseError(error))}
 finally{$('accountPrimary').disabled=false}
};
$('accountLogout').onclick=async()=>{
 if(!auth)return;try{await auth.signOut();current=null;clearTimeout(syncTimer);mode('signin');msg('Naka-sign out ka na.');}
 catch(error){msg(firebaseError(error))}
};
function mergeData(cloud){const app=window.BIBLE_PROGRESS;if(!app)return;if(cloud&&typeof cloud==='object')app.replace(cloud);else scheduleSync()}
async function loadCloud(user){
 if(!db||!user)return;hydrating=true;
 let hasCloudProgress=false,readSucceeded=false;
 try{
   const snap=await db.collection('study_progress').doc(user.uid).get();
   readSucceeded=true;
   const cloud=snap.exists?snap.data()?.progress?.tagalog:null;
   if(cloud&&typeof cloud==='object'){window.BIBLE_PROGRESS?.replace(cloud);hasCloudProgress=true}
 }
 catch(error){msg('Hindi mabuksan ang online na progreso: '+firebaseError(error))}
 finally{hydrating=false;if(readSucceeded&&!hasCloudProgress)scheduleSync()}
}
async function flush(){
 if(!db||!current||hydrating)return;const data=window.BIBLE_PROGRESS?.get();if(!data)return;
 try{await db.collection('study_progress').doc(current.uid).set({progress:{tagalog:data},updated_at:firebase.firestore.FieldValue.serverTimestamp()},{mergeFields:['progress.tagalog','updated_at']})}
 catch(error){console.warn('Account save failed',error);msg('Hindi na-save online. Nananatili ang progreso sa device na ito.')}
}
function scheduleSync(){if(hydrating||!current)return;clearTimeout(syncTimer);syncTimer=setTimeout(flush,800)}
window.BIBLE_ACCOUNT={save:scheduleSync,isSignedIn:()=>!!current};
async function onSession(user){
 const nextUser=user?.emailVerified?user:null;
 const changed=current?.uid!==nextUser?.uid;
 if(changed){clearTimeout(syncTimer);hydrating=true}
 current=nextUser;
 window.BIBLE_SELECTED_STUDIES=[];window.BIBLE_ALL_UNLOCKED=false;window.dispatchEvent(new Event('bible-access-changed'));
 if(actionMode!=='resetPassword')mode(current?'signed':'signin',true);
 if(!current){hydrating=false;return}
 if(changed)await loadCloud(current);
 const requestedUid=current?.uid;if(!requestedUid)return;
 try{
   const snap=await db.collection('study_access').doc(requestedUid).get();
   if(current?.uid!==requestedUid)return;
   window.BIBLE_ALL_UNLOCKED=snap.exists&&snap.data()?.all_studies_unlocked===true;
   window.BIBLE_SELECTED_STUDIES=Array.isArray(snap.data()?.selected_studies)?snap.data().selected_studies:[];
   window.dispatchEvent(new Event('bible-access-changed'));
 }catch(error){console.warn('Could not check special study access:',error)}
 finally{hydrating=false}
}
async function handleEmailAction(){
 if(!requestedAction||!requestedCode)return;
 actionMode=requestedAction;actionCode=requestedCode;open();
 try{
   if(requestedAction==='verifyEmail'){
     await auth.applyActionCode(requestedCode);actionCode='';actionMode='';cleanActionUrl();
     mode('signin',true);msg('Nakumpirma ang email. Maaari ka nang mag-sign in.');return;
   }
   if(requestedAction==='resetPassword'){
     const email=await auth.verifyPasswordResetCode(requestedCode);
     $('accountEmail').value=email;mode('recovery');msg('Maglagay ng bagong password upang matapos ang pagpapalit.');return;
   }
   actionCode='';actionMode='';cleanActionUrl();mode('signin',true);
   msg('Hindi sinusuportahan ang uri ng link na ito. Bumalik sa website at humiling ng bago.');
 }catch(error){
   actionCode='';actionMode='';cleanActionUrl();mode('signin',true);msg(firebaseError(error));
 }
}
if(window.firebase&&conf.firebaseConfig?.apiKey){
 try{
   const app=window.firebase.apps.length?window.firebase.app():window.firebase.initializeApp(conf.firebaseConfig);
   auth=app.auth();db=app.firestore();
   auth.onAuthStateChanged(user=>{if(authFlow)return;if(user&&!user.emailVerified){auth.signOut();return}onSession(user)});
   if(requestedAction&&requestedCode)handleEmailAction();
 }catch(error){console.error('Firebase account startup failed:',error);msg('Hindi masimulan ang serbisyo ng account. I-reload o makipag-ugnayan sa may-ari ng website.')}
}else{console.error('Firebase SDK or public configuration is missing.')}
})();
