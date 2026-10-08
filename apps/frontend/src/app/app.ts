import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SiteHeader } from './layout/site-header/site-header';
import { SiteFooter } from './layout/site-footer/site-footer';
import { LogoRelayOverlay } from './shared/logo-relay/logo-relay-overlay';
import { IntroOverlay } from './shared/intro-overlay/intro-overlay';
import { AgeCallGate } from './shared/age-call-gate/age-call-gate';
import { AgeGateService } from './shared/age-call-gate/age-gate.service';
import { IntroService } from './shared/intro-overlay/intro.service';
import { LogoRelayService } from './shared/logo-relay/logo-relay.service';
import { ParticleBackgroundComponent } from './star-conquest/components/particle-background/particle-background';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    SiteHeader,
    SiteFooter,
    LogoRelayOverlay,
    AgeCallGate,
    IntroOverlay,
    ParticleBackgroundComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly ageGate = inject(AgeGateService);
  protected readonly intro = inject(IntroService);
  private readonly relay = inject(LogoRelayService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Bandeau Démo/FAQ : masqué sur l’accueil tant qu’on n’a pas scrollé. */
  protected readonly stickyVisible = signal(false);

  constructor() {
    if (this.intro.shouldPlay(location.pathname)) this.relay.armForIntro();
    this.syncHomeChrome();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncHomeChrome());
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.syncHomeChrome();
  }

  private syncHomeChrome(): void {
    const path = (this.router.url.split('?')[0] || '/').replace(/\/$/, '') || '/';
    const onHome = path === '/';
    if (!onHome) {
      this.stickyVisible.set(true);
      document.documentElement.classList.remove('home-scrolled');
      return;
    }
    // Pendant Feed The R4V3 / appel âge : pas de wash Luluw ni sticky.
    const introBusy =
      document.documentElement.classList.contains('intro-active') ||
      document.documentElement.classList.contains('age-gate-active') ||
      document.documentElement.classList.contains('intro-handoff');
    if (introBusy) {
      this.stickyVisible.set(false);
      document.documentElement.classList.remove('home-scrolled');
      return;
    }
    const scrolled = window.scrollY > 36;
    this.stickyVisible.set(scrolled);
    // Après disparition du cue Scroll / apparition du logo.stl voyageur.
    document.documentElement.classList.toggle('home-scrolled', scrolled);
  }
}
