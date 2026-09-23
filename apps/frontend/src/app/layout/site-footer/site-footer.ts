import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoStlViewer } from '../../shared/logo-stl-viewer/logo-stl-viewer';
import { LogoRelayAnchorDirective } from '../../shared/logo-relay/logo-relay-anchor.directive';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, LogoStlViewer, LogoRelayAnchorDirective],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
}
