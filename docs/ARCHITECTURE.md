# Architecture cible — dartchain.review

## Frontend (`apps/frontend`)

Angular 21 SPA avec **router** (contrairement à DartChain shell mono-page).

```
src/app/
├── core/           # config, interceptors, i18n, guards
├── shared/         # composants UI réutilisables (CTA, badges, surfaces)
├── layout/         # header, footer, shell
└── pages/
    ├── home/
    ├── comprendre/
    ├── r4v3/
    ├── faq/
    ├── forum/      # Phase 2
    ├── ressources/
    └── legal/      # mentions, confidentialité, risques
```

Styles : `src/styles/` ← tokens branchés depuis `design/tokens/`.

## Backend (`apps/backend`)

Spring Boot 3.5 / Java 21 — packages prévus :

```
io.dartchain.review
├── config/         # sécurité, CORS, properties
├── health/         # /api/health
├── content/        # pages FAQ / docs (Phase 1+)
├── community/      # forum (Phase 2)
├── auth/           # comptes contributeurs (Phase 2)
└── common/         # erreurs, DTOs partagés
```

API préfixe prévu : `/api` et `/api/v1` (aligné DartChain).

## Phases

1. Landing + FAQ + newsletter + légaux  
2. Forum hybride  
3. Dashboard / outils (si sources fiables)
