import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as THREE from 'three';
import { LogoStlCacheService } from '../logo-stl-viewer/logo-stl-cache.service';
import { LogoRelayService } from '../logo-relay/logo-relay.service';
import { IntroService } from './intro.service';

const ACCENT = 0x235789;
const BG = 0x020100;

type Phase = 'idle' | 'load' | 'insert' | 'recede' | 'to-header' | 'exit';

/**
 * Intro type AMIX : loader → insert token (logo.stl) → rideau → caméra qui plonge.
 */
@Component({
  selector: 'app-intro-overlay',
  templateUrl: './intro-overlay.html',
  styleUrl: './intro-overlay.scss',
})
export class IntroOverlay implements AfterViewInit, OnDestroy {
  @ViewChild('gl') private glRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('coin') private coinRef?: ElementRef<HTMLDivElement>;
  @ViewChild('traveler') private travelerRef?: ElementRef<HTMLDivElement>;

  private readonly cache = inject(LogoStlCacheService);
  private readonly intro = inject(IntroService);
  private readonly relay = inject(LogoRelayService);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly visible = signal(false);
  protected readonly fontsIn = signal(false);
  protected readonly ready = signal(false);
  protected readonly inserting = signal(false);
  protected readonly receding = signal(false);
  protected readonly toHeader = signal(false);
  protected readonly powerOn = signal(false);
  protected readonly exiting = signal(false);
  protected readonly progress = signal(8);

