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
import { IntroService } from '../intro-overlay/intro.service';
import { LogoRelayFlight, LogoRelayService } from './logo-relay.service';
import { LogoRelayStlHost } from './logo-relay-stl-host';

type OverlayPhase = 'idle' | 'flight' | 'descend';

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
  private readonly intro = inject(IntroService);
  private readonly cache = inject(LogoStlCacheService);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private layer?: HTMLDivElement;
  private stlHost?: LogoRelayStlHost;
  private lane?: HTMLDivElement;
  private scrollHint?: HTMLDivElement;
  private raf = 0;
  private startTs = 0;
  private active: LogoRelayFlight | null = null;
  private phase: OverlayPhase = 'idle';
  private readonly duration = 1000;
  private readonly history: { x: number; y: number; s: number }[] = [];
  private readonly trailNodes: HTMLSpanElement[] = [];

  private centerFrom = { x: 0, y: 0, s: 48 };
  private traveler = { x: 0, y: 0, s: 52 };
  private descentExitRequested = false;
  /** Token bas masqué jusqu’au premier scroll de descente. */
  private descentRevealed = false;
  private flightGen = 0;
  private revealAnimRaf = 0;
  private travelerOpacity = 0;
  private scrollBound = false;
  private readonly onScroll = () => {
    if (this.atPageTop()) {
      // Plus de scroll vers le haut : le cue SCROLL revient (même après la descente).
      if (this.phase !== 'flight') this.restoreScrollCueAtTop();
    } else if (this.phase === 'descend' && this.pageScrollY() > 40) {
      this.revealTravelerFromScrollCue();
    }
    if (this.phase === 'descend' || this.phase === 'flight') {
      this.stlHost?.nudgeScrollSpin();
    }
    this.scheduleDescent();
  };
  private readonly onResize = () => {
    if (this.phase === 'descend' && !this.descentRevealed) {
      const park = this.parkPose();
      this.traveler = park;
      this.stlHost?.setPose(park.x, park.y, park.s, 0, 0);
      this.poseScrollHint(park.x, park.y, true);
    }
    this.scheduleDescent();
  };

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
      .subscribe((event) => {
        this.hardReset();
        this.relay.resetForNavigation();
        if (this.intro.shouldPlay(event.urlAfterRedirects) && !this.intro.finished()) {
          this.relay.armForIntro();
        }
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
      // Garder le listener : remonter en haut doit faire réapparaître le cue SCROLL.
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

    // Hero posé : cue Scroll en bas ; le logo voyageur n’apparaît qu’au premier scroll.
    if (doneId === 'home-hero') {
      this.traveler = { x: toCx, y: toCy, s: to.width };
      this.centerFrom = { ...this.traveler };
      this.clearTrail();
      // Masque le clone dès l’atterrissage hero — le cue Scroll prend le relais.
      this.stlHost?.setPose(toCx, toCy, Math.max(to.width, 36), 0, 0);
      let accepted = false;
      this.zone.run(() => {
        accepted = this.relay.completeFlight(doneId);
      });
      if (!accepted) {
        this.hardReset();
        return;
      }
      this.parkAtScrollCue(gen);
      return;
    }

    this.cleanupVisuals();
    this.phase = 'idle';
    this.zone.run(() => this.relay.completeFlight(doneId));
  }

  /* —— 2) Cue Scroll en bas, puis logo voyageur au premier scroll —— */

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
      await this.mountStl(this.traveler.s, true);
    }
    // Invisible tant que le cue Scroll est affiché.
    this.stlHost?.setPose(this.traveler.x, this.traveler.y, this.traveler.s, 0, 0);
    this.parkAtScrollCue(++this.flightGen);
  }

  /** Place le voyageur (invisible) + cue Scroll sous le DISCLAIMER. */
  private parkAtScrollCue(gen: number): void {
    if (gen !== this.flightGen) return;
    if (this.relay.isReduced()) {
      this.cleanupVisuals();
      this.phase = 'idle';
      this.relay.endDescent();
      return;
    }

    const park = this.parkPose();

    this.phase = 'descend';
    this.descentRevealed = false;
    this.descentExitRequested = false;
    this.traveler = park;
    this.ensureLayer('flight');
    this.clearTrail();

    if (!this.lane && this.layer) {
      this.lane = document.createElement('div');
      this.lane.className = 'logo-relay-lane';
      this.layer.appendChild(this.lane);
    }
    if (this.lane) this.lane.style.opacity = '0';

    this.travelerOpacity = 0;
    this.stlHost?.setPose(park.x, park.y, park.s, 0, 0);
    this.poseScrollHint(park.x, park.y, true);
    this.reportDescentRect();

    // Repose après l’anim disclaimer (hero--logo-in) pour éviter un chevauchement.
    window.setTimeout(() => {
      if (gen !== this.flightGen || this.phase !== 'descend' || this.descentRevealed) return;
      const again = this.parkPose();
      this.traveler = again;
      this.stlHost?.setPose(again.x, again.y, again.s, 0, 0);
      this.poseScrollHint(again.x, again.y, true);
      this.reportDescentRect();
    }, 820);

    this.attachScroll();

    if (this.pageScrollY() > 40) this.revealTravelerFromScrollCue();
  }

  /** Haut de page : plus aucun scroll vers le haut. */
  private pageScrollY(): number {
    const el = document.scrollingElement ?? document.documentElement;
    return Math.max(window.scrollY || 0, el.scrollTop || 0, 0);
  }

  private atPageTop(): boolean {
    return this.pageScrollY() <= 8;
  }

  private attachScroll(): void {
    if (this.scrollBound) return;
    this.scrollBound = true;
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
    });
  }

  /** Réaffiche le cue SCROLL sous le disclaimer. */
  private restoreScrollCueAtTop(): void {
    if (this.phase === 'descend') {
      this.hideTravelerToScrollCue();
      return;
    }
    if (this.phase !== 'idle') return;
    this.ensureLayer('flight');
    this.phase = 'descend';
    this.descentRevealed = false;
    this.descentExitRequested = false;
    const park = this.parkPose();
    this.traveler = park;
    this.travelerOpacity = 0;
    this.stlHost?.setPose(park.x, park.y, park.s, 0, 0);
    this.poseScrollHint(park.x, park.y, true);
    this.attachScroll();
  }

  /**
   * Emplacement du cue Scroll / logo.stl au repos :
   * centré sous le bandeau DISCLAIMER (jamais par-dessus).
   */
  private parkPose(): { x: number; y: number; s: number } {
    const s = 44;
    const x = window.innerWidth / 2;
    const disc = document.querySelector('.hero__disclaimer') as HTMLElement | null;
    // À ras sous le disclaimer (jamais remonté dans le bandeau).
    const gap = 8;
    const cueHalf = 34;
    const maxY = window.innerHeight - this.scrollBottomSafe() - cueHalf;

    if (disc) {
      const r = disc.getBoundingClientRect();
      return { x, y: r.bottom + gap + cueHalf, s };
    }

    return { x, y: maxY, s };
  }

  /** Remplace le cue Scroll par le logo.stl voyageur (fondu + léger scale). */
  private revealTravelerFromScrollCue(): void {
    if (this.phase !== 'descend' || this.descentRevealed) return;
    this.descentRevealed = true;
    this.fadeScrollHint();
    cancelAnimationFrame(this.revealAnimRaf);

    const park = this.parkPose();
    this.traveler = park;
    const fromOp = this.travelerOpacity;
    const start = performance.now();
    const dur = this.relay.isReduced() ? 1 : 560;

    const tick = (now: number) => {
      if (this.phase !== 'descend') return;
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      const op = fromOp + (1 - fromOp) * e;
      const scale = park.s * (0.78 + 0.22 * e);
      this.travelerOpacity = op;
      this.stlHost?.setPose(park.x, park.y, scale, op, (1 - e) * -14);
      if (this.lane) this.lane.style.opacity = String(0.08 + 0.32 * e);
      if (t < 1) {
        this.revealAnimRaf = requestAnimationFrame(tick);
        return;
      }
      this.travelerOpacity = 1;
      this.stlHost?.setPose(park.x, park.y, park.s, 1, 0);
      this.scheduleDescent();
    };
    this.revealAnimRaf = requestAnimationFrame(tick);
  }

  /** Remonte en haut : logo.stl s’efface, cue Scroll revient sous le DISCLAIMER. */
  private hideTravelerToScrollCue(): void {
    if (this.phase !== 'descend') return;
    if (!this.descentRevealed) {
      const park = this.parkPose();
      this.traveler = park;
      this.stlHost?.setPose(park.x, park.y, park.s, 0, 0);
      // Toujours recalculer la pose (évite le chevauchement disclaimer).
      this.poseScrollHint(park.x, park.y, true);
      return;
    }

    this.descentRevealed = false;
    this.descentExitRequested = false;
    cancelAnimationFrame(this.revealAnimRaf);
    cancelAnimationFrame(this.raf);
    this.raf = 0;

    const park = this.parkPose();
    this.traveler = park;
    const fromOp = this.travelerOpacity;
    const start = performance.now();
    const dur = this.relay.isReduced() ? 1 : 420;

    this.poseScrollHint(park.x, park.y, true);

    if (fromOp <= 0.02 || this.relay.isReduced()) {
      this.travelerOpacity = 0;
      this.stlHost?.setPose(park.x, park.y, park.s, 0, 0);
      if (this.lane) this.lane.style.opacity = '0';
      return;
    }

    const tick = (now: number) => {
      if (this.phase !== 'descend') return;
      // Si l’utilisateur redescend pendant le fondu, on laisse reveal reprendre.
      if (this.descentRevealed) return;
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      const op = fromOp * (1 - e);
      this.travelerOpacity = op;
      this.stlHost?.setPose(park.x, park.y, park.s * (1 - 0.12 * e), op, e * 10);
      if (this.lane) this.lane.style.opacity = String(0.35 * (1 - e));
      if (t < 1) {
        this.revealAnimRaf = requestAnimationFrame(tick);
        return;
      }
      this.travelerOpacity = 0;
      this.stlHost?.setPose(park.x, park.y, park.s, 0, 0);
      if (this.lane) this.lane.style.opacity = '0';
    };
    this.revealAnimRaf = requestAnimationFrame(tick);
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
    const tokenHalf = 22;
    const bottomSafe = this.scrollBottomSafe();
    const y = window.innerHeight - tokenHalf - bottomSafe;
    const s = 44 + Math.sin(progress * Math.PI) * 8;

    this.traveler = { x, y, s };
    this.travelerOpacity = 1;
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
    const bottomSafe = this.scrollBottomSafe();
    const endY = window.innerHeight - bottomSafe - 8;
    const startY = window.innerHeight * 0.28;
    const h = Math.max(endY - startY, 40) * (0.55 + progress * 0.45);
    this.lane.style.height = `${h}px`;
    this.lane.style.opacity = String(0.35 + progress * 0.3);
    this.lane.style.transform = `translate(${window.innerWidth / 2 - 1}px, ${startY}px)`;
  }

  /** Marge basse : laisse l’arc SCROLL + bob entièrement visibles. */
  private scrollBottomSafe(): number {
    if (window.innerWidth > 720) return 40;
    const sticky = document.querySelector('.mobile-sticky') as HTMLElement | null;
    const stickyOn =
      !!sticky &&
      sticky.classList.contains('mobile-sticky--visible') &&
      getComputedStyle(sticky).visibility !== 'hidden';
    const stickyH = stickyOn ? sticky!.getBoundingClientRect().height : 0;
    if (stickyH > 8) return Math.max(128, Math.round(stickyH + 56));
    // Accueil avant scroll : marge sous le glyphe SCROLL (stroke + bob).
    return 56;
  }

  private ensureScrollHint(): void {
    if (this.scrollHint || !this.layer) return;
    const el = document.createElement('div');
    el.className = 'logo-relay-scroll-hint';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <span class="logo-relay-scroll-hint__mouse">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <rect x="6.5" y="1.5" width="11" height="20" rx="5.5" fill="none" stroke="currentColor" stroke-width="1.6" />
          <circle class="logo-relay-scroll-hint__wheel" cx="12" cy="8" r="1.35" fill="currentColor" />
        </svg>
      </span>
      <svg class="logo-relay-scroll-hint__arc" viewBox="0 0 148 32" width="148" height="32" aria-hidden="true">
        <defs>
          <path id="logo-relay-scroll-arc" d="M 14 8 Q 74 28 134 8" fill="none" />
        </defs>
        <text class="logo-relay-scroll-hint__arc-text">
          <textPath href="#logo-relay-scroll-arc" xlink:href="#logo-relay-scroll-arc" startOffset="50%" text-anchor="middle">SCROLL</textPath>
        </text>
      </svg>
    `;
    this.layer.appendChild(el);
    this.scrollHint = el;
  }

  private poseScrollHint(x: number, y: number, visible: boolean): void {
    this.ensureScrollHint();
    const el = this.scrollHint;
    if (!el) return;
    // Toujours à ras sous le disclaimer — jamais remonté par-dessus.
    const disc = document.querySelector('.hero__disclaimer') as HTMLElement | null;
    const top = disc ? disc.getBoundingClientRect().bottom + 8 : y;
    el.style.transform = `translate(${x}px, ${top}px) translate(-50%, 0)`;
    el.classList.toggle('is-live', visible);
    if (visible) el.classList.remove('is-gone');
  }

  private fadeScrollHint(): void {
    this.scrollHint?.classList.add('is-gone');
    this.scrollHint?.classList.remove('is-live');
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
    cancelAnimationFrame(this.revealAnimRaf);
    this.revealAnimRaf = 0;
  }

  private detachScroll(): void {
    if (!this.scrollBound) return;
    this.scrollBound = false;
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
    this.travelerOpacity = 0;
    this.relay.setDescentFrom(null);
  }

  private cleanupVisuals(): void {
    this.cancelAnim();
    this.disposeStl();
    this.clearTrail();
    this.lane?.remove();
    this.lane = undefined;
    this.scrollHint?.remove();
    this.scrollHint = undefined;
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

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
