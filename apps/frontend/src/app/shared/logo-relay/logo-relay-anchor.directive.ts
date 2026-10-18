import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { LogoRelayRole, LogoRelayService } from './logo-relay.service';

/**
 * Marque un host logo comme source (header) ou cible (hero / footer / eyebrow).
 * Les cibles se révèlent après le vol du clone (ou immédiatement si reduced-motion).
 */
@Directive({
  selector: '[appLogoRelay]',
})
export class LogoRelayAnchorDirective implements OnInit, OnDestroy {
  @Input('appLogoRelay') role: LogoRelayRole = 'target';
  /** Identifiant stable de la cible (ex. home-hero, home-footer, doc-eyebrow). */
  @Input() logoRelayId = '';

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly relay = inject(LogoRelayService);
  private observer?: IntersectionObserver;
  private id = '';

  ngOnInit(): void {
    const node = this.el.nativeElement;
    if (this.role === 'source') {
      node.classList.add('logo-relay-source');
      this.relay.registerSource(node);
      return;
    }

    this.id = this.logoRelayId || `target-${Math.random().toString(36).slice(2, 9)}`;
    node.classList.add('logo-relay-target');
    this.relay.registerTarget(this.id, node);

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.15) {
          this.relay.requestFlight(this.id);
        }
      },
      { threshold: [0.1, 0.2, 0.35, 0.5], rootMargin: '0px' },
    );
    this.observer.observe(node);

    // Déjà visible au chargement (hero above the fold)
    requestAnimationFrame(() => {
      const r = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (r.bottom > 40 && r.top < vh * 0.92) {
        this.relay.requestFlight(this.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    const node = this.el.nativeElement;
    if (this.role === 'source') {
      this.relay.unregisterSource(node);
    } else if (this.id) {
      this.relay.unregisterTarget(this.id, node);
    }
  }
}
