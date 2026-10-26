/* Get to Know Jesus - accounts and guided password recovery.
   Supabase project URL and publishable key are read from site-config.js.
   NEVER put service-role or Resend secrets in browser code. */
(()=>{'use strict';
const conf=window.SITE_CONFIG||{};
const url=conf.supabaseUrl||'',key=conf.supabasePublishableKey||'';
let client=null,current=null,hydrating=false,view='signin',recovery=false,syncTimer;
const recoveryLink=/[?&]password-recovery=1(?:&|$)/.test(location.search)||/[#&]type=recovery(?:&|$)/.test(location.hash);
let recoveryEventSeen=false;
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
function open(){if(!dialog.open)dialog.showModal();}
function mode(next,keepMessage=false){
 view=next;const signed=!!current;
 const titles={signin:'Welcome back',signup:'Create your account',forgot:'Forgot your password?',recovery:'Choose a new password',signed:'My Bible study account'};
 $('accountHeading').textContent=titles[next]||titles.signin;
 $('accountDescription').textContent=({signin:'Sign in to continue your Bible studies on any device.',signup:'Create a free account to save your progress.',forgot:'Enter your email address and we will send you a password reset link.',recovery:'Enter and confirm a new password to finish resetting your account.',signed:`Signed in as ${current?.email||''}. Your progress is stored in your account.`})[next];
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
button.onclick=()=>{if(recovery)mode('recovery',true);else showNormal();open()};
$('accountClose').onclick=()=>dialog.close();
$('accountForgot').onclick=()=>mode('forgot');$('accountRegister').onclick=()=>mode('signup');$('accountBack').onclick=()=>mode('signin');
$('accountForm').onsubmit=async e=>{e.preventDefault();if(!client){msg('Accounts are not configured. Please contact the website owner.');return}
 const email=$('accountEmail').value.trim();const password=$('accountPassword').value;
 if(view!=='recovery'&&!email){msg('Enter your email address.');return}
 if(view!=='forgot'&&password.length<8){msg('Password must be at least 8 characters long.');return}
 if(view==='recovery'&&password!==$('accountConfirmPassword').value){msg('The new passwords do not match.');return}
 $('accountPrimary').disabled=true;msg('Working…');try{
   let response;const redirectTo=location.origin+location.pathname+(view==='forgot'?'?password-recovery=1':'');
   if(view==='signin')response=await client.auth.signInWithPassword({email,password});
   if(view==='signup')response=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
   if(view==='forgot')response=await client.auth.resetPasswordForEmail(email,{redirectTo});
   if(view==='recovery')response=await client.auth.updateUser({password});
   if(response?.error)throw response.error;
   if(view==='signup')msg('Check your inbox for your confirmation link.');
   if(view==='forgot')msg('If that address has an account, a reset link will be emailed to you.');
   if(view==='signin'){msg('Signed in. Loading your saved progress…');mode('signed',true)}
   if(view==='recovery'){
      recovery=false;$('accountPassword').value='';$('accountConfirmPassword').value='';
      // Remove recovery tokens from history once the client has processed the link.
      if(recoveryLink || (location.hash&&/access_token=|type=recovery|error=/.test(location.hash)))history.replaceState(null,'',location.pathname);
      mode(current?'signed':'signin',true);msg('Password updated successfully. You can now continue your studies.');open();
   }
 }catch(err){msg(err?.message||'Account request failed. Please try again.')}finally{$('accountPrimary').disabled=false}
};
$('accountLogout').onclick=async()=>{if(!client)return;const {error}=await client.auth.signOut();if(error){msg(error.message);return}current=null;recovery=false;mode('signin');msg('You have signed out.');};
function mergeData(cloud){const app=window.BIBLE_PROGRESS;if(!app)return;if(cloud&&typeof cloud==='object')app.replace(cloud);else scheduleSync()}
async function loadCloud(user){if(!client||!user)return;hydrating=true;try{const {data,error}=await client.from('study_progress').select('progress').eq('user_id',user.id).maybeSingle();if(error)throw error;mergeData(data?.progress||null)}catch(e){msg('Could not load online progress: '+e.message)}finally{hydrating=false}}
async function flush(){if(!client||!current||hydrating)return;const data=window.BIBLE_PROGRESS?.get();if(!data)return;const {error}=await client.from('study_progress').upsert({user_id:current.id,progress:data,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error){console.warn('Account save failed',error);msg('Online saving failed. Progress remains on this device.')}}
function scheduleSync(){if(hydrating||!current)return;clearTimeout(syncTimer);syncTimer=setTimeout(flush,800)}
window.BIBLE_ACCOUNT={save:scheduleSync,isSignedIn:()=>!!current};
async function onSession(user){const prior=current?.id;current=user||null;
 // Never discard the password recovery view while Supabase refreshes a session.
 if(!recovery)mode(current?'signed':'signin',true);
 if(current&&prior!==current.id)await loadCloud(current);
}
function enterRecovery(){recoveryEventSeen=true;recovery=true;mode('recovery');msg('Your reset link is verified. Choose a new password.');open();setTimeout(()=>$('accountPassword').focus(),0)}
if(url&&key){
 if(!window.supabase?.createClient){msg('Account library unavailable. Check your internet connection and reload.');return}
 client=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 // The recovery event arrives asynchronously after the Supabase client processes the URL.
 client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{
   if(event==='PASSWORD_RECOVERY'){current=session?.user||current;enterRecovery();return}
   if(recoveryLink && session?.user && !recoveryEventSeen){current=session.user;enterRecovery();return}
   onSession(session?.user||null);
 },0)});
 client.auth.getSession().then(({data,error})=>{
   if(recoveryLink){
     if(data?.session?.user){current=data.session.user;enterRecovery()}
     else if(!recoveryEventSeen){
       mode('signin');msg(error?.message||'This password-reset link has expired or could not be verified. Select Forgot password? to request a fresh link.');open();
     }
   } else if(!recovery){onSession(data?.session?.user||null)}
 }).catch(err=>{if(recoveryLink){mode('signin');msg(err?.message||'Password reset could not be verified. Request a new link.');open()}});
}
})();
