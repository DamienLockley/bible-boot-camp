/* Optional Supabase accounts. Project URL and publishable/anon key are public by design;
   NEVER insert a service_role key or email provider secret in this file. */
(()=>{'use strict';
const conf=window.SITE_CONFIG||{},url=conf.supabaseUrl||'',key=conf.supabasePublishableKey||'';
let client=null,current=null,pending=null,hydrating=false;
const button=document.createElement('button');button.type='button';button.className='btn btn-outline';button.textContent='My account';button.style.cssText='padding:9px 13px;white-space:nowrap;font-size:.83rem';
const header=document.querySelector('.header-actions');header?.insertBefore(button,header.firstChild);
const dialog=document.createElement('dialog'); dialog.className='account-dialog';
dialog.innerHTML=`<form id="accountForm" method="dialog" style="display:grid;gap:12px;min-width:min(84vw,350px)"><h2 style="margin:0">My Bible study account</h2><p id="accountDescription" style="margin:0">Create a free account to continue on another device.</p><label>Your email<br><input id="accountEmail" required type="email" autocomplete="email" style="width:100%;padding:10px"></label><label>Password<br><input id="accountPassword" type="password" autocomplete="current-password" minlength="8" style="width:100%;padding:10px"></label><div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" id="accountSignup" class="btn btn-dark">Create account</button><button type="button" id="accountSignin" class="btn btn-outline">Sign in</button><button type="button" id="accountReset" class="btn btn-outline">Reset password</button><button type="button" id="accountNewPassword" class="btn btn-outline" hidden>Set new password</button><button type="button" id="accountLogout" class="btn btn-outline" hidden>Sign out</button></div><p id="accountStatus" role="status" style="margin:0;max-width:350px;overflow-wrap:anywhere"></p><button type="button" id="accountClose" class="btn btn-outline">Close</button></form>`;
document.body.append(dialog);
const $=id=>dialog.querySelector('#'+id),msg=text=>{$('accountStatus').textContent=text};
button.onclick=()=>{showStatus();dialog.showModal()};$('accountClose').onclick=()=>dialog.close();
function showStatus(){const logged=!!current;$('accountDescription').textContent=logged?`Signed in as ${current.email}. Your progress is stored in your account.`:'Create a free account or sign in to save your progress across devices.';$('accountSignup').hidden=logged;$('accountSignin').hidden=logged;$('accountReset').hidden=logged;$('accountLogout').hidden=!logged;$('accountPassword').parentElement.hidden=logged;button.textContent=logged?'My account ✓':'My account'}
async function run(kind){if(!client){msg('Accounts are not configured yet. The website owner needs to complete the Supabase setup.');return}
 const email=$('accountEmail').value.trim(),password=$('accountPassword').value;
 if(!email){msg('Enter your email address.');return}if(kind!=='reset'&&password.length<8){msg('Enter a password of at least 8 characters.');return}
 msg('Working…');try{let response;
 if(kind==='signup')response=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
 if(kind==='signin')response=await client.auth.signInWithPassword({email,password});
 if(kind==='reset')response=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
 if(response.error)throw response.error;
 msg(kind==='signup'?'Check your email for a confirmation link (when email confirmation is enabled).':kind==='reset'?'Check your email for a password reset link.':'Signed in. Loading your saved study progress…');
 }catch(e){msg(e.message||'Account request failed')}}
 $('accountSignup').onclick=()=>run('signup');$('accountSignin').onclick=()=>run('signin');$('accountReset').onclick=()=>run('reset');
 $('accountNewPassword').onclick=async()=>{if(!client)return;const password=$('accountPassword').value;if(password.length<8){msg('Enter a new password of at least 8 characters.');return}const {error}=await client.auth.updateUser({password});msg(error?error.message:'Password updated successfully.');if(!error)$('accountNewPassword').hidden=true};
 $('accountLogout').onclick=async()=>{if(!client)return;await client.auth.signOut();current=null;showStatus();msg('Signed out. Local progress remains on this device.')};
 let localVersion=0;
 function mergeData(cloud){
  const app=window.BIBLE_PROGRESS;if(!app)return;
  if(cloud&&typeof cloud==='object'){app.replace(cloud);return}
  scheduleSync();
 }
 async function loadCloud(user){if(!client||!user)return;
 hydrating=true;try{const {data,error}=await client.from('study_progress').select('progress').eq('user_id',user.id).maybeSingle();if(error)throw error;mergeData(data?.progress||null)}catch(e){msg('Could not load online progress: '+e.message)}finally{hydrating=false}}
 async function flush(){if(!client||!current||hydrating)return;const data=window.BIBLE_PROGRESS?.get();if(!data)return;
  const {error}=await client.from('study_progress').upsert({user_id:current.id,progress:data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error){console.warn('Account save failed',error);msg('Online saving failed. Your progress is still stored on this device.')}}
 let syncTimer;
 function scheduleSync(){if(hydrating||!current)return;clearTimeout(syncTimer);syncTimer=setTimeout(flush,800)}
 window.BIBLE_ACCOUNT={save:scheduleSync,isSignedIn:()=>!!current};
 async function onSession(user){const prior=current?.id;current=user||null;showStatus();if(current&&prior!==current.id)await loadCloud(current);}
 if(url&&key){
  if(!window.supabase?.createClient){msg('Account library unavailable. Connect to the internet and reload.');return}
  client=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{onSession(session?.user||null);if(event==='PASSWORD_RECOVERY'){$('accountNewPassword').hidden=false;$('accountPassword').parentElement.hidden=false;msg('Enter a new password, then select Set new password.');dialog.showModal()}},0)});
  client.auth.getUser().then(({data})=>onSession(data?.user||null)).catch(()=>{});
 }
})();
