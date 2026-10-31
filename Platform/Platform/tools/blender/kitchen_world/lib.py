"""مساعدات بناء عالم المطبخ (Blender 5.x، bpy). المقياس بالمتر، Z لأعلى؛ التصدير إلى glTF يحوّله إلى Y لأعلى."""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, Euler

_noise_tex = {}

def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i+2], 16)/255.0 for i in (0, 2, 4)]
    return tuple((x/12.92 if x <= 0.04045 else ((x+0.055)/1.055)**2.4) for x in c)

def coll(name, parent=None):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(c)
    return c

def _principled(m):
    m.use_nodes = True
    return m.node_tree.nodes.get('Principled BSDF')

def mat(name, hexcol, rough=0.5, metal=0.0, emit=None, es=0.0, alpha=None):
    """مادة Principled بقيم صرفة (آمنة للتصدير إلى glTF)"""
    m = bpy.data.materials.get(name)
    if m is not None:
        return m
    m = bpy.data.materials.new(name); b = _principled(m); rgb = srgb(hexcol)
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*srgb(emit), 1); b.inputs['Emission Strength'].default_value = es
    if alpha is not None:
        b.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
    m.diffuse_color = (*rgb, 1)
    return m

def proc_color(m, kind, scale=6.0, c1='#000000', c2='#ffffff', detail=6.0, rough=None, bump=0.0, stretch=None):
    """يربط نسيجًا إجرائيًا بلون المادة (للمعاينة وللخَبز لاحقًا): kind = noise|wave|voronoi|checker"""
    nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N.get('Principled BSDF')
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = stretch or (1, 1, 1)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    if kind == 'noise':
        t = N.new('ShaderNodeTexNoise'); t.inputs['Scale'].default_value = scale; t.inputs['Detail'].default_value = detail
        out = t.outputs['Fac']
    elif kind == 'wave':
        t = N.new('ShaderNodeTexWave'); t.inputs['Scale'].default_value = scale; t.inputs['Distortion'].default_value = 3.0; t.inputs['Detail'].default_value = 3.0
        out = t.outputs['Fac']
    elif kind == 'voronoi':
        t = N.new('ShaderNodeTexVoronoi'); t.inputs['Scale'].default_value = scale
        out = t.outputs['Distance']
    else:
        t = N.new('ShaderNodeTexChecker'); t.inputs['Scale'].default_value = scale
        out = t.outputs['Fac']
    L.new(mp.outputs['Vector'], t.inputs['Vector'])
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*srgb(c1), 1); ramp.color_ramp.elements[1].color = (*srgb(c2), 1)
    L.new(out, ramp.inputs['Fac'])
    L.new(ramp.outputs['Color'], b.inputs['Base Color'])
    if bump:
        bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
        L.new(out, bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def bm_box(bm, c, s, mi=0, rz=0.0):
    hx, hy, hz = s[0]/2, s[1]/2, s[2]/2
    cs, sn = math.cos(rz), math.sin(rz)
    pts = []
    for dx in (-hx, hx):
        for dy in (-hy, hy):
            for dz in (-hz, hz):
                pts.append(bm.verts.new((c[0]+dx*cs-dy*sn, c[1]+dx*sn+dy*cs, c[2]+dz)))
    out = []
    for q in [(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]:
        f = bm.faces.new([pts[i] for i in q]); f.material_index = mi; out.append(f)
    return out

def bm_cyl(bm, c, r, h, seg=20, mi=0, r2=None, rot=None):
    """أسطوانة (أو مخروط مقطوع) قاعدتها عند c وتمتد h على Z (rot: مصفوفة 3×3 اختيارية)"""
    r2 = r if r2 is None else r2
    r0, r1 = [], []
    for i in range(seg):
        a = 2*math.pi*i/seg
        p0 = Vector((math.cos(a)*r, math.sin(a)*r, 0)); p1 = Vector((math.cos(a)*r2, math.sin(a)*r2, h))
        if rot is not None: p0 = rot @ p0; p1 = rot @ p1
        r0.append(bm.verts.new((c[0]+p0.x, c[1]+p0.y, c[2]+p0.z))); r1.append(bm.verts.new((c[0]+p1.x, c[1]+p1.y, c[2]+p1.z)))
    fs = [bm.faces.new((r0[i], r0[(i+1) % seg], r1[(i+1) % seg], r1[i])) for i in range(seg)]
    if r > 0: fs.append(bm.faces.new(list(reversed(r0))))
    if r2 > 0: fs.append(bm.faces.new(r1))
    for f in fs: f.material_index = mi
    return fs

def bm_lathe(bm, c, profile, seg=28, mi=0, scale=(1, 1, 1)):
    """مخرطة حول Z: profile = [(r, z), ...] من الأسفل للأعلى"""
    rings = []
    for (r, z) in profile:
        rings.append([bm.verts.new((c[0]+math.cos(2*math.pi*i/seg)*r*scale[0], c[1]+math.sin(2*math.pi*i/seg)*r*scale[1], c[2]+z*scale[2])) for i in range(seg)])
    fs = []
    for k in range(len(rings)-1):
        for i in range(seg):
            j = (i+1) % seg
            fs.append(bm.faces.new((rings[k][i], rings[k][j], rings[k+1][j], rings[k+1][i])))
    if profile[0][0] > 1e-6: fs.append(bm.faces.new(list(reversed(rings[0]))))
    if profile[-1][0] > 1e-6: fs.append(bm.faces.new(rings[-1]))
    for f in fs: f.material_index = mi
    return fs

def new_obj(name, bm, mats, collection, loc=(0, 0, 0), rot=(0, 0, 0), smooth=False, parent=None):
    me = bpy.data.meshes.new(name)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    collection.objects.link(o)
    if parent: o.parent = parent
    return o

def empty(name, collection, loc=(0, 0, 0), rot=(0, 0, 0), parent=None, kind='PLAIN_AXES', size=0.1):
    e = bpy.data.objects.new(name, None); e.empty_display_type = kind; e.empty_display_size = size
    e.location = loc; e.rotation_euler = rot; collection.objects.link(e)
    if parent: e.parent = parent
    return e

def displace(bm, amp, freq, seed=0, axes=(1, 1, 1)):
    """تشويه عضوي بسيط للرؤوس بضجيج ثلاثي الأبعاد (للخضار)"""
    import mathutils.noise as N
    for v in bm.verts:
        p = v.co * freq + Vector((seed*7.1, seed*3.3, seed*5.9))
        d = N.noise(p)
        n = v.co.normalized() if v.co.length > 1e-6 else Vector((0, 0, 1))
        v.co += Vector((n.x*axes[0], n.y*axes[1], n.z*axes[2])) * (d*amp)
