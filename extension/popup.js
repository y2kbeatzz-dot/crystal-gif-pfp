const $=id=>document.getElementById(id);
async function send(type,values={}){const r=await chrome.runtime.sendMessage({type,...values});if(!r?.ok)throw Error(r?.error||'Refresh the extension and try again.');return r.data;}
function status(t){$('status').textContent=t;}
async function refresh(){const s=await send('state'),a=await send('account');$('preview').hidden=!s.gif;if(s.gif)$('preview').src=s.gif;else $('preview').removeAttribute('src');$('enabled').checked=s.enabled!==false;$('shared').checked=!!s.sharedEnabled;$('pick').disabled=!s.gif;$('picked').textContent=s.target?'Local picture selected.':'Choose a GIF, then select the picture you want animated on YouTube.';$('account').textContent=a.account?'Connected: '+a.account.title+(a.account.handle?' · '+a.account.handle:''):'';if(a.account&&a.account.handle&&!$('channel').value)$('channel').value=a.account.handle;$('service').textContent=a.ready?'Shared service connected.':'Shared service is not online yet. Local mode is available.';$('share').disabled=!a.ready||!s.gif;$('delete').disabled=!a.account;$('shared').disabled=!a.ready;}
function action(id,fn){$(id).onclick=async()=>{const button=$(id);button.disabled=true;try{await fn();await refresh();}catch(e){status(e.message);}finally{button.disabled=false;await refresh().catch(()=>{});}};}
$('file').onchange=async()=>{try{const f=$('file').files[0];if(!f)return;if(f.size>5*1024*1024)throw Error('Choose a GIF smaller than 5 MB for local mode.');const sig=new TextDecoder().decode(await f.slice(0,6).arrayBuffer());if(!['GIF87a','GIF89a'].includes(sig))throw Error('Choose a real .gif file.');const gif=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(new Blob([f],{type:'image/gif'}));});const image=new Image();image.src=gif;await image.decode();await send('set',{values:{gif,enabled:true}});status(f.size>524288||image.width>512||image.height>512?'Saved locally. Sharing needs a smaller GIF (512 KB, 512 × 512 px).':'GIF saved. Now select your signed-in YouTube avatar.');await refresh();}catch(e){status(e.message);}};
action('pick',async()=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.url||new URL(tab.url).hostname!=='www.youtube.com')throw Error('Open YouTube first.');try{await chrome.tabs.sendMessage(tab.id,{type:'pick-avatar'});}catch{await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});await chrome.tabs.sendMessage(tab.id,{type:'pick-avatar'});}window.close();});
for(const [id,key] of [['enabled','enabled'],['shared','sharedEnabled']])$(id).onchange=async()=>{try{await send('set',{values:{[key]:$(id).checked}});status('Saved.');}catch(e){status(e.message);}};
action('share',async()=>{
  if(!$('consent').checked)throw Error('Confirm that you have permission to share this GIF publicly.');
  const channel=$('channel').value.trim();
  if(!channel)throw Error('Enter your YouTube @handle.');
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.url||new URL(tab.url).hostname!=='www.youtube.com')throw Error('Open YouTube in this window first.');
  let account;
  try{account=await chrome.tabs.sendMessage(tab.id,{type:'get-account-avatar'});}
  catch{
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});
    account=await chrome.tabs.sendMessage(tab.id,{type:'get-account-avatar'});
  }
  if(!account?.key)throw Error('You are not signed into YouTube in this Chrome profile. Sign in to the channel you want to publish, then try again.');
  await send('claim',{channel,avatar_key:account.key});
  await send('publish');
  await send('set',{values:{sharedEnabled:true}});
  status('Shared! No profile code or manual avatar selection needed. Other Crystal users can see your GIF after refresh.');
});
action('delete',async()=>{await send('delete');status('Shared profile deleted. Cached copies may take up to five minutes to disappear.');});
action('reset',async()=>{await send('reset');status('Local GIF removed. Your shared profile is managed separately.');});
function blockId(){const id=$('blockid').value.trim();if(!/^UC[\w-]{22}$/.test(id))throw Error('Enter the channel’s UC… ID.');return id;}
action('block',async()=>{const s=await send('state');await send('set',{values:{blocked:[...new Set([...(s.blocked||[]),blockId()])]}});status('Channel blocked locally.');});
action('unblock',async()=>{await send('set',{values:{blocked:[]}});status('Blocked list cleared.');});
action('report',async()=>{await send('report',{channel:blockId()});status('Report sent to the operator. You can also block the channel locally.');});
refresh().catch(e=>status(e.message));
