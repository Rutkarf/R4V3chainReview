import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollScrubDirective } from '../scroll-scrub.directive';

/**
 * Séquence scroll Awwwards-style autour du token R4V3 :
 * pin sticky → hyper-focus (zoom / blur / vignette) → reveal contenu.
 */
@Component({
  selector: 'app-r4v3-token-focus',
  imports: [RouterLink, ScrollScrubDirective],
  templateUrl: './r4v3-token-focus.html',
  styleUrl: './r4v3-token-focus.scss',
})
export class R4v3TokenFocus {
  /** Landing (CTAs fiche) ou page dédiée (moins de hauteur scrub). */
  @Input() variant: 'landing' | 'page' = 'landing';
}
