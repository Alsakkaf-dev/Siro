from pathlib import Path
import os,csv,json,sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path(r'\\?\C:\Users\GIGIABYTE\Desktop\Storage\UTM\Grok Boot')
boots=root/'The_Boots'
mig=boots/'90_Migration'
with (mig/'library-before.csv').open(encoding='utf-8-sig',newline='') as f:
 before={r['path']:(r['kind'],int(r['size']),int(r['mtime_ns'])) for r in csv.DictReader(f)}
after={}
names=json.loads((mig/'library-summary.json').read_text())
def onerror(error):raise error
for item in names:
 for parent,dirs,files in os.walk(root/'Library'/item['folder'],followlinks=False,onerror=onerror):
  for n in dirs+files:
   p=Path(parent)/n;s=p.lstat()
   reparse=bool(getattr(s,'st_file_attributes',0)&1024)
   kind='reparse' if reparse else ('directory' if p.is_dir() else 'file')
   after[p.relative_to(root/'Library').as_posix()]=(kind,s.st_size if kind=='file' else 0,s.st_mtime_ns)
  dirs[:]=[d for d in dirs if not (getattr((Path(parent)/d).lstat(),'st_file_attributes',0)&1024)]
missing=sorted(set(before)-set(after));extra=sorted(set(after)-set(before))
directory_metadata_changes=[p for p in before.keys()&after.keys() if before[p][0]==after[p][0]=='directory' and before[p]!=after[p]]
changed=[p for p in before.keys()&after.keys() if before[p]!=after[p] and p not in directory_metadata_changes]
result={'status':'PASS' if not(missing or extra or changed) else 'FAIL','entries_before':len(before),'entries_after':len(after),
'files':sum(x[0]=='file' for x in after.values()),'bytes':sum(x[1] for x in after.values()),
'missing':missing,'extra':extra,'changed':changed,'directory_metadata_changes':directory_metadata_changes,'verification':'paths, type, size, mtime_ns; same-volume directory moves; no full-library content hash'}
(mig/'library-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
if result['status']!='PASS':sys.exit(1)
