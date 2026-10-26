import sys
sys.stdout.reconfigure(encoding='utf-8')
import pathlib, re, json, zipfile, xml.etree.ElementTree as E, hashlib
from decimal import Decimal, ROUND_HALF_UP
p = pathlib.Path(__file__).resolve().parent
baseline = {str(f.relative_to(p)): {'sha256': hashlib.sha256(f.read_bytes()).hexdigest(), 'mtime': f.stat().st_mtime_ns} for f in p.rglob('*') if f.is_file() and not f.name.startswith('maintenance_')}
(p/'maintenance_baseline.json').write_text(json.dumps(baseline), encoding='utf-8')
f = p/'Mohammed-Path-2030.html'
raw = f.read_bytes()
h = raw.decode('utf-8')
m = re.search(r'const PATH = (.*?);\s*const STORAGE_KEY', h, re.S)
d = json.loads(m.group(1))
z = zipfile.ZipFile(p/d['source'])
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ss = [''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
records = {}
for row in E.fromstring(z.read('xl/worksheets/sheet3.xml')).findall('.//m:row',ns)[1:]:
    cells = {}
    for c in row:
        v = c.find('m:v', ns)
        value = ss[int(v.text)] if c.get('t') == 's' else ''.join(c.itertext())
        cells[re.sub(r'\d', '', c.attrib['r'])] = value
    if cells.get('K'):
        records.setdefault(cells['K'], set()).add(cells.get('C',''))
def seconds(hms):
    hh,mm,ss = map(int,hms.split(':'))
    return hh*3600+mm*60+ss
def rounded(value):
    return float(Decimal(str(value)).quantize(Decimal('.01'), rounding=ROUND_HALF_UP))
def hms(n):
    return f'{n//3600}:{n//60%60:02}:{n%60:02}'
changes = []
for s in d['stages']:
    videos = [v for g in s['groups'] for v in g['videos']]
    duration = 0
    for v in videos:
        assert v['id'] in records, f'Missing video: {v["id"]}'
        assert len(records[v['id']]) == 1, f'Conflicting durations: {v["id"]}'
        duration_text = next(iter(records[v['id']]))
        assert seconds(v['hms']) == seconds(duration_text), f'Video duration mismatch: {v["id"]}'
        duration += seconds(duration_text)
    for key, expected in [('hours',rounded(Decimal(duration)/3600)),('seconds',duration),('exact_hms',hms(duration)),('video_count',len(videos))]:
        assert s[key] == expected, f'Stage {s["stage"]} {key}: {s[key]} != {expected}'
assert d['stage_count'] == len(d['stages']) == 18
assert d['total_videos'] == sum(s['video_count'] for s in d['stages'])
assert d['total_hms'] == hms(sum(s['seconds'] for s in d['stages']))
total = rounded(sum(Decimal(str(s['hours'])) for s in d['stages']))
if d['total_hours'] != total:
    changes.append(f'total_hours: {d["total_hours"]} -> {total}')
    new_path, count = re.subn(r'("total_hours"\s*:\s*)[0-9.]+',lambda x:x.group(1)+str(total),m.group(1), count=1)
    assert count == 1
    updated = h[:m.start(1)] + new_path + h[m.end(1):]
    f.write_bytes(updated.encode('utf-8'))
    d['total_hours'] = total
estimates = [5,3,6,8,3,8,12,10,6,8,16,8,12,12,6,10,6,40]
out = {k:d[k] for k in ['source','stage_count','total_hours','total_videos']}
out['total_practice_hours_estimate'] = sum(estimates)
out['note'] = 'hours = video time from the Excel sheet; practice_hours_estimate = estimate only'
out['stages'] = [{**{k:s[k] for k in ['stage','title','hours','video_count','practice_task']}, 'practice_hours_estimate':estimate} for s,estimate in zip(d['stages'],estimates)]
(p/'stages.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
readme = '''# مسار محمد 2030

- `Mohammed-Path-2030.html`: صفحة المشاهدة والتطبيق وحفظ التقدم.
- `stages.json`: ملخص مطابق لبيانات الصفحة، مع تقدير مستقل لساعات التطبيق لا يظهر في الصفحة.
- `README.md`: شرح مختصر لملفات المسار وطريقة استخدامه.
- `data\\`: مجلد مصدر البيانات.
- `data\\Complete_YouTube_Course_Library_updated.xlsx`: مكتبة الفيديوهات ومددها وروابطها، للقراءة فقط.
- `progress\\`: مجلد حفظ ملفات التقدم المصدّرة من الصفحة.

'''
readme += f'المراحل: {d["stage_count"]} | ساعات الفيديو: {total:.2f} | الفيديوهات: {d["total_videos"]} | ساعات التطبيق التقديرية: {sum(estimates)}.\n'
readme += 'ساعات الفيديو مأخوذة من Excel؛ ساعات التطبيق تقدير فقط وقد تختلف حسب الخبرة وسرعة التنفيذ، وتشمل مسائل Java المطلوبة.\n\n'
readme += '\n'.join(f'{s["stage"]}. {s["title"]}' for s in d['stages'])
readme += '''

التحقق والاختبارات يأتيان قبل الخلفية (backend). تبدأ ممارسة LeetCode أو HackerRank بلغة Java من مرحلة هياكل البيانات والخوارزميات وتستمر بعدها. تشمل مرحلة الأمان OWASP Top 10. تتضمن الصفحة قسم «فرص سعودية».

تُفتح المرحلة التالية بعد إتمام المشاهدة المطلوبة والتطبيق. التقدم محفوظ في المتصفح؛ صدّره إلى `progress\\` بعد كل مرحلة، واستورده عند الحاجة لاستعادته.

آخر تحديث: 2026-10-15
'''
(p/'README.md').write_text(readme,encoding='utf-8')
page = json.loads(re.search(r'const PATH = (.*?);\s*const STORAGE_KEY',f.read_text(encoding='utf-8'),re.S).group(1))
saved = json.loads((p/'stages.json').read_text(encoding='utf-8'))
for key in ['source','stage_count','total_hours','total_videos']: assert saved[key] == page[key]
for a,b in zip(page['stages'],saved['stages']):
    for key in ['stage','title','hours','video_count','practice_task']: assert a[key] == b[key]
assert saved['total_practice_hours_estimate'] == sum(s['practice_hours_estimate'] for s in saved['stages'])
assert hashlib.sha256((p/d['source']).read_bytes()).hexdigest() == baseline[d['source'].replace('/',str(pathlib.os.sep))]['sha256']
print(json.dumps({'verified_videos':sum(s['video_count'] for s in d['stages']),'changes':changes,'total_hours':total,'practice_hours':sum(estimates),'field_comparison':'PASS'},ensure_ascii=False))
