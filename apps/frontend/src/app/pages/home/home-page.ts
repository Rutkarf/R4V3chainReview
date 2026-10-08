import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { DemoHealthService } from '../../core/demo-health.service';
import { LogoStlViewer } from '../../shared/logo-stl-viewer/logo-stl-viewer';
import { LogoRelayAnchorDirective } from '../../shared/logo-relay/logo-relay-anchor.directive';
import { R4v3TokenFocus } from '../../shared/r4v3-token-focus/r4v3-token-focus';
import { IntroService } from '../../shared/intro-overlay/intro.service';
import { LogoRelayService } from '../../shared/logo-relay/logo-relay.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { LANDING_FAQ, FaqItem } from './landing-faq.data';

const SOURCE_REPO_API = 'https://api.github.com/repos/Rutkarf/dartchain';
const LAST_PUSH_FALLBACK = '01:35 (24/09/2026)';

const LANDING_FAQ_PREVIEW_IDS = [
  'real-crypto',
  'buy-r4v3',
  'peg-chf',
  'scam',
  'mainnet',
] as const;

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    FormsModule,
    LogoStlViewer,
    LogoRelayAnchorDirective,
    DatePipe,
    RevealDirective,
    R4v3TokenFocus,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit, OnDestroy {
  private readonly health = inject(DemoHealthService);
  private readonly http = inject(HttpClient);
  private readonly relay = inject(LogoRelayService);
  private readonly intro = inject(IntroService);
  private fallbackTimer = 0;

  /** Le sous-titre et le texte n’entrent qu’une fois le logo posé entre les deux lignes. */
  protected readonly logoIn = signal(false);
  protected readonly appVersion = '0.1.0';
  protected readonly lastPushLabel = signal<string | null>(null);

  protected readonly faqPreview = LANDING_FAQ.filter((item) =>
    (LANDING_FAQ_PREVIEW_IDS as readonly string[]).includes(item.id),
  );
  protected readonly openFaqId = signal<string | null>(this.faqPreview[0]?.id ?? null);
  protected readonly newsletterEmail = signal('');
  protected readonly newsletterStatus = signal<'idle' | 'ok' | 'invalid'>('idle');
  protected readonly linksVerifiedOn = new Date('2026-09-21');

  constructor() {
    effect(() => {
      this.logoIn.set(this.relay.landedIds().has('home-hero'));
    });
    effect(() => {
      if (!this.intro.finished()) return;
      window.clearTimeout(this.fallbackTimer);
      this.fallbackTimer = window.setTimeout(() => {
        if (!this.logoIn()) this.logoIn.set(true);
      }, 2600);
    });
  }

  ngOnInit(): void {
    this.loadLastPush();
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.fallbackTimer);
  }

  protected readonly healthStatus = this.health.status;
  protected readonly healthLabel = computed(() => {
    switch (this.healthStatus()) {
      case 'up':
        return 'API démo UP';
      case 'down':
        return 'API démo indisponible';
      case 'checking':
        return 'Vérification API…';
      default:
        return 'Statut API inconnu';
    }
  });

  protected toggleFaq(item: FaqItem): void {
    this.openFaqId.update((id) => (id === item.id ? null : item.id));
  }

  protected isOpen(id: string): boolean {
    return this.openFaqId() === id;
  }

  protected refreshHealth(): void {
    this.health.refresh();
  }

  private loadLastPush(): void {
    this.http
      .get<{ pushed_at?: string }>(SOURCE_REPO_API)
      .pipe(catchError(() => of(null)))
      .subscribe((repo) => {
        const raw = repo?.pushed_at;
        if (!raw) {
          this.lastPushLabel.set(LAST_PUSH_FALLBACK);
          return;
        }
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) {
          this.lastPushLabel.set(LAST_PUSH_FALLBACK);
          return;
        }
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        this.lastPushLabel.set(`${hh}:${mm} (${dd}/${mo}/${yyyy})`);
      });
  }

  protected submitNewsletter(event: Event): void {
    event.preventDefault();
    const email = this.newsletterEmail().trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      this.newsletterStatus.set('invalid');
      return;
    }
    try {
      const key = 'dartchain.review.newsletter';
      const prev = JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
      if (!prev.includes(email)) {
        localStorage.setItem(key, JSON.stringify([...prev, email]));
      }
    } catch {
      /* ignore */
    }
    this.newsletterStatus.set('ok');
    this.newsletterEmail.set('');
  }
}
