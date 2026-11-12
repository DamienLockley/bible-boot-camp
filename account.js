/* Getting to Know Jesus: Firebase Authentication and Firestore account sync.
   Firebase client configuration is public; never place service-account or Resend
   secrets in browser code. */
(()=>{'use strict';
const conf=window.SITE_CONFIG||{};
let auth=null,db=null,current=null,hydrating=false,authFlow=false,view='signin',syncTimer=null;
let actionCode='',actionMode='';
const query=new URLSearchParams(location.search);
const requestedAction=query.get('mode')||'';
const requestedCode=query.get('oobCode')||'';
const button=document.createElement('button');
button.type='button';button.className='btn btn-outline';button.textContent='My account';
button.style.cssText='padding:9px 13px;white-space:nowrap;font-size:.83rem';
document.querySelector('.header-actions')?.insertBefore(button,document.querySelector('.header-actions').firstChild);
const dialog=document.createElement('dialog');dialog.className='account-dialog';
dialog.setAttribute('aria-label','My Bible study account');
dialog.innerHTML=`<div class="account-inner">
  <h2 id="accountHeading" style="margin:0">My Bible study account</h2>
  <p id="accountDescription" style="margin:0"></p>
  <form id="accountForm" autocomplete="on" novalidate>
    <label id="accountEmailLabel">Your email<input id="accountEmail" type="email" autocomplete="email" required></label>
    <label id="accountPasswordLabel">Password<input id="accountPassword" type="password" autocomplete="current-password" minlength="8"></label>
    <label id="accountConfirmLabel" hidden>Confirm new password<input id="accountConfirmPassword" type="password" autocomplete="new-password" minlength="8"></label>
    <button id="accountPrimary" type="submit" class="btn btn-dark">Sign in</button>
  </form>
  <div id="accountLinks" class="account-links">
    <button type="button" id="accountForgot">Forgot password?</button>
    <button type="button" id="accountRegister">Create an account</button>
    <button type="button" id="accountBack" hidden>Back to sign in</button>
  </div>
  <button type="button" id="accountLogout" class="btn btn-outline" hidden>Sign out</button>
  <p id="accountStatus" role="status" aria-live="polite" style="margin:0;overflow-wrap:anywhere"></p>
  <button type="button" id="accountClose" class="btn btn-outline">Close</button>
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
 const titles={signin:'Welcome back',signup:'Create your account',forgot:'Forgot your password?',recovery:'Choose a new password',signed:'My Bible study account'};
 $('accountHeading').textContent=titles[next]||titles.signin;
 $('accountDescription').textContent=({
   signin:'Sign in to continue your Bible studies on any device.',
   signup:'Create a free account to save your progress.',
   forgot:'Enter your email address and we will send you a password reset link.',
   recovery:'Enter and confirm a new password to finish resetting your account.',
   signed:`Signed in as ${current?.email||''}. Your progress is stored in your account.`
 })[next];
 $('accountForm').hidden=next==='signed';$('accountLogout').hidden=next!=='signed';
 $('accountEmailLabel').hidden=next==='recovery';
 $('accountPasswordLabel').hidden=next==='forgot';$('accountConfirmLabel').hidden=next!=='recovery';
 $('accountPasswordLabel').firstChild.textContent=next==='recovery'?'New password':'Password';
 $('accountPassword').autocomplete=next==='signin'?'current-password':'new-password';
 $('accountPrimary').textContent=({signin:'Sign in',signup:'Create account',forgot:'Send reset email',recovery:'Save new password'})[next]||'Sign in';
 $('accountLinks').hidden=next==='signed'||next==='recovery';
 $('accountForgot').hidden=next!=='signin';$('accountRegister').hidden=next!=='signin';
 $('accountBack').hidden=next==='signin';
 if(!keepMessage)msg('');
 button.textContent=signed?'My account ✓':'My account';
}
function showNormal(){mode(current?'signed':'signin');open()}
button.onclick=()=>{if(actionMode==='resetPassword')mode('recovery',true);else showNormal();open()};
$('accountClose').onclick=()=>dialog.close();
$('accountForgot').onclick=()=>mode('forgot');$('accountRegister').onclick=()=>mode('signup');$('accountBack').onclick=()=>mode('signin');
function firebaseError(error){
 const messages={
  'auth/invalid-credential':'Email or password is incorrect.',
  'auth/invalid-email':'Enter a valid email address.',
  'auth/user-disabled':'This account is disabled. Please contact the website owner.',
  'auth/too-many-requests':'Too many attempts. Wait a little while and try again.',
  'auth/weak-password':'Choose a stronger password with at least 8 characters.',
  'auth/email-already-in-use':'An account already exists for this email. Try signing in or resetting the password.',
  'auth/expired-action-code':'This email link has expired. Request a new one.',
  'auth/invalid-action-code':'This email link is invalid or has already been used. Request a new one if needed.'
 };
 return messages[error?.code]||error?.message||'The account request failed. Please try again.';
}
$('accountForm').onsubmit=async e=>{
 e.preventDefault();if(!auth||!db){msg('Firebase is not configured. Please contact the website owner.');return}
 const email=$('accountEmail').value.trim(),password=$('accountPassword').value;
 if(view!=='recovery'&&!email){msg('Enter your email address.');return}
 if(view!=='forgot'&&password.length<8){msg('Password must be at least 8 characters long.');return}
 if(view==='recovery'&&password!==$('accountConfirmPassword').value){msg('The new passwords do not match.');return}
 $('accountPrimary').disabled=true;msg('Working…');
 try{
   if(view==='signin'){
     authFlow=true;
     const credential=await auth.signInWithEmailAndPassword(email,password);
     if(!credential.user.emailVerified){
       await credential.user.sendEmailVerification({url:location.origin+location.pathname,handleCodeInApp:false});
       await auth.signOut();current=null;authFlow=false;await onSession(null);
       mode('signin',true);$('accountEmail').value=email;
       msg('Please verify your email using the link we sent. We sent a fresh verification email just now.');open();return;
     }
     authFlow=false;
     await onSession(credential.user);
     msg('Signed in. Loading your saved progress…');mode('signed',true);
   }
   if(view==='signup'){
     authFlow=true;
     const credential=await auth.createUserWithEmailAndPassword(email,password);
     await credential.user.sendEmailVerification({url:location.origin+location.pathname,handleCodeInApp:false});
     await auth.signOut();current=null;authFlow=false;await onSession(null);
     mode('signin',true);$('accountEmail').value=email;
     msg('Your account is ready. Check your inbox and verify your email before signing in.');
   }
   if(view==='forgot'){
     await auth.sendPasswordResetEmail(email,{url:location.origin+location.pathname,handleCodeInApp:false});
     msg('If that address has an account, a password reset link will be emailed to you.');
   }
   if(view==='recovery'){
     if(!actionCode)throw new Error('The password reset link could not be verified. Request a new reset email.');
     await auth.confirmPasswordReset(actionCode,password);
     actionCode='';actionMode='';cleanActionUrl();
     $('accountPassword').value='';$('accountConfirmPassword').value='';
     mode('signin',true);msg('Password updated successfully. You can now sign in.');open();
   }
 }catch(error){authFlow=false;msg(firebaseError(error))}
 finally{$('accountPrimary').disabled=false}
};
$('accountLogout').onclick=async()=>{
 if(!auth)return;try{await auth.signOut();current=null;clearTimeout(syncTimer);mode('signin');msg('You have signed out.');}
 catch(error){msg(firebaseError(error))}
};
function mergeData(cloud){const app=window.BIBLE_PROGRESS;if(!app)return;if(cloud&&typeof cloud==='object')app.replace(cloud);else scheduleSync()}
async function loadCloud(user){
 if(!db||!user)return;hydrating=true;
 let hasCloudProgress=false,readSucceeded=false;
 try{
   const snap=await db.collection('study_progress').doc(user.uid).get();
   readSucceeded=true;
   const cloud=snap.exists?snap.data()?.progress:null;
   if(cloud&&typeof cloud==='object'){window.BIBLE_PROGRESS?.replace(cloud);hasCloudProgress=true}
 }
 catch(error){msg('Could not load online progress: '+firebaseError(error))}
 finally{hydrating=false;if(readSucceeded&&!hasCloudProgress)scheduleSync()}
}
async function flush(){
 if(!db||!current||hydrating)return;const data=window.BIBLE_PROGRESS?.get();if(!data)return;
 try{await db.collection('study_progress').doc(current.uid).set({progress:data,updated_at:firebase.firestore.FieldValue.serverTimestamp()})}
 catch(error){console.warn('Account save failed',error);msg('Online saving failed. Progress remains on this device.')}
}
function scheduleSync(){if(hydrating||!current)return;clearTimeout(syncTimer);syncTimer=setTimeout(flush,800)}
window.BIBLE_ACCOUNT={save:scheduleSync,isSignedIn:()=>!!current};
async function onSession(user){
 const nextUser=user?.emailVerified?user:null;
 const changed=current?.uid!==nextUser?.uid;
 if(changed){clearTimeout(syncTimer);hydrating=true}
 current=nextUser;
 window.BIBLE_ALL_UNLOCKED=false;window.dispatchEvent(new Event('bible-access-changed'));
 if(actionMode!=='resetPassword')mode(current?'signed':'signin',true);
 if(!current){hydrating=false;return}
 if(changed)await loadCloud(current);
 const requestedUid=current?.uid;if(!requestedUid)return;
 try{
   const snap=await db.collection('study_access').doc(requestedUid).get();
   if(current?.uid!==requestedUid)return;
   window.BIBLE_ALL_UNLOCKED=snap.exists&&snap.data()?.all_studies_unlocked===true;
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
     mode('signin',true);msg('Email verified. You can now sign in.');return;
   }
   if(requestedAction==='resetPassword'){
     const email=await auth.verifyPasswordResetCode(requestedCode);
     $('accountEmail').value=email;mode('recovery');msg('Enter a new password to finish resetting your account.');return;
   }
   actionCode='';actionMode='';cleanActionUrl();mode('signin',true);
   msg('This email link type is not supported here. Return to the site and request a new link.');
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
 }catch(error){console.error('Firebase account startup failed:',error);msg('Account services could not be started. Please reload or contact the website owner.')}
}else{console.error('Firebase SDK or public configuration is missing.')}
})();
