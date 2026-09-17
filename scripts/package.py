"""Build the installable extension; pin an HTTPS API origin for shared builds."""
import argparse,json,zipfile,shutil,tempfile
from pathlib import Path
from urllib.parse import urlparse
root=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--api');a.add_argument('--output',default=str(root/'dist/Crystal-GIF-PFP.zip'));args=a.parse_args()
with tempfile.TemporaryDirectory() as t:
 e=Path(t)/'extension';shutil.copytree(root/'extension',e)
 if args.api:
  u=urlparse(args.api)
  if u.scheme!='https' or not u.netloc or u.username or u.password or u.query or u.fragment or u.path not in ('','/'):
   raise SystemExit('Pass a plain HTTPS service origin, without a path or credentials.')
  base='https://'+u.netloc
  (e/'config.js').write_text('const CONFIG = Object.freeze('+json.dumps({'apiBase':base})+');\n')
  m=json.loads((e/'manifest.json').read_text());m['host_permissions'].append(base+'/*');(e/'manifest.json').write_text(json.dumps(m,indent=2))
 output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
  for f in sorted(e.rglob('*')):
   if f.is_file():z.write(f,f.relative_to(e))
 with zipfile.ZipFile(output) as z:assert z.testzip() is None and 'manifest.json' in z.namelist()
 print(output)
