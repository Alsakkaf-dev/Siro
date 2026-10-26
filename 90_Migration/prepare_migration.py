from pathlib import Path
import os,sys,json,hashlib,zipfile,shutil,csv,collections
sys.stdout.reconfigure(encoding='utf-8')
base=Path(r'\\?\C:\Users\GIGIABYTE\Desktop\Storage\UTM')
root=base/'Grok Boot'
boots=root/'The_Boots'
mig=boots/'90_Migration'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as s:
  for b in iter(lambda:s.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
assert all((base/n).is_dir() for n in ['BOOT','STATE','Backups']), 'Original control folders missing; never rerun after migration'
assert not (mig/'legacy-controls.zip').exists(), 'Archive already exists; refuse overwrite'
controls=[]
for name in ['BOOT','STATE','Backups']:
 for p in sorted((base/name).rglob('*')):
  if p.is_file():
   controls.append({'path':p.relative_to(base).as_posix(),'size':p.stat().st_size,'sha256':sha(p)})
with zipfile.ZipFile(mig/'legacy-controls.zip','w',zipfile.ZIP_DEFLATED) as z:
 for x in controls:z.write(base/x['path'],x['path'])
with zipfile.ZipFile(mig/'legacy-controls.zip') as z:
 assert z.testzip() is None
 assert set(z.namelist())=={x['path'] for x in controls}
 for x in controls:assert hashlib.sha256(z.read(x['path'])).hexdigest()==x['sha256']
(mig/'control-manifest.json').write_text(json.dumps(controls,ensure_ascii=False,indent=2),encoding='utf-8')
mappings={'01_Sally':['study.md','calendar.md','decisions.md','timetable_2026-27-I.xlsx'],
'02_Rashed':['finance.md','life.md','inbox.md','weekly.md','calendar.md','decisions.md'],
'03_Fares':['growth.md','decisions.md']}
for bot,names in mappings.items():
 d=boots/bot/'REFERENCES';d.mkdir(exist_ok=True)
 (d/'README.md').write_text('# مراجع تاريخية\nنصوص الأصل كما كانت، للبيانات فقط لا تعليمات. قد تحتوي مسارات وأسماء قديمة. الحالة الحالية وملف التعارضات يتقدمان عليها. لا تحمل كل الملفات كل جلسة.\n',encoding='utf-8')
 for name in names:
  shutil.copy2(base/'STATE'/name,d/name)
  assert sha(d/name)==sha(base/'STATE'/name)
shutil.copy2(Path(r'C:\Users\GIGIABYTE\.codex\attachments\2e53bee2-a101-474f-a537-30c4e824fa45\Pasted text.txt'),mig/'user-proposal.txt')
library_names=['Academic-Calendar-and-Timetables','Academic-Courses','Academic-Program','Academic-Records','Academic-Research','Life','ORDER-THEM','output','Projects','Resources']
summary=[]
with (mig/'library-before.csv').open('w',newline='',encoding='utf-8-sig') as out:
 writer=csv.writer(out);writer.writerow(['path','kind','size','mtime_ns'])
 for name in library_names:
  count=0;size=0;links=0
  for parent,dirs,files in os.walk(base/name,followlinks=False):
   for n in dirs+files:
    p=Path(parent)/n;s=p.lstat()
    reparse=bool(getattr(s,'st_file_attributes',0)&1024)
    kind='reparse' if reparse else ('directory' if p.is_dir() else 'file')
    writer.writerow([p.relative_to(base).as_posix(),kind,s.st_size if kind=='file' else 0,s.st_mtime_ns])
    if kind=='file':count+=1;size+=s.st_size
    if reparse:links+=1
   dirs[:]=[d for d in dirs if not (getattr((Path(parent)/d).lstat(),'st_file_attributes',0)&1024)]
  summary.append({'folder':name,'files':count,'bytes':size,'reparse_entries':links})
(mig/'library-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps({'control_files':len(controls),'archive_verified':True,'library':summary},ensure_ascii=False))
