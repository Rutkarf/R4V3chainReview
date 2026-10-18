import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LogoStlCacheService } from './logo-stl-cache.service';

const ACCENT = 0x235789; /* Baltic Blue — charte R4V3chain */

export type LogoViewerVariant = 'mark' | 'footer' | 'hero';

@Component({
  selector: 'app-logo-stl-viewer',
  templateUrl: './logo-stl-viewer.html',
  styleUrl: './logo-stl-viewer.scss',
  host: {
    '[class.logo-host--mark]': 'variant === "mark"',
    '[class.logo-host--footer]': 'variant === "footer"',
    '[class.logo-host--hero]': 'variant === "hero"',
    '[attr.data-variant]': 'variant',
  },
})
export class LogoStlViewer implements AfterViewInit, OnDestroy {
  /** mark = pastille header/pages ; footer = marque bas de page ; hero = ancre visuelle landing */
  @Input() variant: LogoViewerVariant = 'mark';
  @Input() ariaLabel = 'Logo R4V3chain 3D — glisser pour tourner';

  @ViewChild('host', { static: true })
  private readonly hostRef!: ElementRef<HTMLDivElement>;

  protected loading = true;
  protected failed = false;

  private readonly zone = inject(NgZone);
  private readonly cache = inject(LogoStlCacheService);

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private pivot?: THREE.Group;
  private mesh?: THREE.Mesh;
  private frameId = 0;
  private controlsActive = false;
  private reducedMotion = false;
  private visible = true;
  private disposed = false;
  private pointerDidDrag = false;
  private pointerStart = { x: 0, y: 0 };

  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private readonly onPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    this.pointerDidDrag = false;
    this.pointerStart = { x: e.clientX, y: e.clientY };
  };
  private readonly onPointerMove = (e: PointerEvent) => {
    e.stopPropagation();
    const dx = e.clientX - this.pointerStart.x;
    const dy = e.clientY - this.pointerStart.y;
    if (dx * dx + dy * dy > 16) this.pointerDidDrag = true;
  };
  private readonly onClickCapture = (e: MouseEvent) => {
    e.stopPropagation();
    if (this.pointerDidDrag) {
      e.preventDefault();
    }
  };

  ngAfterViewInit(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.zone.runOutsideAngular(() => this.boot());
  }

  ngOnDestroy(): void {
    this.disposed = true;
    this.teardown();
  }

  private get targetFit(): number {
    return this.variant === 'footer' ? 1.75 : 1.55;
  }

  private boot(): void {
    const el = this.hostRef.nativeElement;
    const width = Math.max(el.clientWidth, 1);
    const height = Math.max(el.clientHeight, 1);

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 200);
    camera.position.set(0, 0.25, 4);
    this.camera = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    this.renderer = renderer;

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('click', this.onClickCapture, true);

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

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.75;
    controls.rotateSpeed = 0.85;
    controls.target.set(0, 0, 0);
    controls.addEventListener('start', () => {
      this.controlsActive = true;
      canvas.style.cursor = 'grabbing';
    });
    controls.addEventListener('end', () => {
      this.controlsActive = false;
      canvas.style.cursor = 'grab';
    });
    controls.update();
    this.controls = controls;

    void this.loadLogo();
    this.bindResize(el);
    this.bindVisibility(el);
    this.animate();
  }

  private async loadLogo(): Promise<void> {
    try {
      const geometry = await this.cache.load();
      if (this.disposed || !this.pivot) {
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
      mesh.scale.setScalar(this.targetFit / (radius * 2));
      this.pivot.add(mesh);
      this.mesh = mesh;

      this.zone.run(() => {
        this.loading = false;
      });
      this.fitCamera();
      this.renderFrame();
    } catch {
      this.zone.run(() => {
        this.loading = false;
        this.failed = true;
      });
    }
  }

  private fitCamera(): void {
    if (!this.camera || !this.controls || !this.pivot) return;
    const box = new THREE.Box3().setFromObject(this.pivot);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    this.controls.target.copy(center);
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const dist = maxDim * 1.6;
    this.camera.position.set(center.x + dist * 0.12, center.y + dist * 0.1, center.z + dist);
    this.camera.near = dist / 100;
    this.camera.far = dist * 20;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  private bindResize(el: HTMLElement): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(el);
  }

  private bindVisibility(el: HTMLElement): void {
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.01 },
    );
    this.intersectionObserver.observe(el);
  }

  private resize(): void {
    const el = this.hostRef.nativeElement;
    const width = Math.max(el.clientWidth, 1);
    const height = Math.max(el.clientHeight, 1);
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderFrame();
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this.animate);

    const shouldRender =
      this.visible && !document.hidden && !!this.renderer && !!this.scene && !!this.camera;
    if (!shouldRender) return;

    if (this.pivot && !this.controlsActive && !this.reducedMotion) {
      this.pivot.rotation.y += 0.01;
    }

    this.controls?.update();
    this.renderFrame();
  };

  private renderFrame(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  private teardown(): void {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();

    const canvas = this.renderer?.domElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointermove', this.onPointerMove);
      canvas.removeEventListener('click', this.onClickCapture, true);
    }

    this.controls?.dispose();

    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }

    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;
    this.controls = undefined;
    this.pivot = undefined;
    this.mesh = undefined;
  }
}
