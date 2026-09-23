import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DemoHealthService } from '../../core/demo-health.service';
import { LogoStlViewer } from '../../shared/logo-stl-viewer/logo-stl-viewer';
import { LogoRelayAnchorDirective } from '../../shared/logo-relay/logo-relay-anchor.directive';
import { R4v3TokenFocus } from '../../shared/r4v3-token-focus/r4v3-token-focus';
import { RevealDirective } from '../../shared/reveal.directive';
import { LANDING_FAQ, FaqItem } from './landing-faq.data';

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
export class HomePage {
  private readonly health = inject(DemoHealthService);

  protected readonly faqPreview = LANDING_FAQ.filter((item) =>
    (LANDING_FAQ_PREVIEW_IDS as readonly string[]).includes(item.id),
  );
  protected readonly openFaqId = signal<string | null>(this.faqPreview[0]?.id ?? null);
  protected readonly newsletterEmail = signal('');
  protected readonly newsletterStatus = signal<'idle' | 'ok' | 'invalid'>('idle');
  protected readonly linksVerifiedOn = new Date('2026-09-21');

  protected readonly healthStatus = this.health.status;
  protected readonly healthCheckedAt = this.health.checkedAt;
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
