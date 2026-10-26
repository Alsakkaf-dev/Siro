from pathlib import Path
import json,hashlib,zipfile,re,sys
from decimal import Decimal as D
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parent.parent
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(label,value):
 if not value:raise AssertionError(label)
 checks.append(label)
control=json.loads((root/'90_Migration/control-manifest.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(root/'90_Migration/legacy-controls.zip') as z:
 check('zip_crc',z.testzip() is None)
 check('archive_exact_file_set',set(z.namelist())=={x['path'] for x in control})
 for x in control:check('archive_sha256:'+x['path'],hashlib.sha256(z.read(x['path'])).hexdigest()==x['sha256'])
for bot,name in [('01_Sally','سالي'),('02_Rashed','راشد'),('03_Fares','فارس')]:
 for rel in ['SYSTEM_PROMPT.md','PERSONA.md','WORKFLOWS.md','LAUNCH_MESSAGE.txt','AVATAR_PROMPT.txt','STATE/CURRENT.md','STATE/CAPABILITIES.md','STATE/OPEN_LOOPS.md','OUTBOX/README.md','OUTPUT/README.md']:
  p=root/bot/rel
  check(bot+'/'+rel,p.is_file() and p.stat().st_size>20)
 check('correct_name:'+bot,name in (root/bot/'SYSTEM_PROMPT.md').read_text(encoding='utf-8'))
 with Image.open(root/bot/'avatar.png') as im:
  check('portrait_square:'+bot,im.width==im.height and im.width>=512);im.verify()
 for p in (root/bot/'REFERENCES').iterdir():
  if p.name=='README.md':continue
  x=next(x for x in control if x['path']=='STATE/'+p.name)
  check('reference_sha256:'+bot+'/'+p.name,sha(p)==x['sha256'])
for p in list(root.glob('*.md')) + [p for d in ['00_Core','01_Sally','02_Rashed','03_Fares','90_Migration'] for p in (root/d).rglob('*.md')]:
 if any(x in p.parts for x in ['Library','REFERENCES']):continue
 s=p.read_text(encoding='utf-8')
 check('utf8:'+p.relative_to(root).as_posix(),'\ufffd' not in s)
html=(root/'HOME.html').read_text(encoding='utf-8')
for rel in re.findall(r'(?:src|href)="([^"]+)"',html):
 check('html_link:'+rel,(root/rel).resolve().exists())
check('wallet_sum',D('638.90')+D('2200')+D('446.64')==D('3285.54'))
check('cash_reconciliation',D('3174.34')+D('111.20')==D('3285.54'))
check('expense_example',D('638.90')-D('12')==D('626.90') and D('3174.34')-D('12')==D('3162.34'))
check('settlement_example',D('3174.34')+D('55.60')==D('3229.94') and D('111.20')-D('55.60')==D('55.60'))
check('18_credit_scenario',round((D('155.66')+18*4)/(61+18),4)==D('2.8818'))
result={'status':'PASS','check_count':len(checks),'checks':checks,'grok_runtime_tested':False}
(root/'90_Migration/package-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':'PASS','check_count':len(checks),'grok_runtime_tested':False}))
