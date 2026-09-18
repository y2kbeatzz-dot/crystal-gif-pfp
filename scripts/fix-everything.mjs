import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync,readdirSync,cpSync} from 'node:fs';
import {join,resolve,dirname,isAbsolute} from 'node:path';
import {tmpdir,homedir} from 'node:os';

const HOME=homedir();
const LOCALAPPDATA=process.env.LOCALAPPDATA||'';
const work=join(tmpdir(),'crystal-gif-pfp-fix-everything');
const zipPath=join(work,'latest.zip');
const extractRoot=join(work,'repo');
const latestUrl='https://codeload.github.com/y2kbeatzz-dot/crystal-gif-pfp/zip/refs/heads/main';
const healthUrl='https://crystal-shared-pfp.crystal999bots.workers.dev/health';

function banner(s){console.log('\n=== '+s+' ===');}
function run(cmd,args,cwd,allowFail=false){
  console.log('> '+cmd+' '+args.join(' '));
  const r=spawnSync(cmd,args,{cwd,stdio:'inherit',windowsHide:false});
  if(r.error)throw r.error;
  if(r.status!==0&&!allowFail)throw new Error(cmd+' exited with code '+r.status);
  return r.status===0;
}
function capture(cmd,args,cwd){
  const r=spawnSync(cmd,args,{cwd,encoding:'utf8',windowsHide:true});
  if(r.error)throw r.error;
  if(r.status!==0)throw new Error((r.stderr||r.stdout||cmd+' failed').trim());
  return {out:r.stdout||'',err:r.stderr||''};
}
function psQuote(s){return "'"+String(s).replaceAll("'","''")+"'";}
function parseWranglerJson(out,err=''){
  for(const text of [out,out+err]){
    const t=text.trim();
    try{return JSON.parse(t);}catch{}
    const a=t.indexOf('['),b=t.lastIndexOf(']');
    if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch{}}
    const c=t.indexOf('{'),d=t.lastIndexOf('}');
    if(c>=0&&d>c){try{return JSON.parse(t.slice(c,d+1));}catch{}}
  }
  throw new Error('Could not parse Wrangler JSON output.');
}
function databaseArray(v){
  if(Array.isArray(v))return v;
  for(const k of ['d1_databases','databases','result'])if(Array.isArray(v?.[k]))return v[k];
  return [];
}
function manifestMatches(p){
  try{
    const m=JSON.parse(readFileSync(join(p,'manifest.json'),'utf8'));
    return /Crystal GIF PFP/i.test(m.name||'');
  }catch{return false;}
}
function addCandidate(set,p){
  if(!p||!isAbsolute(p))return;
  const q=resolve(p);
  if(q.startsWith(resolve(work)))return;
  if(existsSync(join(q,'manifest.json'))&&manifestMatches(q))set.add(q);
}
function scanChromeLoadedExtensions(){
  const found=new Set();
  if(!LOCALAPPDATA)return found;
  const userData=join(LOCALAPPDATA,'Google','Chrome','User Data');
  if(!existsSync(userData))return found;
  let profiles=[];
  try{
    profiles=readdirSync(userData,{withFileTypes:true})
      .filter(x=>x.isDirectory()&&(x.name==='Default'||x.name.startsWith('Profile ')))
      .map(x=>join(userData,x.name));
  }catch{}
  for(const profile of profiles){
    for(const prefName of ['Secure Preferences','Preferences']){
      const f=join(profile,prefName);
      if(!existsSync(f))continue;
      try{
        const j=JSON.parse(readFileSync(f,'utf8'));
        const settings=j?.extensions?.settings||{};
        for(const entry of Object.values(settings)){
          if(!entry||typeof entry!=='object')continue;
          const paths=[];
          if(typeof entry.path==='string'){
            paths.push(entry.path);
            if(!isAbsolute(entry.path)){
              paths.push(resolve(profile,entry.path));
              paths.push(resolve(userData,entry.path));
            }
          }
          for(const p of paths)addCandidate(found,p);
        }
      }catch{}
    }
  }
  return found;
}
function scanKnownFolders(found){
  const candidates=[
    join(HOME,'Downloads','crystal-gif-pfp-main','extension'),
    join(HOME,'Downloads','crystal-gif-pfp-main (1)','crystal-gif-pfp-main','extension'),
    join(HOME,'Downloads','crystal-gif-pfp-main (1)','crystal-gif-pfp-main','dist','Crystal-GIF-PFP-Shared'),
    join(HOME,'Downloads','Crystal-GIF-PFP-Shared')
  ];
  for(const p of candidates)addCandidate(found,p);
  const downloads=join(HOME,'Downloads');
  function walk(dir,depth){
    if(depth<0||!existsSync(dir))return;
    let ents=[];try{ents=readdirSync(dir,{withFileTypes:true});}catch{return;}
    for(const e of ents){
      if(!e.isDirectory())continue;
      const p=join(dir,e.name);
      if(/crystal.*gif|gif.*pfp/i.test(e.name))addCandidate(found,p);
      if(depth>0&&/crystal|gif|pfp/i.test(e.name))walk(p,depth-1);
    }
  }
  walk(downloads,4);
}
function updateExtensionCopies(latestExtension){
  banner('Updating Chrome extension files');
  const found=scanChromeLoadedExtensions();
  scanKnownFolders(found);
  if(!found.size){
    const fresh=join(HOME,'Crystal-GIF-PFP','extension');
    mkdirSync(dirname(fresh),{recursive:true});
    cpSync(latestExtension,fresh,{recursive:true,force:true});
    console.log('No existing unpacked path was detected.');
    console.log('Created a fresh extension folder at:');
    console.log('  '+fresh);
    return [fresh];
  }
  const updated=[];
  for(const target of found){
    const backup=target+'-backup-before-v2.2.1';
    try{
      if(!existsSync(backup))cpSync(target,backup,{recursive:true,force:true});
      cpSync(latestExtension,target,{recursive:true,force:true});
      console.log('Updated: '+target);
      updated.push(target);
    }catch(e){console.warn('Could not update '+target+': '+e.message);}
  }
  if(!updated.length)throw new Error('Crystal was found, but its extension folder could not be updated.');
  return updated;
}
function openExtensions(paths){
  const possible=[
    join(process.env.PROGRAMFILES||'','Google','Chrome','Application','chrome.exe'),
    join(process.env['PROGRAMFILES(X86)']||'','Google','Chrome','Application','chrome.exe'),
    join(LOCALAPPDATA||'','Google','Chrome','Application','chrome.exe')
  ].filter(Boolean);
  const chrome=possible.find(existsSync);
  if(chrome)spawnSync(chrome,['chrome://extensions'],{stdio:'ignore',windowsHide:true});
  else spawnSync('cmd.exe',['/c','start','','chrome','chrome://extensions'],{stdio:'ignore',windowsHide:true});
  if(paths[0])spawnSync('explorer.exe',[paths[0]],{stdio:'ignore',windowsHide:true});
}

