"""عقد 3D-10: نقاط المحطات السبع (cam_station_*)، المواقد burner_1..4، ونقاط الإسقاط drop_*. المواضع بإحداثيات Blender (Z لأعلى)؛ look بإحداثيات glTF (Y لأعلى) في extras."""
from lib import *

def g(v): return (v[0], v[2], -v[1])  # Blender → glTF

STATIONS = {
    'shelves': ((-0.9, 1.5, 1.6), (-0.9, 2.9, 1.2)), 'equipment': ((1.6, -2.1, 1.6), (1.6, -2.95, 1.0)), 'tools': ((2.8, -1.0, 1.65), (3.9, -1.0, 1.1)),
    'prep': ((-0.3, -1.5, 1.7), (-0.3, -0.4, 0.95)), 'stove': ((2.5, -0.95, 1.7), (3.52, -0.95, 0.95)), 'sink': ((2.5, 1.9, 1.65), (3.4, 2.45, 0.95)), 'serve': ((-1.2, -1.2, 1.6), (-1.2, 0.3, 0.95)),
}
# (x0, x1, y0, y1, ارتفاع) بإحداثيات Blender؛ الأجسام الأخرى (الجزيرة، الكاونتر، الثلاجة…) تُؤخذ من PRP_* غير المدمجة
COLLIDERS = {'boxes_a': (2.15, 2.65, -3.1, -2.7, 0.63), 'boxes_c': (-3.58, -3.02, 2.62, 3.08, 0.40), 'barrels': (-3.40, -2.25, -3.20, -2.55, 0.88)}
BURNERS = [(3.52, -1.45), (3.52, -0.95), (3.52, -0.45), (3.52, 0.05)]

def build(C):
    K = C['CONTRACT']
    for name, (eye, look) in STATIONS.items():
        e = empty(f'cam_station_{name}', K, eye, kind='ARROWS', size=0.2); e['look'] = list(g(look)); e['eye'] = list(g(eye))
    for i, (x, y) in enumerate(BURNERS):
        e = empty(f'burner_{i+1}', K, (x, y, 0.95), kind='CIRCLE', size=0.07); e['socket'] = 'burner'
    for name, p in {'prep': (-0.9, -0.4, 0.93), 'sink': (3.4, 2.45, 0.92), 'serve': (-1.2, 0.3, 0.93), 'trash': (1.9, -2.95, 0.64)}.items():
        e = empty(f'drop_{name}', K, p, kind='CUBE', size=0.1)
    # مصادمات صريحة (مستطيلات): COL_* بـextras {min,max} بإحداثيات glTF؛ تُقرأ في الويب لمنع المشي عبر الأجسام ولأسطح الفيزياء.
    # (الأجسام المدمجة المتناثرة كالصناديق لا يصحّ أخذ صندوق إحاطتها)
    for name, (x0, x1, y0, y1, h) in COLLIDERS.items():
        e = empty(f'COL_{name}', K, ((x0+x1)/2, (y0+y1)/2, h/2), kind='CUBE', size=0.05)
        e['min'] = [x0, 0.0, -y1]; e['max'] = [x1, h, -y0]
    # نقطة بدء اللاعب (أمام الجزيرة بعيدًا عن رف المعدات)
    e = empty('spawn_player', K, (0.0, -2.0, 0.0), kind='ARROWS', size=0.3)
