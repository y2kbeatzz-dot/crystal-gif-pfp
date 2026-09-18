(()=>{
if(globalThis.__crystalPfpLoaded)return;
globalThis.__crystalPfpLoaded=true;
let settings={},timer,picking=false,notice;
const shared=new Map(), checked=new Map();let fetching=false;let viewerDebug={pageRef:'',refs:0,profiles:0,downloaded:0,applied:0,lastError:''};
async function message(type,values={}){const r=await chrome.runtime.sendMessage({type,...values});if(!r?.ok)throw Error(r?.error||'Extension unavailable');return r.data;}
function channelRef(href){try{const u=new URL(href,location.href);if(u.hostname!=='www.youtube.com'&&u.hostname!=='youtube.com')return '';const path=decodeURIComponent(u.pathname);const id=path.match(/^\/channel\/(UC[\w-]{22})(?:\/|$)/);if(id)return id[1];const handle=path.match(/^\/(@[^/?#]+)(?:\/|$)/);return handle?handle[1].toLowerCase():'';}catch{return '';}}
function imageRef(img){
  const direct=img.closest('a[href]');
  if(direct){const r=channelRef(direct.href);if(r)return r;}
  const comment=img.closest('ytd-comment-view-model,ytd-comment-renderer');
  if(comment){const a=comment.querySelector('#author-text[href]');if(a){const r=channelRef(a.href);if(r)return r;}}
  const page=channelRef(location.href);
  if(!page)return '';
  if(img.closest('yt-page-header-renderer,ytd-c4-tabbed-header-renderer,#page-header-container,#page-header,yt-avatar-shape,.page-header-view-model-wiz__page-header-image'))return page;
  // YouTube regularly changes channel-header wrappers. Fall back to the large,
  // near-square image in the upper part of a channel page.
  const r=img.getBoundingClientRect();
  // Channel layouts vary depending on sidebar width, window size, account state,
  // and YouTube experiments. Identify the large channel avatar by geometry,
  // while excluding navigation/account UI.
  const inUi=img.closest('#masthead,#guide,#avatar-btn,ytd-mini-guide-renderer,ytd-guide-renderer');
  const square=Math.abs(r.width-r.height)<16;
  const largeAvatar=r.width>=72&&r.width<=320&&r.height>=72&&r.height<=320;
  const inHeaderBand=r.top>=70&&r.top<720&&r.left>=0&&r.left<Math.min(innerWidth*0.72,1100);
  if(!inUi&&square&&largeAvatar&&inHeaderBand)return page;
  return '';
}
function desired(img,originalKey){
  if(settings.enabled!==false&&settings.gif&&originalKey===settings.target)return settings.gif;
  if(!settings.sharedEnabled)return null;
  const r=imageRef(img),p=shared.get(r);
  // A channel can be rendered by YouTube with different avatar CDN URLs/sizes
  // on different accounts/layouts. Channel identity is the lookup key; do not
  // reject a published GIF only because the avatar image URL variant changed.
  return p&&p.until>Date.now()&&!(settings.blocked||[]).includes(p.channel)?p.gif:null;
}
async function loadShared(refs){if(fetching||!settings.sharedEnabled)return;const pending=[...refs].filter(r=>(checked.get(r)||0)<Date.now()).slice(0,40);if(!pending.length)return;fetching=true;for(const r of pending)checked.set(r,Date.now()+60000);try{const profiles=await message('lookup',{refs:pending});viewerDebug.profiles=profiles.length;viewerDebug.downloaded=profiles.filter(p=>!!p.gif).length;viewerDebug.lastError='';for(const r of pending)shared.delete(r);for(const p of profiles){const value={...p,until:Date.now()+120000};shared.set(p.channel,value);if(p.handle)shared.set(p.handle,value);}while(shared.size>200)shared.delete(shared.keys().next().value);while(checked.size>500)checked.delete(checked.keys().next().value);}catch(e){viewerDebug.lastError=e?.message||'Lookup failed';}finally{fetching=false;schedule();}}

const changed=new Map();
function key(src){try{const u=new URL(src,location.href);if(!/(^|\.)(ggpht\.com|googleusercontent\.com)$/.test(u.hostname))return '';return u.pathname.replace(/=.+$/,'');}catch{return '';}}
function restore(img,v){if(img.getAttribute('src')===v.applied){if(v.src===null)img.removeAttribute('src');else img.setAttribute('src',v.src);if(v.srcset!==null)img.setAttribute('srcset',v.srcset);}changed.delete(img);}
function scan(){timer=null;const refs=new Set();const pageRef=channelRef(location.href);viewerDebug.pageRef=pageRef;if(pageRef)refs.add(pageRef);viewerDebug.applied=0;
for(const [img,v] of changed){if(!img.isConnected){restore(img,v);continue;}if(img.getAttribute('src')!==v.applied){changed.delete(img);continue;}if(img.hasAttribute('srcset')){v.srcset=img.getAttribute('srcset');img.removeAttribute('srcset');}if(desired(img,v.key)!==v.applied)restore(img,v);}
for(const img of document.querySelectorAll('img')){const r=imageRef(img);if(r)refs.add(r);if(changed.has(img))continue;const k=key(img.getAttribute('src')||img.currentSrc),gif=desired(img,k);if(!gif)continue;changed.set(img,{src:img.getAttribute('src'),srcset:img.getAttribute('srcset'),key:k,applied:gif});img.removeAttribute('srcset');img.src=gif;viewerDebug.applied++;}
viewerDebug.refs=refs.size;loadShared(refs);}
function schedule(){if(!timer)timer=setTimeout(scan,120);}
function toast(text){if(!notice){notice=document.createElement('div');notice.setAttribute('role','status');Object.assign(notice.style,{position:'fixed',top:'80px',left:'50%',transform:'translateX(-50%)',zIndex:'2147483647',padding:'16px 22px',borderRadius:'14px',background:'#261a38',color:'#ffffff',font:'15px system-ui',boxShadow:'0 8px 30px #0008',pointerEvents:'none'});document.documentElement.append(notice);}notice.textContent=text;}
function stop(){picking=false;document.removeEventListener('click',pick,true);document.removeEventListener('keydown',escape,true);if(notice){notice.remove();notice=null;}}
function escape(e){if(e.key==='Escape'){e.preventDefault();stop();}}
async function pick(e){if(!picking)return;e.preventDefault();e.stopImmediatePropagation();const el=e.target instanceof Element?e.target:null;const img=el?.closest('img')||el?.closest('yt-img-shadow,#avatar-btn,#avatar')?.querySelector('img');const k=img&&(changed.get(img)?.key||key(img.getAttribute('src')||img.currentSrc));if(!k){toast('Click directly on your profile picture. Press Esc to cancel.');return;}try{const accountAvatar=!!img.closest('#avatar-btn');await message('local-selection',{target:k,accountAvatar});settings.target=k;settings.accountAvatar=accountAvatar;settings.enabled=true;schedule();if(accountAvatar)toast('Signed-in profile picture selected. You can share with the community now.');else toast('Picture selected for local mode. For community sharing, select your top-right signed-in avatar.');setTimeout(stop,900);}catch{toast('Could not save. Refresh YouTube and try again. Esc cancels.');}}
chrome.runtime.onMessage.addListener((m,s,reply)=>{
  if(m.type==='state-update'){settings=m.state;checked.clear();schedule();reply({ok:true});return;}
  if(m.type==='pick-avatar'){stop();picking=true;toast('Click the picture you want to animate. Press Esc to cancel.');document.addEventListener('click',pick,true);document.addEventListener('keydown',escape,true);reply({ok:true});return;}
  if(m.type==='get-account-avatar'){
    const img=document.querySelector('#avatar-btn img');
    const k=img&&(changed.get(img)?.key||key(img.getAttribute('src')||img.currentSrc));
    reply({ok:true,key:k||''});
    return;
  }
  if(m.type==='viewer-debug'){reply({ok:true,debug:{...viewerDebug,sharedEntries:shared.size,checkedEntries:checked.size}});return;}
  if(m.type==='force-community-refresh'){shared.clear();checked.clear();viewerDebug={pageRef:channelRef(location.href),refs:0,profiles:0,downloaded:0,applied:0,lastError:''};schedule();reply({ok:true});return;}
});
message('state').then(s=>{settings=s;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset','href']});
// YouTube replaces avatar nodes during navigation and hydrates images later.
for(const event of ['yt-navigate-finish','yt-page-data-updated','yt-player-updated','yt-navigate-cache'])document.addEventListener(event,schedule);
addEventListener('pageshow',schedule);
addEventListener('popstate',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
document.addEventListener('load',e=>{if(e.target instanceof HTMLImageElement)schedule();},true);
// Repair missed updates without resetting an already animated image.
setInterval(()=>{if(!document.hidden&&((settings.gif&&settings.enabled!==false)||settings.sharedEnabled))schedule();},2000);
})();
