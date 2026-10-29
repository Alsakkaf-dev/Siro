/**
 * يدان بمنظور الشخص الأول (تُلحقان بالكاميرا): كم + ساعد + كف بأصابع مبسّطة. تمتدّ اليد نحو الهدف عند الإمساك وتعود إلى وضع الراحة.
 * هندسة قليلة (≈ 3 draw calls لكل يد) وتُخفى عند تقليل الحركة جزئيًا (لا اهتزاز).
 */
import * as THREE from 'three';

export type Side = 'L' | 'R';

export class Hand {
  readonly root = new THREE.Group();
  private rest: THREE.Vector3;
  private cur = new THREE.Vector3();
  private grip = 0; // 0 مفتوحة، 1 قابضة
  private fingers: THREE.Mesh[] = [];
  private reach: THREE.Vector3 | null = null; // بإحداثيات الكاميرا المحلية
  holding = false;

  constructor(readonly side: Side) {
    const skin = new THREE.MeshStandardMaterial({ color: 0xe8b894, roughness: 0.65 });
    const sleeve = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.85 });
    const cuff = new THREE.MeshStandardMaterial({ color: 0xc9d3dc, roughness: 0.8 });
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.045, 0.34, 10), skin); arm.rotation.x = Math.PI / 2; arm.position.z = 0.05;
    const slv = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.3, 12), sleeve); slv.rotation.x = Math.PI / 2; slv.position.z = 0.3;
    const cf = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.03, 12), cuff); cf.rotation.x = Math.PI / 2; cf.position.z = 0.13;
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.028, 0.095), skin); palm.position.z = -0.075;
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.06), skin); thumb.position.set(side === 'R' ? -0.05 : 0.05, 0, -0.07); thumb.rotation.y = side === 'R' ? 0.6 : -0.6;
    this.root.add(arm, slv, cf, palm, thumb);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.019, 0.07), skin);
      f.position.set(-0.03 + i * 0.02, 0, -0.16); f.geometry.translate(0, 0, 0.0);
      this.fingers.push(f); this.root.add(f);
    }
    for (const m of this.root.children) { (m as THREE.Mesh).castShadow = false; (m as THREE.Mesh).receiveShadow = false; (m as THREE.Mesh).renderOrder = 10; }
    this.rest = new THREE.Vector3(side === 'R' ? 0.26 : -0.26, -0.27, -0.46);
    this.cur.copy(this.rest);
    this.root.position.copy(this.rest);
    this.root.rotation.set(0.12, side === 'R' ? 0.1 : -0.1, 0);
  }
  /** يمدّ اليد إلى نقطة بإحداثيات عالمية عبر الكاميرا؛ null = وضع الراحة */
  setReach(world: THREE.Vector3 | null, camera: THREE.Camera): void {
    this.reach = world ? camera.worldToLocal(world.clone()) : null;
  }
  setGrip(v: number): void { this.grip = Math.max(0, Math.min(1, v)); }
  update(dt: number): void {
    let goal = this.rest;
    if (this.reach) {
      // الكتف تقريبًا عند (±0.2, -0.35, 0)؛ نحدّ الطول 0.85 م ونُبقي الكف أمام الكاميرا
      const sh = new THREE.Vector3(this.side === 'R' ? 0.2 : -0.2, -0.35, 0.1);
      const d = this.reach.clone().sub(sh);
      const L = Math.min(0.85, d.length());
      goal = sh.add(d.normalize().multiplyScalar(L));
      goal.z = Math.min(goal.z, -0.25);
    }
    this.cur.lerp(goal, Math.min(1, dt * 14));
    this.root.position.copy(this.cur);
    if (this.reach) {
      const d = this.reach.clone().sub(this.cur);
      if (d.lengthSq() > 1e-6) this.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), d.normalize());
    } else this.root.rotation.set(0.12, this.side === 'R' ? 0.1 : -0.1, 0);
    for (const f of this.fingers) f.rotation.x = -this.grip * 1.1;
  }
}

export class Hands {
  readonly L = new Hand('L');
  readonly R = new Hand('R');
  constructor(camera: THREE.Camera) {
    camera.add(this.L.root, this.R.root);
  }
  get(side: Side): Hand { return side === 'L' ? this.L : this.R; }
  update(dt: number): void { this.L.update(dt); this.R.update(dt); }
  setVisible(v: boolean): void { this.L.root.visible = v; this.R.root.visible = v; }
}
