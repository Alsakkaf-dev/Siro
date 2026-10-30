"""خَبز المواد الإجرائية (لون الأساس) إلى صور حتى تنجو من تصدير glTF. لكل جسم نسخة مواده؛ unwrap تلقائي ثم Cycles bake COLOR."""
import os
from lib import *

def _procedural(m):
    if not m.use_nodes: return False
    b = m.node_tree.nodes.get('Principled BSDF')
    return bool(b and b.inputs['Base Color'].is_linked)

def bake_all(res_small=512, res_big=1024, only=None):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 1; sc.cycles.bake_type = 'DIFFUSE' if hasattr(sc.cycles, 'bake_type') else None
    done = []
    objs = [o for o in bpy.data.objects if o.type == 'MESH' and any(m and _procedural(m) for m in o.data.materials)]
    for o in objs:
        if only and o.name not in only: continue
        # نسخة مواد خاصة بالجسم
        for i, m in enumerate(o.data.materials):
            if m and _procedural(m):
                o.data.materials[i] = m.copy(); o.data.materials[i].name = f'{m.name}__{o.name}'
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
        bpy.ops.object.mode_set(mode='OBJECT')
        dims = max(o.dimensions)
        r = res_big if dims > 0.8 else res_small
        img = bpy.data.images.new(f'BAKE_{o.name}', r, r)
        pm = [m for m in o.data.materials if m and _procedural(m)]
        metal = {}
        for m in pm:  # خَبز اللون الأساس يعطي الأسود للمعدن الكامل: نصفّر المعدنية أثناء الخَبز ثم نعيدها
            b0 = m.node_tree.nodes.get('Principled BSDF'); metal[m] = b0.inputs['Metallic'].default_value; b0.inputs['Metallic'].default_value = 0.0
        for m in pm:
            n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; m.node_tree.nodes.active = n; n.name = 'BAKE_IMG'
        try:
            bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=4, use_clear=True)
        except Exception as e:
            print('bake failed', o.name, e); continue
        for m in pm:
            nt = m.node_tree; b = nt.nodes.get('Principled BSDF'); tx = nt.nodes['BAKE_IMG']
            b.inputs['Metallic'].default_value = metal.get(m, 0.0)
            nt.links.new(tx.outputs['Color'], b.inputs['Base Color'])
            if b.inputs['Normal'].is_linked:
                for l in list(b.inputs['Normal'].links): nt.links.remove(l)
        if os.environ.get('KW_BAKE_DIR'):
            os.makedirs(os.environ['KW_BAKE_DIR'], exist_ok=True)
            img.filepath_raw = os.path.join(os.environ['KW_BAKE_DIR'], f'{o.name}.png'); img.file_format = 'PNG'; img.save()
        img.pack(); done.append((o.name, r))
    return done
