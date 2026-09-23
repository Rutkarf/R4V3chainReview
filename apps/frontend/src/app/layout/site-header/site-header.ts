import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoStlViewer } from '../../shared/logo-stl-viewer/logo-stl-viewer';
import { LogoRelayAnchorDirective } from '../../shared/logo-relay/logo-relay-anchor.directive';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, LogoStlViewer, LogoRelayAnchorDirective],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  host: {
    '[class.site-header-host--scrolled]': 'scrolled()',
  },
})
export class SiteHeader {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);
  protected readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.closeMenu();
  }
}
