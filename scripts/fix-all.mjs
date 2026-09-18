import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const server=resolve(root,'server');
const configSrc=resolve(server,'wrangler.jsonc');
const liveConfig=resolve(server,'.wrangler.live.jsonc');

function run(cmd,args,cwd=server,allowFail=false){
  console.log('\n> '+cmd+' '+args.join(' '));
  const r=spawnSync(cmd,args,{cwd,stdio:'inherit',shell:false});
  if(r.error) throw r.error;
  if(r.status!==0&&!allowFail) throw new Error(cmd+' exited with code '+r.status);
  return r.status===0;
}
function capture(cmd,args,cwd=server){
  const r=spawnSync(cmd,args,{cwd,encoding:'utf8',windowsHide:false});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error((r.stderr||r.stdout||cmd+' failed').trim());
  return (r.stdout||'')+(r.stderr||'');
}
function parseArray(text){
  const start=text.indexOf('['),end=text.lastIndexOf(']');
  if(start<0||end<start) throw new Error('Could not parse Wrangler D1 list output.');
  return JSON.parse(text.slice(start,end+1));
}

console.log('Crystal GIF PFP v2.2 — repair + Cloudflare deploy');
console.log('Project: '+root);

if(!existsSync(resolve(root,'extension','manifest.json'))) throw new Error('extension/manifest.json is missing.');
if(!existsSync(resolve(server,'worker.mjs'))) throw new Error('server/worker.mjs is missing.');

run('npm.cmd',['install'],server);

if(!run('npx.cmd',['wrangler','whoami'],server,true)){
  console.log('\nCloudflare authorization is required. Your browser may open.');
  run('npx.cmd',['wrangler','login'],server);
}

console.log('\nFinding your existing crystal-shared-pfp D1 database...');
const list=parseArray(capture('npx.cmd',['wrangler','d1','list','--json'],server));
const db=list.find(x=>x.name==='crystal-shared-pfp');
if(!db) throw new Error('No existing D1 database named crystal-shared-pfp was found. Nothing was created, so your current Cloudflare setup was not changed.');
const databaseId=db.uuid||db.id||db.database_id;
if(!databaseId) throw new Error('Found the database, but Wrangler did not return its ID.');
console.log('Using existing D1 database: '+databaseId);

const raw=readFileSync(configSrc,'utf8');
const cfg=JSON.parse(raw);
if(!Array.isArray(cfg.d1_databases)||!cfg.d1_databases.length) throw new Error('wrangler.jsonc has no D1 binding.');
cfg.d1_databases[0].database_id=databaseId;
writeFileSync(liveConfig,JSON.stringify(cfg,null,2)+'\n');

console.log('\nApplying the idempotent database schema...');
run('npx.cmd',['wrangler','d1','execute','crystal-shared-pfp','--remote','--file','schema.sql','--config','.wrangler.live.jsonc'],server);

console.log('\nDeploying the current Worker...');
run('npx.cmd',['wrangler','deploy','--config','.wrangler.live.jsonc'],server);

console.log('\nChecking the live service...');
const healthUrl='https://crystal-shared-pfp.crystal999bots.workers.dev/health';
const res=await fetch(healthUrl,{cache:'no-store'});
const health=await res.json();
console.log(JSON.stringify(health,null,2));
if(!res.ok||Number(health.version)<4) throw new Error('Deploy finished, but the live service is not Worker v4 yet.');

console.log('\nSUCCESS: Cloudflare Worker v'+health.version+' is live.');
console.log('Viewer matching is now channel-based, so different YouTube avatar CDN URLs no longer block shared GIFs.');
console.log('\nNext: in chrome://extensions click Reload on Crystal GIF PFP, then refresh BOTH YouTube windows.');
console.log('Publisher: choose GIF -> Share my GIF -> enter handle -> publish.');
console.log('Viewer: only enable See other members\' GIFs. No sign-in or local GIF is required.');

spawnSync('cmd.exe',['/c','start','','chrome','chrome://extensions'],{stdio:'ignore',windowsHide:true});
spawnSync('explorer.exe',[resolve(root,'extension')],{stdio:'ignore',windowsHide:true});
