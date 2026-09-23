import {
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  effect,
  inject,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LogoStlCacheService } from '../logo-stl-viewer/logo-stl-cache.service';
import { LogoRelayFlight, LogoRelayService } from './logo-relay.service';
import { LogoRelayStlHost } from './logo-relay-stl-host';

type OverlayPhase = 'idle' | 'flight' | 'to-center' | 'descend';

/**
 * Chaîne home : header → hero → centre → descente scroll → footer.
 * Toujours logo.stl ; vols visibles (sous le header).
 */
@Component({
  selector: 'app-logo-relay-overlay',
  template: `<div class="logo-relay-layer" hidden></div>`,
  styleUrl: './logo-relay-overlay.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.aria-hidden]': 'true',
  },
})
export class LogoRelayOverlay implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly relay = inject(LogoRelayService);
  private readonly cache = inject(LogoStlCacheService);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private layer?: HTMLDivElement;
  private stlHost?: LogoRelayStlHost;
  private lane?: HTMLDivElement;
  private raf = 0;
  private startTs = 0;
  private active: LogoRelayFlight | null = null;
  private phase: OverlayPhase = 'idle';
  private readonly duration = 1000;
  private readonly centerDuration = 700;
  private readonly history: { x: number; y: number; s: number }[] = [];
  private readonly trailNodes: HTMLSpanElement[] = [];

  private centerFrom = { x: 0, y: 0, s: 48 };
  private traveler = { x: 0, y: 0, s: 52 };
  private descentExitRequested = false;
  /** Token bas masqué jusqu’au premier scroll de descente. */
  private descentRevealed = false;
  private flightGen = 0;
  private readonly onScroll = () => {
    if (this.phase === 'descend' && !this.descentRevealed) {
      this.revealDescentTraveler();
    }
    if (
      this.phase === 'to-center' ||
      this.phase === 'descend' ||
      this.phase === 'flight'
    ) {
      this.stlHost?.nudgeScrollSpin();
    }
    this.scheduleDescent();
  };
  private readonly onResize = () => this.scheduleDescent();

  constructor() {
    effect(() => {
      const flight = this.relay.flight();
      if (flight) void this.launchFlight(flight);
    });

    // Descente uniquement si on n’enchaîne pas déjà depuis le vol hero
    effect(() => {
      const token = this.relay.descentToken();
      if (token > 0 && this.relay.mode() === 'descent' && this.phase === 'idle') {
        void this.beginDescentFromHero();
      }
    });
  }

  ngOnInit(): void {
    this.layer = this.host.nativeElement.querySelector('.logo-relay-layer') as HTMLDivElement;
    this.relay.setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.hardReset();
        this.relay.resetForNavigation();
      });
  }

  ngOnDestroy(): void {
    this.hardReset();
  }

  /* —— 1) Header → Hero (ou centre → footer) —— */

  private async launchFlight(flight: LogoRelayFlight): Promise<void> {
    if (!this.layer) return;
    const gen = ++this.flightGen;

    // Si on vient de la descente, garder le même host STL
    const reuseHost = flight.fromDescent && !!this.stlHost && this.phase === 'descend';
    if (!reuseHost) {
      this.detachScroll();
      this.cancelAnim();
      this.clearTrail();
      this.lane?.remove();
      this.lane = undefined;
      this.disposeStl();
    } else {
      this.detachScroll();
      this.cancelAnim();
      this.clearTrail();
      this.lane?.remove();
      this.lane = undefined;
    }

    this.active = flight;
    this.phase = 'flight';
    this.history.length = 0;
    this.startTs = 0;

    this.ensureLayer('flight');
    this.spawnTrail(14);

    if (!this.stlHost) {
      await this.mountStl(Math.max(flight.from.width, 36));
    }
    if (gen !== this.flightGen || this.phase !== 'flight') return;

    const source = this.relay.sourceEl();
    const target = this.relay.getTarget(flight.id);
    if (source && target) {
      flight = {
        ...flight,
        from: flight.fromDescent ? flight.from : source.getBoundingClientRect(),
        to: target.getBoundingClientRect(),
      };
      this.active = flight;
    }

    const from = flight.from;
    this.stlHost?.setPose(
      from.left + from.width / 2,
      from.top + from.height / 2,
      Math.max(from.width, 36),
      1,
      0,
    );

    this.zone.runOutsideAngular(() => {
      this.raf = requestAnimationFrame((t) => this.tickFlight(t, gen));
    });
  }

  private tickFlight(now: number, gen: number): void {
    if (gen !== this.flightGen) return;
    const flight = this.active;
    const host = this.stlHost;
    if (!flight || !host) return;

    if (!this.startTs) this.startTs = now;
    const t = Math.min(1, (now - this.startTs) / this.duration);
    const e = easeOutCubic(t);

    const from = flight.from;
    const to = flight.to;
    const fromCx = from.left + from.width / 2;
    const fromCy = from.top + from.height / 2;
    const toCx = to.left + to.width / 2;
    const toCy = to.top + to.height / 2;

    const midX = (fromCx + toCx) / 2 + (toCx - fromCx) * 0.1 + (flight.fromDescent ? 0 : 56);
    const midY =
      Math.min(fromCy, toCy) -
      Math.min(flight.fromDescent ? 48 : 140, Math.abs(toCy - fromCy) * 0.4 + 28);

    const x = quadBezier(fromCx, midX, toCx, e);
    const y = quadBezier(fromCy, midY, toCy, e);
    const s =
      from.width +
      (to.width - from.width) * e +
      Math.sin(e * Math.PI) * Math.max(10, Math.abs(to.width - from.width) * 0.32 + 8);

    // Opacité pleine pendant le vol (pas de fade-out qui “coupe” l’arrivée)
    const opacity = t < 0.05 ? t / 0.05 : 1;
    host.setPose(x, y, s, opacity, e * 360);
    this.pushTrail(x, y, s);

    if (t < 1) {
      this.raf = requestAnimationFrame((ts) => this.tickFlight(ts, gen));
      return;
    }

    const doneId = flight.id;
    this.active = null;

    // Enchaînement fluide : hero → descente sans démonter le STL
    if (doneId === 'home-hero') {
      this.traveler = { x: toCx, y: toCy, s: to.width };
      this.centerFrom = { ...this.traveler };
      this.clearTrail();
      this.zone.run(() => this.relay.completeFlight(doneId));
      // completeFlight passe en mode descent — enchaîner tout de suite
      this.startToCenter(gen);
      return;
    }

    this.cleanupVisuals();
    this.phase = 'idle';
    this.zone.run(() => this.relay.completeFlight(doneId));
  }

  /* —— 2) Hero → centre puis descente scroll —— */

  private async beginDescentFromHero(): Promise<void> {
    if (this.relay.isReduced() || !this.layer) {
      this.relay.endDescent();
      return;
    }
    const hero = this.relay.getTarget('home-hero');
    if (!hero) {
      this.relay.endDescent();
      return;
    }

    const hr = hero.getBoundingClientRect();
    this.centerFrom = {
      x: hr.left + hr.width / 2,
      y: hr.top + hr.height / 2,
      s: Math.max(hr.width, 48),
    };
    this.traveler = { ...this.centerFrom };
    this.descentExitRequested = false;

    this.ensureLayer('flight');
    if (!this.stlHost) {
      this.spawnTrail(8);
      await this.mountStl(this.traveler.s, true);
    }
    this.stlHost?.setPose(this.traveler.x, this.traveler.y, this.traveler.s, 1, 0);

    this.startToCenter(++this.flightGen);
  }

  private startToCenter(gen: number): void {
    if (this.relay.isReduced()) {
      this.cleanupVisuals();
      this.phase = 'idle';
      this.relay.endDescent();
      return;
    }

    this.phase = 'to-center';
    this.startTs = 0;
    this.descentExitRequested = false;
    this.descentRevealed = false;
    this.ensureLayer('flight');
    this.spawnTrail(8);

    if (!this.lane && this.layer) {
      this.lane = document.createElement('div');
      this.lane.className = 'logo-relay-lane';
      this.layer.appendChild(this.lane);
    }
    this.updateLane();

    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      this.raf = requestAnimationFrame((t) => this.tickToCenter(t, gen));
    });
  }

  private tickToCenter(now: number, gen: number): void {
    if (gen !== this.flightGen) return;
    const host = this.stlHost;
    if (!host || this.phase !== 'to-center') return;

    if (!this.startTs) this.startTs = now;
    const t = Math.min(1, (now - this.startTs) / this.centerDuration);
    const e = easeOutCubic(t);

    const targetX = window.innerWidth / 2;
    const targetS = 58;
    // Centré, le plus bas possible tout en restant visible sur le 1er écran
    const tokenHalf = targetS / 2;
    const bottomSafe = window.innerWidth <= 720 ? 88 : 28;
    const lowestVisible = window.innerHeight - tokenHalf - bottomSafe;
    const targetY = Math.max(this.centerFrom.y + 40, lowestVisible);

    const x = lerp(this.centerFrom.x, targetX, e);
    const y = lerp(this.centerFrom.y, targetY, e);
    const s = lerp(this.centerFrom.s, targetS, e);

    this.traveler = { x, y, s };
    // Pendant le glissement hero → bas : visible ; ensuite masqué jusqu’au scroll
    host.setPose(x, y, s, 1, e * 160);
    this.pushTrail(x, y, s);
    this.reportDescentRect();
    this.updateLane();

    if (t < 1) {
      this.raf = requestAnimationFrame((ts) => this.tickToCenter(ts, gen));
      return;
    }

    this.phase = 'descend';
    this.descentRevealed = false;
    this.clearTrail();
    // Masquer le token bas + la lane jusqu’au premier scroll
    host.setPose(x, y, s, 0, 0);
    if (this.lane) this.lane.style.opacity = '0';
    this.reportDescentRect();
    // Si l’utilisateur a déjà scrollé pendant l’anim, révéler tout de suite
    if (window.scrollY > 8) {
      this.revealDescentTraveler();
      this.scheduleDescent();
    }
  }

  private revealDescentTraveler(): void {
    if (this.descentRevealed || !this.stlHost) return;
    this.descentRevealed = true;
    const { x, y, s } = this.traveler;
    this.stlHost.setPose(x, y, s, 1, 0);
    this.updateLane(0);
  }

  private scheduleDescent(): void {
    if (this.phase !== 'descend') return;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.updateDescent());
  }

  private updateDescent(): void {
    if (this.phase !== 'descend' || !this.stlHost || !this.descentRevealed) return;

    const hero = this.relay.getTarget('home-hero');
    const footer = this.relay.getTarget('site-footer');
    if (!hero || !footer) return;

    const heroR = hero.getBoundingClientRect();
    const footR = footer.getBoundingClientRect();

    const startDocY = heroR.top + window.scrollY + heroR.height * 0.5;
    const endDocY = footR.top + window.scrollY + footR.height * 0.3;
    const span = Math.max(endDocY - startDocY, 1);
    const followDocY = window.scrollY + window.innerHeight * 0.9;
    const progress = clamp01((followDocY - startDocY) / span);

    const x = window.innerWidth / 2;
    const tokenHalf = 29;
    const bottomSafe = window.innerWidth <= 720 ? 88 : 28;
    const y = window.innerHeight - tokenHalf - bottomSafe;
    const s = 54 + Math.sin(progress * Math.PI) * 10;

    this.traveler = { x, y, s };
    this.stlHost.setPose(x, y, s, 1, progress * 75);
    this.reportDescentRect();
    this.updateLane(progress);

    if (!this.descentExitRequested && (progress >= 0.9 || footR.top < window.innerHeight * 0.75)) {
      this.descentExitRequested = true;
      this.reportDescentRect();
      this.relay.requestFlight('site-footer');
    }
  }

  private reportDescentRect(): void {
    const { x, y, s } = this.traveler;
    this.relay.setDescentFrom(new DOMRect(x - s / 2, y - s / 2, s, s));
  }

  private updateLane(progress = 0): void {
    if (!this.lane) return;
    const bottomSafe = window.innerWidth <= 720 ? 88 : 36;
    const endY = window.innerHeight - bottomSafe - 8;
    const startY = window.innerHeight * 0.28;
    const h = Math.max(endY - startY, 40) * (0.55 + progress * 0.45);
    this.lane.style.height = `${h}px`;
    this.lane.style.opacity = String(0.22 + progress * 0.25);
    this.lane.style.transform = `translate(${window.innerWidth / 2 - 1}px, ${startY}px)`;
  }

  /* —— Helpers —— */

  private ensureLayer(mode: 'flight' | 'behind' = 'flight'): void {
    if (!this.layer) return;
    this.layer.hidden = false;
    this.layer.classList.toggle('logo-relay-layer--flight', mode === 'flight');
    this.layer.classList.toggle('logo-relay-layer--behind', mode === 'behind');
  }

  private async mountStl(sizePx: number, lane = false): Promise<void> {
    this.disposeStl();
    const host = new LogoRelayStlHost(this.cache, this.relay.isReduced());
    if (lane) host.el.classList.add('logo-relay-clone--lane');
    await host.mount(this.layer!, sizePx);
    this.stlHost = host;
  }

  private disposeStl(): void {
    this.stlHost?.dispose();
    this.stlHost = undefined;
  }

  private spawnTrail(n: number): void {
    this.clearTrail();
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('span');
      dot.className = 'logo-relay-trail';
      dot.style.opacity = '0';
      this.layer!.appendChild(dot);
      this.trailNodes.push(dot);
    }
  }

  private clearTrail(): void {
    for (const n of this.trailNodes) n.remove();
    this.trailNodes.length = 0;
    this.history.length = 0;
  }

  private pushTrail(x: number, y: number, s: number): void {
    this.history.push({ x, y, s });
    if (this.history.length > this.trailNodes.length) this.history.shift();
    for (let i = 0; i < this.trailNodes.length; i++) {
      const node = this.trailNodes[i]!;
      const h = this.history[i];
      if (!h) {
        node.style.opacity = '0';
        continue;
      }
      const age = (i + 1) / this.history.length;
      const ds = h.s * (0.28 + age * 0.35);
      node.style.width = `${ds}px`;
      node.style.height = `${ds}px`;
      node.style.opacity = String(age * 0.4);
      node.style.transform = `translate(${h.x - ds / 2}px, ${h.y - ds / 2}px)`;
    }
  }

  private cancelAnim(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private detachScroll(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
  }

  private hardReset(): void {
    this.flightGen++;
    this.detachScroll();
    this.cancelAnim();
    this.cleanupVisuals();
    this.phase = 'idle';
    this.active = null;
    this.descentRevealed = false;
    this.descentExitRequested = false;
    this.relay.setDescentFrom(null);
  }

  private cleanupVisuals(): void {
    this.cancelAnim();
    this.disposeStl();
    this.clearTrail();
    this.lane?.remove();
    this.lane = undefined;
    if (this.layer) {
      this.layer.innerHTML = '';
      this.layer.hidden = true;
      this.layer.classList.remove('logo-relay-layer--flight', 'logo-relay-layer--behind');
    }
  }
}

function quadBezier(a: number, b: number, c: number, t: number): number {
  const u = 1 - t;
  return u * u * a + 2 * u * t * b + t * t * c;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
