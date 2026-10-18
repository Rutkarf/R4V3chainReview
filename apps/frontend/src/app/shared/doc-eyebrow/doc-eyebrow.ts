import { Component, Input } from '@angular/core';
import { LogoStlViewer } from '../logo-stl-viewer/logo-stl-viewer';
import { LogoRelayAnchorDirective } from '../logo-relay/logo-relay-anchor.directive';

/** Pastille logo STL + libellé eyebrow pour pages doc. */
@Component({
  selector: 'app-doc-eyebrow',
  imports: [LogoStlViewer, LogoRelayAnchorDirective],
  template: `
    <div class="doc__eyebrow-row">
      <app-logo-stl-viewer
        variant="mark"
        [ariaLabel]="logoLabel"
        appLogoRelay="target"
        logoRelayId="doc-eyebrow"
      />
      <p class="doc__eyebrow">{{ label }}</p>
    </div>
  `,
})
export class DocEyebrow {
  @Input({ required: true }) label!: string;
  @Input() logoLabel = 'Logo R4V3chain';
}
