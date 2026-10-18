import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocEyebrow } from '../../shared/doc-eyebrow/doc-eyebrow';

interface OfficialLink {
  label: string;
  href: string;
  note: string;
}

@Component({
  selector: 'app-ressources-page',
  imports: [RouterLink, DocEyebrow],
  templateUrl: './ressources-page.html',
  styleUrl: './ressources-page.scss',
})
export class RessourcesPage {
  protected readonly links: readonly OfficialLink[] = [
    {
      label: 'Démo live',
      href: 'https://dartchain.pages.dev',
      note: 'Application R4V3chain (Cloudflare Pages)',
    },
    {
      label: 'Dépôt GitHub',
      href: 'https://github.com/Rutkarf/dartchain',
      note: 'Code source monorepo',
    },
    {
      label: 'API health',
      href: 'https://dartchain-backend-1-0-0.onrender.com/api/health',
      note: 'Probe backend Render',
    },
    {
      label: 'Image Docker backend',
      href: 'https://hub.docker.com/r/rutkarf/dartchain-backend',
      note: 'Image Docker actuelle (cutover → r4v3chain-backend)',
    },
  ];
}