console.log('Crystal GIF PFP v2.2.1 — FIX EVERYTHING');
rmSync(work,{recursive:true,force:true});
mkdirSync(extractRoot,{recursive:true});

banner('Downloading the newest GitHub build');
const res=await fetch(latestUrl,{redirect:'follow'});
if(!res.ok)throw new Error('GitHub download failed: HTTP '+res.status);
writeFileSync(zipPath,Buffer.from(await res.arrayBuffer()));
console.log('Downloaded latest source.');

banner('Extracting');
run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',`Expand-Archive -LiteralPath ${psQuote(zipPath)} -DestinationPath ${psQuote(extractRoot)} -Force`],work);
const repo=join(extractRoot,'crystal-gif-pfp-main');
const server=join(repo,'server');
const latestExtension=join(repo,'extension');
if(!existsSync(join(latestExtension,'manifest.json')))throw new Error('Latest extension files were not found after extraction.');

const updatedPaths=updateExtensionCopies(latestExtension);

banner('Preparing Cloudflare');
run('npm.cmd',['install'],server);
if(!run('npx.cmd',['wrangler','whoami'],server,true)){
  console.log('Cloudflare needs authorization. A browser window may open.');
  run('npx.cmd',['wrangler','login'],server);
}

banner('Finding your existing D1 database');
const listed=capture('npx.cmd',['wrangler','d1','list','--json'],server);
const parsed=parseWranglerJson(listed.out,listed.err);
const db=databaseArray(parsed).find(x=>x?.name==='crystal-shared-pfp');
if(!db)throw new Error('No existing D1 database named crystal-shared-pfp was found. The updater intentionally did NOT create a second database.');
const databaseId=db.uuid||db.id||db.database_id;
if(!databaseId)throw new Error('Wrangler found crystal-shared-pfp but did not return its database ID.');
console.log('Using existing D1 database: '+databaseId);

const cfgPath=join(server,'wrangler.jsonc');
const liveCfgPath=join(server,'.wrangler.live.jsonc');
const cfg=JSON.parse(readFileSync(cfgPath,'utf8'));
if(!Array.isArray(cfg.d1_databases)||!cfg.d1_databases.length)throw new Error('The Worker config has no D1 binding.');
cfg.d1_databases[0].database_id=databaseId;
writeFileSync(liveCfgPath,JSON.stringify(cfg,null,2)+'\n');

banner('Applying database schema');
run('npx.cmd',['wrangler','d1','execute','crystal-shared-pfp','--remote','--file','schema.sql','--config','.wrangler.live.jsonc'],server);

banner('Deploying Worker v4');
run('npx.cmd',['wrangler','deploy','--config','.wrangler.live.jsonc'],server);

banner('Checking live service');
const hres=await fetch(healthUrl,{cache:'no-store'});
let health={};try{health=await hres.json();}catch{}
console.log(JSON.stringify(health,null,2));
if(!hres.ok||Number(health.version)<4)throw new Error('Cloudflare deployed, but '+healthUrl+' is not reporting Worker v4 or newer.');

banner('SUCCESS');
console.log('Worker v'+health.version+' is live.');
console.log('Community viewing now matches by YouTube channel, not fragile avatar URL variants.');
console.log('Google CDN hostname differences are normalized too.');
console.log('');
console.log('Updated extension folder(s):');
for(const p of updatedPaths)console.log('  '+p);
console.log('');
console.log('Chrome Extensions is opening now.');
console.log('Click Reload on Crystal GIF PFP in BOTH Chrome profiles, then refresh YouTube.');
console.log('');
console.log('Main profile: choose GIF -> Share my GIF -> @handle -> Share.');
console.log("Other profile: only enable See other members' GIFs. Sign-in is not required.");
openExtensions(updatedPaths);
