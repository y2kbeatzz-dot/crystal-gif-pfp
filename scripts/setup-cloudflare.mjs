import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,mkdirSync,cpSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),server=join(root,'server');
const env={...process.env,WRANGLER_SEND_METRICS:'false',NO_COLOR:'1'};
export function parseDatabases(output){const result=JSON.parse(output.trim());if(!Array.isArray(result))throw Error('Unexpected database list from Cloudflare.');return result;}
export function serviceOrigin(output,workerName){const urls=output.match(/https:\/\/[a-z0-9.-]+\.workers\.dev\b/g)||[];const target=urls.find(value=>new URL(value).hostname.split('.')[0]===workerName);if(!target)throw Error('Could not identify the deployed Worker URL. Check Wrangler output above.');return new URL(target).origin;}
function run(file,args,{capture=false,input,cwd=server}={}){const result=spawnSync(file,args,{cwd,env,encoding:'utf8',stdio:input!==undefined?['pipe','pipe','pipe']:capture?['inherit','pipe','pipe']:'inherit',input,windowsHide:false,maxBuffer:16*1024*1024});if(result.error)throw result.error;if(result.status!==0){if(capture||input!==undefined)process.stderr.write((result.stdout||'')+(result.stderr||''));throw Error('Command failed: '+args.filter(a=>!a.includes('node_modules')).join(' '));}if(capture&&result.stderr)process.stderr.write(result.stderr);return result.stdout||'';}
const wranglerFile=join(server,'node_modules','wrangler','bin','wrangler.js');
const wr=(args,options)=>run(process.execPath,[wranglerFile,...args],options);
async function main(){if(process.platform!=='win32')throw Error('This launcher is for Windows. Follow CLOUDFLARE-SETUP.md on other systems.');if(Number(process.versions.node.split('.')[0])<22)throw Error('Install Node.js 22 or newer (LTS) from nodejs.org, then reopen this launcher.');
console.log('\nCrystal GIF PFP — Cloudflare setup\nThis deploys the crystal-shared-pfp Worker and its database to your account.\nIt does not select a paid plan or change other projects.\n');
console.log('1/7  Installing the Cloudflare command-line tool...');
run('cmd.exe',['/d','/s','/c','npm.cmd install --no-audit --no-fund']);
console.log('\n2/7  Checking your Cloudflare login...');
const who=wr(['whoami'],{capture:true});if(/not authenticated|not logged in/i.test(who))wr(['login']);else console.log('Using your existing Cloudflare login.');
console.log('\n3/7  Preparing the project database...');
const file=join(server,'wrangler.jsonc'),config=JSON.parse(readFileSync(file,'utf8'));let databases=parseDatabases(wr(['d1','list','--json'],{capture:true}));let db=databases.find(d=>d.name==='crystal-shared-pfp');
if(!db){wr(['d1','create','crystal-shared-pfp']);databases=parseDatabases(wr(['d1','list','--json'],{capture:true}));db=databases.find(d=>d.name==='crystal-shared-pfp');}
const id=db?.uuid||db?.id;if(!id||!/^[0-9a-f-]{36}$/i.test(id))throw Error('Cloudflare did not return a valid database ID.');
config.d1_databases.find(d=>d.binding==='DB').database_id=id;writeFileSync(file,JSON.stringify(config,null,2)+'\n');
wr(['d1','execute','crystal-shared-pfp','--remote','--file=schema.sql','--yes']);
console.log('\n4/7  Deploying your Worker...');const deployed=wr(['deploy'],{capture:true});console.log(deployed);const base=serviceOrigin(deployed,config.name);
console.log('\n5/7  Configuring channel verification...');
let health=await fetch(base+'/health',{signal:AbortSignal.timeout(20000)}).then(r=>r.json());
if(!health.verificationConfigured){console.log('You need a Google API key with YouTube Data API v3 enabled.\nCreate it in Google Cloud Console and restrict it to YouTube Data API v3.\nPaste it ONLY into the Cloudflare secret prompt below, never GitHub or chat.\nIf you do not have one yet, close this window and run setup again when ready.\n');wr(['secret','put','YOUTUBE_API_KEY']);}
console.log('\n6/7  Securing administration...');const secretFile=join(root,'.crystal-admin-token.txt');const admin=existsSync(secretFile)?readFileSync(secretFile,'utf8').trim():randomBytes(32).toString('hex');if(!/^[a-f0-9]{64}$/.test(admin))throw Error('The saved admin token file has an unexpected format. Preserve it and check the file.');if(!existsSync(secretFile))writeFileSync(secretFile,admin+'\n',{mode:0o600});wr(['secret','put','ADMIN_TOKEN'],{input:admin+'\n'});console.log('Private admin token saved locally in .crystal-admin-token.txt. Do not upload this file.');
health=await fetch(base+'/health',{signal:AbortSignal.timeout(20000)}).then(r=>r.json());if(health.service!=='crystal-shared-pfp'||!health.verificationConfigured)throw Error('Service health check did not pass. Rerun setup after checking the API secret.');
console.log('\n7/7  Building your shared extension...');const dist=join(root,'dist'),extension=join(dist,'Crystal-GIF-PFP-Shared');mkdirSync(dist,{recursive:true});if(existsSync(extension))rmSync(extension,{recursive:true});cpSync(join(root,'extension'),extension,{recursive:true});writeFileSync(join(extension,'config.js'),'const CONFIG = Object.freeze('+JSON.stringify({apiBase:base})+');\n');const manifest=JSON.parse(readFileSync(join(extension,'manifest.json'),'utf8'));manifest.host_permissions=[...new Set([...manifest.host_permissions,base+'/*'])];writeFileSync(join(extension,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');const zip=join(dist,'Crystal-GIF-PFP-Shared.zip');
const zipped=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Compress-Archive -Path (Join-Path $env:CRYSTAL_EXT_DIR "*") -DestinationPath $env:CRYSTAL_ZIP_PATH -Force'],{env:{...env,CRYSTAL_EXT_DIR:extension,CRYSTAL_ZIP_PATH:zip},stdio:'inherit'});if(zipped.status!==0)throw Error('Extension folder was built, but ZIP creation failed. You can load the folder directly.');
const summary='Service: '+base+'\nPrivacy: '+base+'/privacy\nShared ZIP: '+zip+'\nChrome Load unpacked folder: '+extension+'\n\nSend the SERVICE URL to your assistant (not your API key or admin token).\nVerify/publish your channel and test with a second Chrome profile before public rollout.\n';writeFileSync(join(dist,'SETUP-RESULT.txt'),summary);console.log('\nSETUP COMPLETE\n'+summary);run('explorer.exe',[dist],{cwd:root});}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){main().catch(error=>{console.error('\nSetup stopped: '+error.message+'\nYour progress is saved. Fix the issue and run SETUP-CLOUDFLARE.cmd again.');process.exitCode=1;});}