  private phase: Phase = 'idle';
  private disposed = false;
  private frameId = 0;
  private clock = new THREE.Clock();
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private pivot?: THREE.Group;
  private mesh?: THREE.Mesh;
  private coinMesh?: THREE.Mesh;
  private coinPivot?: THREE.Group;
  private coinRenderer?: THREE.WebGLRenderer;
  private coinScene?: THREE.Scene;
  private coinCamera?: THREE.PerspectiveCamera;
  private particles?: THREE.Points;
  private insertStart = 0;
  private recedeT = 0;
  private recedeHold = 0;
  private headerT = 0;
  private headerFrom = { x: 0, y: 0, s: 240 };
  private headerTo = { x: 28, y: 28, s: 38 };
  private lastPose = { x: 0, y: 0, s: 240 };
  private travelerGeo?: THREE.BufferGeometry;
  private mouse = new THREE.Vector2();
  private mouseSmooth = new THREE.Vector2();
  private camCoin = new THREE.Vector3(0.15, 0.55, 4.6);
  private lookCoin = new THREE.Vector3(0, 0.15, 0);
  private camFrom = new THREE.Vector3(-5.2, 10.5, 16);
  private camTo = new THREE.Vector3(0.38, 0.48, 3.7);
  private lookFrom = new THREE.Vector3(0.4, -0.2, -1.2);
  private lookTo = new THREE.Vector3(0, 0, 0);
  private camPos = this.camCoin.clone();
  private camLook = this.lookCoin.clone();
  private meshBase = 1;
  private exitTimer = 0;
  private progressTimer = 0;
  private readonly onResize = () => this.resize();

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationStart => e instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const path = e.url.split('?')[0];
        if (path !== '/' && path !== '' && this.intro.playing()) this.finish(true);
      });
  }

  ngAfterViewInit(): void {
    if (!this.intro.shouldPlay(this.router.url)) {
      this.intro.skipMark();
      return;
    }

    this.visible.set(true);
    this.intro.begin();
    this.relay.setIntroHold(true);
    this.phase = 'load';
    this.cdr.detectChanges();

    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.boot());
    });
  }

  ngOnDestroy(): void {
    this.teardown();
    if (this.intro.playing()) this.intro.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.visible() || this.exiting()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.skip();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && this.ready() && this.phase === 'load') {
      event.preventDefault();
      this.startInsert();
    }
  }

  protected startInsert(): void {
    if (this.phase !== 'load' || !this.ready()) return;
    this.beginInsert();
  }

  protected skip(): void {
    this.finish(true);
  }

  private boot(): void {
    if (this.disposed) return;
    const canvas = this.glRef?.nativeElement;
    if (!canvas) {
      this.finish(true);
      return;
    }

    this.showHudSoon();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.FogExp2(BG, 0.045);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(42, this.aspect(), 0.1, 200);
    camera.position.copy(this.camCoin);
    camera.lookAt(this.lookCoin);
    this.camera = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    this.renderer = renderer;

    scene.add(new THREE.AmbientLight(0xb8c8d8, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(3.2, 6, 4);
    const fill = new THREE.DirectionalLight(ACCENT, 0.85);
    fill.position.set(-3.2, 1.4, -1.6);
    const rim = new THREE.PointLight(ACCENT, 3.2, 28);
    rim.position.set(-1.2, 1.6, 3.2);
    scene.add(key, fill, rim);

    const pivot = new THREE.Group();
    scene.add(pivot);
    this.pivot = pivot;

    this.spawnParticles(scene);
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('pointermove', this.onPointer, { passive: true });

    void this.loadLogo();
    this.fakeProgress();
    this.animate();
  }

  private async loadLogo(): Promise<void> {
    try {
      this.zone.run(() => this.progress.set(36));
      const geometry = await this.cache.load();
      if (this.disposed || !this.pivot) {
        geometry.dispose();
        return;
      }
      const radius = Math.max(geometry.boundingSphere?.radius ?? 1, 1);
      const material = new THREE.MeshPhysicalMaterial({
        color: ACCENT,
        emissive: ACCENT,
        emissiveIntensity: 0.42,
        metalness: 0.74,
        roughness: 0.2,
        transmission: 0.05,
        thickness: 0.5,
        clearcoat: 0.55,
        clearcoatRoughness: 0.18,
        reflectivity: 0.82,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.set(-0.55, 0.42, 0.12);
      this.meshBase = 1.7 / (radius * 2);
      mesh.scale.setScalar(this.meshBase * 1.8);
      mesh.position.y = 0;
      mesh.visible = false;
      this.pivot.add(mesh);
      this.mesh = mesh;
      this.travelerGeo = geometry.clone();
      this.mountCoinPreview(geometry);
      this.zone.run(() => {
        this.progress.set(100);
        this.ready.set(true);
      });
    } catch {
      this.finish(true);
    }
  }

  private beginInsert(): void {
    if (this.phase !== 'load' || this.disposed) return;
    this.phase = 'insert';
    this.insertStart = performance.now();
    this.zone.run(() => {
      this.inserting.set(true);
      this.ready.set(true);
    });
  }

  private mountCoinPreview(source: THREE.BufferGeometry): void {
    const host = this.coinRef?.nativeElement;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 0.2, 3.6);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(72, 72, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    scene.add(new THREE.AmbientLight(0xb8c8d8, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2.4, 3.2, 2.6);
    const rim = new THREE.PointLight(ACCENT, 2.2, 16);
    rim.position.set(-1.1, 1.1, 2.2);
    scene.add(key, rim);

    const geo = source.clone();
    const radius = Math.max(geo.boundingSphere?.radius ?? 1, 1);
    const material = new THREE.MeshPhysicalMaterial({
      color: ACCENT,
      emissive: ACCENT,
      emissiveIntensity: 0.42,
      metalness: 0.74,
      roughness: 0.2,
      clearcoat: 0.55,
      reflectivity: 0.82,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.set(-0.55, 0.42, 0.12);
    mesh.scale.setScalar(1.7 / (radius * 2));
    const pivot = new THREE.Group();
    pivot.add(mesh);
    scene.add(pivot);

    this.coinScene = scene;
    this.coinCamera = camera;
    this.coinRenderer = renderer;
    this.coinMesh = mesh;
    this.coinPivot = pivot;
  }

  private beginRecede(): void {
    this.phase = 'recede';
    this.recedeT = 0;
    this.recedeHold = 0;
    this.mountTraveler();
    this.markOverlay('intro--recede');
    this.showTraveler();
    const start = this.recedePose(0);
    this.poseTraveler(start.x, start.y, start.s);
    this.intro.revealPage();
    this.zone.run(() => {
      this.receding.set(true);
      this.powerOn.set(false);
    });
  }

  private beginToHeader(): void {
    this.phase = 'to-header';
    this.headerT = 0;
    this.headerFrom = { ...this.lastPose };
    this.intro.revealHeader();
    const mark = this.relay.sourceEl();
    const r = mark?.getBoundingClientRect();
    this.headerTo = r
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2, s: Math.max(r.width, 36) }
      : { x: 36, y: 28, s: 38 };
    this.markOverlay('intro--to-header');
    this.showTraveler();
    this.zone.run(() => this.toHeader.set(true));
  }

  private beginExit(): void {
    if (this.phase === 'exit') return;
    this.phase = 'exit';
    this.zone.run(() => this.exiting.set(true));
    this.exitTimer = window.setTimeout(() => this.finish(false), 420);
  }

  private mountTraveler(): void {
    const host = this.travelerRef?.nativeElement;
    if (this.coinRenderer && host) {
      if (this.coinRenderer.domElement.parentElement !== host) {
        host.appendChild(this.coinRenderer.domElement);
      }
      return;
    }

    const geo = this.travelerGeo;
    if (!host || !geo) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 0.2, 3.6);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(240, 240, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    scene.add(new THREE.AmbientLight(0xb8c8d8, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2.4, 3.2, 2.6);
    const rim = new THREE.PointLight(ACCENT, 2.2, 16);
    rim.position.set(-1.1, 1.1, 2.2);
    scene.add(key, rim);

    const radius = Math.max(geo.boundingSphere?.radius ?? 1, 1);
    const material = new THREE.MeshPhysicalMaterial({
      color: ACCENT,
      emissive: ACCENT,
      emissiveIntensity: 0.42,
      metalness: 0.74,
      roughness: 0.2,
      clearcoat: 0.55,
      reflectivity: 0.82,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.set(-0.55, 0.42, 0.12);
    mesh.scale.setScalar(1.7 / (radius * 2));
    const pivot = new THREE.Group();
    pivot.add(mesh);
    scene.add(pivot);

    this.coinScene = scene;
    this.coinCamera = camera;
    this.coinRenderer = renderer;
    this.coinMesh = mesh;
    this.coinPivot = pivot;
  }

  private recedePose(t: number): { x: number; y: number; s: number } {
    const e = easeInOut(t);
    const min = Math.min(window.innerWidth, window.innerHeight);
    return {
      x: lerp(window.innerWidth * 0.38, window.innerWidth * 0.58, e),
      y: lerp(window.innerHeight * 0.42, window.innerHeight * 0.46, e),
      s: lerp(min * 0.56, min * 0.2, e),
    };
  }

  private markOverlay(...names: string[]): void {
    const root = this.travelerRef?.nativeElement.closest('.intro');
    root?.classList.add(...names);
  }

  private showTraveler(): void {
    const el = this.travelerRef?.nativeElement;
    if (!el) return;
    el.classList.add('is-live');
    el.style.opacity = '1';
  }

  private poseTraveler(x: number, y: number, s: number): void {
    const el = this.travelerRef?.nativeElement;
    if (!el) return;
    const size = Math.max(s, 28);
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.opacity = '1';
    el.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
    this.lastPose = { x, y, s: size };
    this.coinRenderer?.setSize(size, size, false);
  }

  private finish(skipped: boolean): void {
    if (this.disposed && this.intro.finished()) return;
    window.clearTimeout(this.exitTimer);
    window.clearTimeout(this.progressTimer);
    this.teardown();
    this.zone.run(() => {
      this.visible.set(false);
      this.intro.complete();
      if (skipped) {
        this.relay.setIntroHold(false);
        this.relay.skipToDescentAfterIntro();
      } else {
        this.relay.skipToDescentAfterIntro();
      }
    });
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this.animate);
    if (!this.renderer || !this.scene || !this.camera) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.tickInsert();
    this.tickRecede(dt);
    this.tickToHeader(dt);
    this.tickMesh(dt, t);
    this.tickCamera(dt);
    this.tickParticles(t);
    this.tickCoin();

    this.renderer.render(this.scene, this.camera);
  };

  private tickInsert(): void {
    if (this.phase !== 'insert') return;
    if (performance.now() - this.insertStart >= 780) this.beginRecede();
  }

  private tickCoin(): void {
    if (!this.coinRenderer || !this.coinScene || !this.coinCamera) return;
    if (this.coinPivot) {
      const spin =
        this.phase === 'insert' ? 0.08 : this.phase === 'to-header' ? 0.03 : 0.018;
      this.coinPivot.rotation.y += spin;
    }
    this.coinRenderer.render(this.coinScene, this.coinCamera);
  }

  private tickRecede(dt: number): void {
    if (this.phase !== 'recede') return;
    if (this.recedeT < 1) {
      this.recedeT = Math.min(1, this.recedeT + dt * 0.48);
      const pose = this.recedePose(this.recedeT);
      this.poseTraveler(pose.x, pose.y, pose.s);
      return;
    }
    this.recedeHold += dt;
    if (this.recedeHold >= 0.32) this.beginToHeader();
  }

  private tickToHeader(dt: number): void {
    if (this.phase !== 'to-header') return;
    this.headerT = Math.min(1, this.headerT + dt * 0.82);
    const e = easeInOut(this.headerT);
    this.poseTraveler(
      lerp(this.headerFrom.x, this.headerTo.x, e),
      lerp(this.headerFrom.y, this.headerTo.y, e),
      lerp(this.headerFrom.s, this.headerTo.s, e),
    );
    if (this.headerT >= 1) this.beginExit();
  }

  private tickMesh(_dt: number, t: number): void {
    if (!this.pivot || !this.mesh) return;
    void t;
  }

  private tickCamera(dt: number): void {
    if (!this.camera) return;
    const diving = this.phase === 'recede' || this.phase === 'exit';
    const introK = diving ? this.recedeT : 0;
    const targetPos = diving
      ? this.camFrom.clone().lerp(this.camTo, easeInOut(introK))
      : this.camCoin;
    const targetLook = diving
      ? this.lookFrom.clone().lerp(this.lookTo, easeInOut(introK))
      : this.lookCoin;
    const ease = 1 - Math.exp(-dt * (diving && introK < 1 ? 1.7 : 3.4));
    this.camPos.lerp(targetPos, diving ? ease : 1);
    this.camLook.lerp(targetLook, diving ? ease : 1);

    this.mouseSmooth.lerp(this.mouse, 1 - Math.exp(-dt * 4));
    const mx = this.mouseSmooth.x;
    const my = this.mouseSmooth.y;
    this.camera.position.set(
      this.camPos.x + mx * 0.55,
      this.camPos.y + my * -0.3,
      this.camPos.z,
    );
    this.camera.lookAt(this.camLook.x + mx * 1.1, this.camLook.y + my * -0.45, this.camLook.z);
  }

  private tickParticles(t: number): void {
    if (!this.particles) return;
    this.particles.rotation.y = Math.sin(t * 0.05) * 0.04;
    this.particles.position.y = Math.sin(t * 0.4) * 0.14;
  }

  private spawnParticles(scene: THREE.Scene): void {
    const mobile = window.innerWidth <= 760;
    const count = mobile ? 140 : 280;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = Math.random() * 10 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.045,
        color: 0x8fb8ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(pts);
    this.particles = pts;
  }

  private showHudSoon(): void {
    const reveal = () => this.zone.run(() => this.fontsIn.set(true));
    if (document.fonts?.ready) {
      void document.fonts.ready.then(reveal);
      window.setTimeout(reveal, 900);
    } else {
      reveal();
    }
  }

  private fakeProgress(): void {
    const step = () => {
      if (this.ready() || this.disposed) return;
      this.zone.run(() => this.progress.update((p) => Math.min(92, p + 7 + Math.random() * 9)));
      this.progressTimer = window.setTimeout(step, 220);
    };
    this.progressTimer = window.setTimeout(step, 180);
  }

  private aspect(): number {
    return Math.max(window.innerWidth, 1) / Math.max(window.innerHeight, 1);
  }

  private resize(): void {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = this.aspect();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  private readonly onPointer = (e: PointerEvent): void => {
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private teardown(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    window.clearTimeout(this.exitTimer);
    window.clearTimeout(this.progressTimer);
    this.particles?.geometry.dispose();
    (this.particles?.material as THREE.Material | undefined)?.dispose();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
    if (this.coinMesh) {
      this.coinMesh.geometry.dispose();
      (this.coinMesh.material as THREE.Material).dispose();
    }
    this.coinRenderer?.dispose();
    this.coinRenderer?.domElement.remove();
    this.renderer?.dispose();
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;
    this.pivot = undefined;
    this.mesh = undefined;
    this.particles = undefined;
    this.coinMesh = undefined;
    this.coinPivot = undefined;
    this.coinRenderer = undefined;
    this.coinScene = undefined;
    this.coinCamera = undefined;
    this.travelerGeo = undefined;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
