import * as THREE from 'three';
import { LogoStlCacheService } from '../logo-stl-viewer/logo-stl-cache.service';

const ACCENT = 0x235789;

/**
 * Mini viewer WebGL pour le clone en vol (logo.stl via cache partagé).
 * Pas de contrôles — spin auto uniquement.
 */
export class LogoRelayStlHost {
  readonly el: HTMLDivElement;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private pivot?: THREE.Group;
  private mesh?: THREE.Mesh;
  private frameId = 0;
  private disposed = false;
  private reducedMotion = false;
  private size = 64;
  /** Multiplicateur de spin (1 = idle, >1 pendant le scroll). */
  private spinBoost = 1;
  private readonly baseSpin = 0.012;
  private readonly maxSpinBoost = 5.2;
  private readonly spinDecay = 0.045;

  constructor(
    private readonly cache: LogoStlCacheService,
    reducedMotion: boolean,
  ) {
    this.reducedMotion = reducedMotion;
    this.el = document.createElement('div');
    this.el.className = 'logo-relay-clone';
    this.el.setAttribute('aria-hidden', 'true');
  }

  async mount(parent: HTMLElement, sizePx: number): Promise<void> {
    this.size = Math.max(sizePx, 32);
    this.el.style.width = `${this.size}px`;
    this.el.style.height = `${this.size}px`;
    parent.appendChild(this.el);

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
    camera.position.set(0, 0.25, 4);
    this.camera = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(this.size, this.size, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    this.el.appendChild(canvas);
    this.renderer = renderer;

    const ambient = new THREE.AmbientLight(0xb8c8d8, 0.7);
    const key = new THREE.DirectionalLight(0xffffff, 1);
    key.position.set(3.2, 4.5, 2.8);
    const fill = new THREE.DirectionalLight(ACCENT, 0.65);
    fill.position.set(-2.5, 1.2, -1.5);
    const rim = new THREE.PointLight(ACCENT, 1.8, 20);
    rim.position.set(-1.4, 1.2, 2);
    scene.add(ambient, key, fill, rim);

    const pivot = new THREE.Group();
    scene.add(pivot);
    this.pivot = pivot;

    try {
      const geometry = await this.cache.load();
      if (this.disposed) {
        geometry.dispose();
        return;
      }
      const radius = Math.max(geometry.boundingSphere?.radius ?? 1, 1);
      const material = new THREE.MeshPhysicalMaterial({
        color: ACCENT,
        emissive: ACCENT,
        emissiveIntensity: 0.38,
        metalness: 0.72,
        roughness: 0.22,
        transmission: 0.06,
        thickness: 0.5,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
        reflectivity: 0.8,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.set(-0.55, 0.42, 0.12);
      mesh.scale.setScalar(1.55 / (radius * 2));
      pivot.add(mesh);
      this.mesh = mesh;
      this.fitCamera();
    } catch {
      /* silent — trail only */
    }

    this.animate();
  }

  setSize(sizePx: number): void {
    this.size = Math.max(sizePx, 24);
    this.el.style.width = `${this.size}px`;
    this.el.style.height = `${this.size}px`;
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.size, this.size, false);
  }

  setPose(x: number, y: number, sizePx: number, opacity: number, rotateDeg: number): void {
    this.setSize(sizePx);
    this.el.style.opacity = String(opacity);
    this.el.style.transform = `translate(${x - sizePx / 2}px, ${y - sizePx / 2}px) rotate(${rotateDeg}deg)`;
  }

  /** Accélère le spin sur lui-même (appelé à chaque event scroll). */
  nudgeScrollSpin(intensity = 1.35): void {
    if (this.reducedMotion) return;
    this.spinBoost = Math.min(this.maxSpinBoost, this.spinBoost + intensity);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.el.remove();
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;
    this.pivot = undefined;
    this.mesh = undefined;
  }

  private fitCamera(): void {
    if (!this.camera || !this.pivot) return;
    const box = new THREE.Box3().setFromObject(this.pivot);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const dist = maxDim * 1.6;
    this.camera.position.set(center.x + dist * 0.12, center.y + dist * 0.1, center.z + dist);
    this.camera.near = dist / 100;
    this.camera.far = dist * 20;
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this.animate);
    if (!this.renderer || !this.scene || !this.camera) return;
    if (this.pivot && !this.reducedMotion) {
      // Retour progressif à la vitesse de croisière quand on ne scroll plus
      this.spinBoost += (1 - this.spinBoost) * this.spinDecay;
      if (this.spinBoost < 1.02) this.spinBoost = 1;
      this.pivot.rotation.y += this.baseSpin * this.spinBoost;
    }
    this.renderer.render(this.scene, this.camera);
  };
}
