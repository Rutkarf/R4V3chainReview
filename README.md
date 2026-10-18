<div align="center">

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   R4V3chain ▸ Review                                           ║
║   ◈  TRUST  ·  DOCS  ·  COMMUNITY  ◈                           ║
║                                                                ║
║   pedagogy first  ·  never yield  ·  hold the signal           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

# R4V3chainReview

**Hub de confiance, documentation & communauté** autour de **R4V3chain** / **R4V3**.

[![Product](https://img.shields.io/badge/◈_PRODUCT-R4V3chain-0A1220?style=for-the-badge&labelColor=2ec4d6)](https://github.com/Rutkarf/R4V3chain)
[![Demo](https://img.shields.io/badge/DEMO-r4v3chain.pages.dev-235789?style=for-the-badge)](https://r4v3chain.pages.dev)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](#-stack)
[![Spring](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](#-stack)

```
◆  Public hub = pédagogie  ◆  Jamais un marketplace yield  ◆
```

| | |
|:--|:--|
| **◈ Rôle** | Comprendre · FAQ · légal · transparence |
| **◈ Produit live** | [R4V3chain](https://github.com/Rutkarf/R4V3chain) · [démo](https://r4v3chain.pages.dev) |
| **◈ Canon** | White Paper · Roadmap N1 · FAITS 001 ⟩ posts |
| **◈ Ports locaux** | Frontend **4201** · Backend **8081** |

> Contenu éducatif. **Pas** un conseil en investissement.  
> R4V3 = jeton de démonstration / testnet. Document **non audité** · **pas une offre de titres**.

</div>

---

## ◈ Pourquoi ce hub existe

```
┌─ BLACK_CODE ───────────────────────────────────────────────┐
│  La vitre HTTPS prouve qu’un artefact public existe.       │
│  Ce site explique ce qui est protocole, lore, ou UI démo   │
│  — sans FOMO, sans promesse de gain.                       │
└────────────────────────────────────────────────────────────┘
```

| Projet | Mission |
|:-------|:--------|
| ◆ [**R4V3chain**](https://github.com/Rutkarf/R4V3chain) | Vitre produit — wallet, chaîne, MetaVerseBB |
| ◆ **R4V3chainReview** | Couche confiance — docs, FAQ, risques, comptes |

Aligné Roadmap N1 : *public = hub pédagogique, jamais yield*.

---

## ◈ Canon express (White Paper + Roadmap)

### Protocole

| | |
|:--|:--|
| ◆ Nature | Comptabilité **peer-to-peer** |
| ◆ Token / subunit | **R4V3** / **M4T3R** (26 decimals) |
| ◆ Frais | **CAN0PY** `fee(n)=1+10×⌊(n−1)/10⌋` M4T3R · 1ʳᵉ mine = 1 |
| ◆ ChronoBoost | 26 → 8 decimals (−1d / 31 Jan) |
| ◆ Phases | **Signal** (bootstrap RJHBZ) → **City** (multi-nœuds) |

### Faits dossier (≠ promesse marché)

| | |
|:--|:--|
| ◆ Peg intention | 1 CHF ≈ 1 R4V3 tant que le bag créateur respire |
| ◆ Burn créateur | **2,6 % / an** redistribués dans la Nation |
| ◆ Capital | SAS **10 000 CHF** |
| ◆ Split fees | 49 / 49 / 1 / 1 |
| ◆ Signal public | **31 / 01 / 2027** · France · LORA + ionosphère |

### Cap Nation (cibles)

```
10 000 nœuds  ·  jusqu’à 1 000 000 wallets
ladder ×26    ·  DIY 10 NODES  ·  SAWT
planif. jusqu’à 26 000 000 CHF cumulés  (seuil lore ≠ jackpot)
```

```
Serment
───────
Je n’achète pas un trône. Je tiens un signal.
Je ne garantis aucun bénéfice.
Don't Sell Ur R4V3 · Hold the Signal
```

---

## ◈ Stack

| Couche | Tech |
|:-------|:-----|
| ◆ Frontend | Angular 21 · SCSS · **router** multi-pages |
| ◆ Backend | Spring Boot 3.5 · Java 21 · H2 (MVP local) |
| ◆ Design | Tokens issus de R4V3chain (`design/tokens/`) |
| ◆ Auth | JWT contributeurs (scaffold) |

```
R4V3chainReview/
├── apps/
│   ├── frontend/     ◈ SPA (4201)
│   └── backend/      ◈ API health · auth · FAQ (8081)
├── design/           ◈ tokens · fonts
└── docs/             ◈ ARCHITECTURE · CHARTE
```

---

## ◈ Quick start

### Frontend

```bash
cd apps/frontend
npm install
npm start
# → http://localhost:4201
```

### Backend

```bash
cd apps/backend
./mvnw spring-boot:run
# → http://localhost:8081/api/health
```

---

## ◈ Cartographie des pages

| Route | Mission |
|:------|:--------|
| ◆ `/` | Accueil / hub |
| ◆ `/comprendre` | Protocole vs démo vs lore |
| ◆ `/r4v3` | Token R4V3 / M4T3R |
| ◆ `/faq` | FAQ communautaire |
| ◆ `/ressources` | Liens vérifiés |
| ◆ `/inscription` · `/connexion` | Comptes contributeurs |
| ◆ `/legal/*` | Risques · mentions · confidentialité |

Statut : **scaffold** — structure & charte prêtes ; contenu s’enrichit avec le dossier SEAL.

---

## ◈ Documentation

| Source | Rôle |
|:-------|:-----|
| ◆ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layout front / back |
| ◆ [docs/CHARTE-GRAPHIQUE.md](docs/CHARTE-GRAPHIQUE.md) | Tokens UI |
| ◆ White Paper R4V3 / M4T3R | Spec protocole + faits (26p) |
| ◆ Roadmap N1 | Cap · ChronoBoost · axes · jalons (26p) |

```
FAITS 001  ⟩  White Paper  ⟩  posts
```

---

## ◈ Lien produit

| Lien | URL |
|:-----|:----|
| ◆ Code produit | [github.com/Rutkarf/R4V3chain](https://github.com/Rutkarf/R4V3chain) |
| ◆ Démo | [r4v3chain.pages.dev](https://r4v3chain.pages.dev) |
| ◆ API health | [`/api/health`](https://r4v3chain-backend-1-0-0.onrender.com/api/health) |

---

## ◈ Disclaimer

```
┌────────────────────────────────────────────────────────────┐
│  Pas de FOMO. Pas de yield. Pas de CTA d’achat.            │
│  Contenu pédagogique & transparence uniquement.            │
│  Document non audité · pas une offre de titres.            │
└────────────────────────────────────────────────────────────┘
```

<div align="center">

```
◈  Wake the tag. Hold the signal.  ◈
```

**v0.1.0** · RJHBZ · companion to SAS R4V3chain

[R4V3chain](https://github.com/Rutkarf/R4V3chain) · [Demo](https://r4v3chain.pages.dev)

</div>
