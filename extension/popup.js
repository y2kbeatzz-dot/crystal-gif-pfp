const $=id=>document.getElementById(id);
let currentGifInfo=null;
const SHARE_BYTES=512*1024, LOCAL_BYTES=5*1024*1024, SHARE_DIM=512;
function bytesText(n){return n<1024? n+' B' : n<1024*1024 ? (n/1024).toFixed(1)+' KB' : (n/1024/1024).toFixed(2)+' MB';}
function parseGifBytes(bytes){
  if(!bytes||bytes.length<10)return {realGif:false,size:bytes?.length||0,width:0,height:0,shareReady:false};
  const sig=String.fromCharCode(...bytes.slice(0,6));
  const realGif=sig==='GIF87a'||sig==='GIF89a';
  const width=realGif?(bytes[6]|bytes[7]<<8):0;
  const height=realGif?(bytes[8]|bytes[9]<<8):0;
  return {realGif,size:bytes.length,width,height,shareReady:realGif&&bytes.length<=SHARE_BYTES&&width>0&&height>0&&width<=SHARE_DIM&&height<=SHARE_DIM};
}
function parseGifData(data){
  try{
    if(typeof data!=='string'||!data.startsWith('data:image/gif;base64,'))return null;
    const raw=atob(data.split(',')[1]||'');
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return parseGifBytes(bytes);
  }catch{return null;}
}
function showGifCheck(info,label='Saved GIF'){
  const el=$('gifcheck');currentGifInfo=info;
  if(!info){el.className='check neutral';el.textContent='Choose a GIF to check if it is share-ready.';return;}
  if(!info.realGif){el.className='check bad';el.textContent=label+': not a real GIF file. Use “Make / convert GIF” below.';return;}
  const text=label+': '+bytesText(info.size)+' · '+info.width+' × '+info.height+' px';
  if(info.shareReady){el.className='check good';el.textContent='✓ Share-ready — '+text;return;}
  const problems=[];
  if(info.size>SHARE_BYTES)problems.push('over 512 KB');
  if(info.width>SHARE_DIM||info.height>SHARE_DIM)problems.push('over 512 × 512 px');
  el.className='check warn';el.textContent='Local only — '+text+' · '+problems.join(' and ')+'. Use the GIF tools below before sharing.';
}
async function fileDimensions(file){
  try{
    const url=URL.createObjectURL(file),img=new Image();img.src=url;await img.decode();const out={width:img.naturalWidth,height:img.naturalHeight};URL.revokeObjectURL(url);return out;
  }catch{return {width:0,height:0};}
}
async function send(type,values={}){const r=await chrome.runtime.sendMessage({type,...values});if(!r?.ok)throw Error(r?.error||'Refresh the extension and try again.');return r.data;}
function status(t){$('status').textContent=t;}
async function refresh(){const s=await send('state'),a=await send('account');$('preview').hidden=!s.gif;if(s.gif)$('preview').src=s.gif;else $('preview').removeAttribute('src');$('enabled').checked=s.enabled!==false;$('shared').checked=!!s.sharedEnabled;$('pick').disabled=!s.gif;$('picked').textContent=s.target?'Local picture selected.':'Choose a GIF, then select the picture you want animated on YouTube.';$('account').textContent=a.account?'Connected: '+a.account.title+(a.account.handle?' · '+a.account.handle:''):'';if(a.account&&a.account.handle&&!$('channel').value)$('channel').value=a.account.handle;$('service').textContent=a.ready?('Community viewing connected · Worker v'+a.serviceVersion+(a.publishReady?' · publishing ready':' · update to Worker v4 required')):'Shared service is not online yet. Local mode is available.';showGifCheck(parseGifData(s.gif));$('share').disabled=!a.publishReady||!currentGifInfo?.shareReady;$('delete').disabled=!a.account;$('shared').disabled=!a.ready;}
function action(id,fn){$(id).onclick=async()=>{const button=$(id);button.disabled=true;try{await fn();await refresh();}catch(e){status(e.message);}finally{button.disabled=false;await refresh().catch(()=>{});}};}
$('file').onchange=async()=>{try{const f=$('file').files[0];if(!f)return;const bytes=new Uint8Array(await f.arrayBuffer());let info=parseGifBytes(bytes);if(!info.realGif){const d=await fileDimensions(f);info={...info,...d};showGifCheck(info,f.name);throw Error('This file is not a real GIF even if its filename ends in .gif. Use Make / convert GIF below.');}showGifCheck(info,f.name);if(f.size>LOCAL_BYTES)throw Error('Choose a GIF smaller than 5 MB for local mode.');const gif=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(new Blob([f],{type:'image/gif'}));});await send('set',{values:{gif,enabled:true}});status(info.shareReady?'GIF saved and ready to share.':'GIF saved locally. Use the optimizer tools before community sharing.');await refresh();}catch(e){status(e.message);}};
action('pick',async()=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.url||new URL(tab.url).hostname!=='www.youtube.com')throw Error('Open YouTube first.');try{await chrome.tabs.sendMessage(tab.id,{type:'pick-avatar'});}catch{await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});await chrome.tabs.sendMessage(tab.id,{type:'pick-avatar'});}window.close();});
for(const [id,key] of [['enabled','enabled'],['shared','sharedEnabled']])$(id).onchange=async()=>{try{await send('set',{values:{[key]:$(id).checked}});status('Saved.');}catch(e){status(e.message);}};
action('share',async()=>{
  if(!currentGifInfo?.shareReady)throw Error('This GIF is not share-ready yet. It must be a real GIF, 512 KB or smaller, and no larger than 512 × 512 px.');
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
  status('Shared! Other Crystal users with Community pictures enabled can see your GIF after refresh.');
});
action('delete',async()=>{await send('delete');status('Shared profile deleted. Cached copies may take up to five minutes to disappear.');});
action('reset',async()=>{await send('reset');showGifCheck(null);status('Local GIF removed. Your shared profile is managed separately.');});
function blockId(){const id=$('blockid').value.trim();if(!/^UC[\w-]{22}$/.test(id))throw Error('Enter the channel’s UC… ID.');return id;}
action('block',async()=>{const s=await send('state');await send('set',{values:{blocked:[...new Set([...(s.blocked||[]),blockId()])]}});status('Channel blocked locally.');});
action('unblock',async()=>{await send('set',{values:{blocked:[]}});status('Blocked list cleared.');});
action('report',async()=>{await send('report',{channel:blockId()});status('Report sent to the operator. You can also block the channel locally.');});
refresh().catch(e=>status(e.message));
