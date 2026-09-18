importScripts('config.js');
const cache=new Map();let healthCache={until:0,data:null};
const publicKeys=['gif','target','enabled','sharedEnabled','blocked'];
chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
function base(){if(!CONFIG.apiBase)throw Error('Shared service is not online yet. Local GIF mode still works.');const u=new URL(CONFIG.apiBase);if(u.protocol!=='https:')throw Error('Service must use HTTPS.');return u.origin;}
async function api(path,{method='GET',body,token}={}){const r=await fetch(base()+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,credentials:'omit',signal:AbortSignal.timeout(20000)});let data;try{data=await r.json();}catch{data={};}if(!r.ok)throw Error(data.error||'Service unavailable.');return data;}
async function health(){if(healthCache.data&&healthCache.until>Date.now())return healthCache.data;try{const data=await api('/health');healthCache={data,until:Date.now()+30000};return data;}catch{const data={version:0};healthCache={data,until:Date.now()+10000};return data;}}
async function lookup(refs){const s=await chrome.storage.local.get(['sharedEnabled','blocked']);if(!s.sharedEnabled||!CONFIG.apiBase)return [];if(!Array.isArray(refs)||refs.length>40)throw Error('Invalid lookup.');refs=refs.filter(x=>typeof x==='string'&&x.length<150&&(/^(UC[\w-]{22}|@[^\s/?#]+)$/.test(x)));const missing=refs.filter(r=>!cache.has(r)||cache.get(r).until<Date.now());if(missing.length){const result=await api('/lookup',{method:'POST',body:{refs:missing}});for(const r of missing)cache.set(r,{until:Date.now()+60000,profile:null});for(const p of result.profiles||[]){if(!/^UC[\w-]{22}$/.test(p.channel))continue;const asset=await fetch(base()+'/avatar/'+p.channel,{credentials:'omit',signal:AbortSignal.timeout(15000)});if(!asset.ok)continue;const bytes=new Uint8Array(await asset.arrayBuffer());if(bytes.length>524288||!['GIF87a','GIF89a'].includes(String.fromCharCode(...bytes.slice(0,6))))continue;let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));const profile={...p,gif:'data:image/gif;base64,'+btoa(binary)};for(const r of [p.channel,p.handle].filter(Boolean))cache.set(r,{until:Date.now()+60000,profile});}while(cache.size>150)cache.delete(cache.keys().next().value);}
return [...new Map(refs.map(r=>cache.get(r)?.profile).filter(p=>p&&!(s.blocked||[]).includes(p.channel)).map(p=>[p.channel,p])).values()];}
async function handle(m,sender){const ui=sender.url?.startsWith(chrome.runtime.getURL(''));
if(m.type==='state')return chrome.storage.local.get(publicKeys);
if(m.type==='lookup')return lookup(m.refs);
if(m.type==='local-selection'){
  if(typeof m.target!=='string'||m.target.length>1000)throw Error('Invalid selection.');
  await chrome.storage.local.set({target:m.target,accountAvatar:!!m.accountAvatar,enabled:true});
  return {ok:true,accountAvatar:!!m.accountAvatar};
}
if(!ui)throw Error('This action is only available in the extension.');
if(m.type==='set'){const allowed={};for(const k of publicKeys)if(k in m.values)allowed[k]=m.values[k];await chrome.storage.local.set(allowed);cache.clear();return {ok:true};}
if(m.type==='account'){const s=await chrome.storage.local.get('account');const h=CONFIG.apiBase?await health():{version:0};return {account:s.account?{channel:s.account.channel,title:s.account.title,handle:s.account.handle||''}:null,ready:!!CONFIG.apiBase&&Number(h.version)>=2,publishReady:!!CONFIG.apiBase&&Number(h.version)>=5,serviceVersion:Number(h.version)||0};}
if(m.type==='claim'){
  const h=await health();if(Number(h.version)<5)throw Error('Community sharing needs Worker v5 for the 1 MB limit. Update the Cloudflare Worker, then try again.');
  if(typeof m.avatar_key!=='string'||!m.avatar_key)throw Error('Could not detect your signed-in YouTube account. Sign in to YouTube and try again.');
  const a=await api('/claim',{method:'POST',body:{channel:m.channel,avatar_key:m.avatar_key}});
  await chrome.storage.local.set({account:a});
  return {channel:a.channel,title:a.title,handle:a.handle||''};
}
if(m.type==='publish'){const s=await chrome.storage.local.get(['account','gif']);if(!s.account||!s.gif)throw Error('Choose a GIF and connect your channel first.');const r=await api('/profile',{method:'PUT',body:{gif:s.gif},token:s.account.token});cache.clear();return r;}
if(m.type==='delete'){const s=await chrome.storage.local.get('account');if(!s.account)throw Error('Connect your channel to manage its shared profile.');const r=await api('/profile',{method:'DELETE',token:s.account.token});await chrome.storage.local.remove('account');cache.clear();return r;}
if(m.type==='reset'){await chrome.storage.local.remove(['gif','target','accountAvatar']);return {ok:true};}
if(m.type==='report')return api('/report',{method:'POST',body:{channel:m.channel}});
throw Error('Unknown action.');}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{handle(m,sender).then(data=>reply({ok:true,data})).catch(e=>reply({ok:false,error:e.message}));return true;});
chrome.storage.onChanged.addListener(async(changes,area)=>{if(area!=='local'||!publicKeys.some(k=>changes[k]))return;const state=await chrome.storage.local.get(publicKeys);for(const tab of await chrome.tabs.query({url:'https://www.youtube.com/*'}))chrome.tabs.sendMessage(tab.id,{type:'state-update',state}).catch(()=>{});});
