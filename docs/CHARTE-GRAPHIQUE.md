# Charte graphique R4V3chain → R4V3chainReview

Document d’extraction depuis le codebase R4V3chain (`apps/r4v3chain-frontend/Dart`).  
**Source de vérité tokens :** `design/tokens/` (copie locale).

## Positionnement visuel

- **Univers :** dark navy fintech / Web3 premium (Pass 1 design system)
- **Ton :** cyberpunk **sobre** — accents cyan maîtrisés, pas « casino crypto »
- **Surfaces :** glassmorphisme fintech subtil (`.ds-surface`), grain/sheen quasi invisibles
- **Viewport produit R4V3chain :** 250 × 550 px (shell mobile) — **R4V3chainReview** utilisera un layout web large, avec les **mêmes tokens couleur / typo / CTA**

## Palette marque (theme.brand.css)

| Token | Hex | Usage |
|-------|-----|--------|
| `--brand-black` | `#020100` | Fond profond |
| `--brand-ultra-purple` | `#120a1e` | Violet ultra-sombre (atmosphère) |
| `--brand-baltic-blue` | `#235789` | Accent marque historique |
| `--brand-info-grey` | `#8b9dad` | Gris informatique |
| `--brand-porcelain` | `#fdfffc` | Blanc porcelaine (texte clair / contraste) |

Échelle site `--palette-1` … `--palette-9` : noir → bleu baltique → porcelaine.

## Palette sémantique fintech (design-system-tokens.css — Pass 1)

| Token | Hex | Rôle |
|-------|-----|------|
| `--bg-primary` | `#000000` | Fond |
| `--surface` | `#0a1220` | Surface |
| `--surface-elevated` | `#0d1828` | Surface élevée |
| `--surface-hover` | `#111f32` | Hover |
| `--text-primary-ds` | `#e8eef5` | Texte principal |
| `--text-secondary-ds` | `#8b9bb0` | Texte secondaire |
| `--text-muted-ds` | `#5c6b7e` | Texte atténué |
| `--accent-cyan` | `#2ec4d6` | **Accent principal** (alias neon-cyan sobre) |
| `--accent-purple` | `#7b6cff` | Accent secondaire |
| `--success` | `#2ecc8a` | Succès / live |
| `--warning` | `#e6b84d` | Avertissement / risques |
| `--danger` | `#e85d75` | Erreur / alerte scam |

> Note : `theme.css` (marque Baltic Blue) est **remappé** par Pass 1 vers cyan teal `#2ec4d6` via `--accent-primary`. Pour R4V3chainReview, **privilégier les tokens `--ds-*` / `--accent-cyan`**.

## Typographie

| Rôle | Famille | Token |
|------|---------|--------|
| Display / titres tech | **Orbit** | `--font-display` / `--ds-font-display` |
| UI / corps | **Inter**, Roboto, system-ui | `--font-ui` / `--ds-font-ui` |
| Corps legacy | **Roboto** | `--font-body` (theme) |
| Mono / data | **JetBrains Mono**, Roboto Mono | `--font-mono` |
| Présents aussi (usage limité) | Open Sans, Share Tech Mono, VT323, Libre Baskerville, Caveat | `design/fonts/google-fonts.css` |

Pour le site .review (lecture longue) : **Orbit** (titres) + **Inter/Roboto** (corps) + mono pour adresses / hash.

## Rayons, espaces, ombres

- Rayons : `--radius-sm` 8px → `--radius-xl` 18px → pill 999px
- Espaces : grille 4px (`--space-1` … `--space-12`)
- Ombres : soft/card sobres ; focus ring cyan double
- Glow : **minimal** (`--ds-glow-active`) — guide l’attention, pas neon gaming

## Boutons (CTA)

Classes : `.cta` + variantes `--primary` / `--secondary` / `--tertiary` / `--accent` / `--danger`  
Tailles : `--sm` / `--md` / `--lg`

- **Primary :** fond cyan `#2ec4d6`, texte `#050a12`, uppercase, letter-spacing
- **Secondary :** surface élevée, bordure soft
- **Tertiary :** ghost
- Transition ~160ms ; `focus-visible` obligatoire

Fichier : `design/tokens/cta-buttons.css`

## Surfaces

Classe `.ds-surface` (+ `--standard` / `--elevated` / `--active` / `--card` / `--strip`)  
Fichier : `design/tokens/ds-surface.css`

## Règles pour R4V3chainReview

1. Réutiliser les tokens `--ds-*` ; ne pas inventer une 2ᵉ palette.
2. Éviter glow excessif, dégradés « pump », pills casino.
3. Badge **Testnet / Démo** visible quand R4V3 est évoqué.
4. Encadrés risques : `--warning` / surface warning tokens.
5. Accessibilité : contraste AA+, `prefers-reduced-motion`, focus ring.
6. Performance : ne pas charger Three.js sur les pages docs.

## Fichiers copiés

| Fichier local | Origine R4V3chain |
|---------------|-------------------|
| `design/tokens/design-system-tokens.css` | `src/styles/design-system-tokens.css` |
| `design/tokens/theme.brand.css` | `src/theme.css` |
| `design/tokens/ds-surface.css` | `src/styles/ds-surface.css` |
| `design/tokens/cta-buttons.css` | `src/cta-buttons.css` |
| `design/fonts/google-fonts.css` | `src/styles/google-fonts.css` |
