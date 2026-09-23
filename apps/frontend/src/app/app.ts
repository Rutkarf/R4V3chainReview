import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SiteHeader } from './layout/site-header/site-header';
import { SiteFooter } from './layout/site-footer/site-footer';
import { LogoRelayOverlay } from './shared/logo-relay/logo-relay-overlay';
import { IntroOverlay } from './shared/intro-overlay/intro-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, SiteHeader, SiteFooter, LogoRelayOverlay, IntroOverlay],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
