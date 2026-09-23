import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
    title: 'dartchain.review — Comprendre DartChain',
  },
  {
    path: 'comprendre',
    loadComponent: () =>
      import('./pages/comprendre/comprendre-page').then((m) => m.ComprendrePage),
    title: 'Comprendre DartChain — dartchain.review',
  },
  {
    path: 'r4v3',
    loadComponent: () => import('./pages/r4v3/r4v3-page').then((m) => m.R4v3Page),
    title: 'Token R4V3 — dartchain.review',
  },
  {
    path: 'faq',
    loadComponent: () => import('./pages/faq/faq-page').then((m) => m.FaqPage),
    title: 'FAQ — dartchain.review',
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./pages/auth/register-page').then((m) => m.RegisterPage),
    title: 'Créer un compte — dartchain.review',
  },
  {
    path: 'connexion',
    loadComponent: () => import('./pages/auth/login-page').then((m) => m.LoginPage),
    title: 'Connexion — dartchain.review',
  },
  {
    path: 'ressources',
    loadComponent: () =>
      import('./pages/ressources/ressources-page').then((m) => m.RessourcesPage),
    title: 'Ressources — dartchain.review',
  },
  {
    path: 'legal/risques',
    loadComponent: () =>
      import('./pages/legal/legal-risques-page').then((m) => m.LegalRisquesPage),
    title: 'Risques cryptoactifs — dartchain.review',
  },
  {
    path: 'legal/mentions',
    loadComponent: () =>
      import('./pages/legal/legal-mentions-page').then((m) => m.LegalMentionsPage),
    title: 'Mentions légales — dartchain.review',
  },
  {
    path: 'legal/confidentialite',
    loadComponent: () =>
      import('./pages/legal/legal-confidentialite-page').then((m) => m.LegalConfidentialitePage),
    title: 'Confidentialité — dartchain.review',
  },
  { path: '**', redirectTo: '' },
];
