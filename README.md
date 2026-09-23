# dartchain.review

Monorepo du site **dartchain.review** — hub de présentation, documentation, FAQ communautaire et transparence autour de DartChain / R4V3.

> Statut : **scaffold initial** (structure uniquement). Pas encore de landing, forum ni contenu métier.

## Relation avec DartChain

| Projet | Rôle |
|--------|------|
| `../dartchain` | Produit démo live ([dartchain.pages.dev](https://dartchain.pages.dev)) |
| `dartchainReview` | Site confiance / docs / communauté (`dartchain.review`) |

Stack alignée sur DartChain :

- **Frontend** — Angular 21 + SCSS
- **Backend** — Spring Boot 3.5 / Java 21
- **Charte** — tokens extraits de l’app DartChain (`design/`)

## Structure

```
dartchainReview/
├── apps/
│   ├── frontend/          # Angular 21 (SPA dartchain.review)
│   └── backend/           # Spring Boot 3.5 (API review)
├── design/
│   ├── tokens/            # Charte CSS (copie depuis DartChain)
│   └── fonts/             # Références typographiques
└── docs/
    ├── CHARTE-GRAPHIQUE.md
    └── ARCHITECTURE.md
```

## Démarrage (après implémentation)

```bash
# Frontend
cd apps/frontend && npm start

# Backend
cd apps/backend && ./mvnw spring-boot:run
```

## Charte graphique

Voir [docs/CHARTE-GRAPHIQUE.md](docs/CHARTE-GRAPHIQUE.md).  
Sources : `../dartchain/apps/dartchain-frontend/Dart/src/styles/design-system-tokens.css` et `theme.css`.

## Avertissement

DartChain / R4V3 sont documentés comme **démo / testnet** dans le codebase source.  
Ce site doit rester pédagogique : pas de promesse financière, pas de FOMO.
