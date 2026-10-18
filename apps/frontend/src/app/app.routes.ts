import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
    title: 'R4V3chainReview — Comprendre R4V3chain',
  },
  {
    path: 'comprendre',
    loadComponent: () =>
      import('./pages/comprendre/comprendre-page').then((m) => m.ComprendrePage),
    title: 'Comprendre R4V3chain — R4V3chainReview',
  },
  {
    path: 'r4v3',
    loadComponent: () => import('./pages/r4v3/r4v3-page').then((m) => m.R4v3Page),
    title: 'Token R4V3 — R4V3chainReview',
  },
  {
    path: 'faq',
    loadComponent: () => import('./pages/faq/faq-page').then((m) => m.FaqPage),
    title: 'FAQ — R4V3chainReview',
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./pages/auth/register-page').then((m) => m.RegisterPage),
    title: 'Créer un compte — R4V3chainReview',
  },
  {
    path: 'connexion',
    loadComponent: () => import('./pages/auth/login-page').then((m) => m.LoginPage),
    title: 'Connexion — R4V3chainReview',
  },
  {
    path: 'ressources',
    loadComponent: () =>
      import('./pages/ressources/ressources-page').then((m) => m.RessourcesPage),
    title: 'Ressources — R4V3chainReview',
  },
  {
    path: 'legal/risques',
    loadComponent: () =>
      import('./pages/legal/legal-risques-page').then((m) => m.LegalRisquesPage),
    title: 'Risques cryptoactifs — R4V3chainReview',
  },
  {
    path: 'legal/mentions',
    loadComponent: () =>
      import('./pages/legal/legal-mentions-page').then((m) => m.LegalMentionsPage),
    title: 'Mentions légales — R4V3chainReview',
  },
  {
    path: 'legal/confidentialite',
    loadComponent: () =>
      import('./pages/legal/legal-confidentialite-page').then((m) => m.LegalConfidentialitePage),
    title: 'Confidentialité — R4V3chainReview',
  },
  { path: '**', redirectTo: '' },
];
