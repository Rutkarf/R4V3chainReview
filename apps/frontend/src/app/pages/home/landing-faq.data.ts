export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/** FAQ landing — faits alignés README / codebase DartChain. */
export const LANDING_FAQ: readonly FaqItem[] = [
  {
    id: 'real-crypto',
    question: 'DartChain est-elle une crypto réelle à acheter ?',
    answer:
      'Non. Selon le dépôt officiel, DartChain est une démo full-stack : pas de mainnet, pas de custodian, pas d’achat. Les jetons sont de démonstration uniquement.',
  },
  {
    id: 'buy-r4v3',
    question: 'Puis-je acheter du R4V3 ?',
    answer:
      'Non sur l’environnement actuel. R4V3 est le token natif de la chaîne démo (chain-id 3377). Sur testnet, on l’obtient via le faucet intégré à l’application, pas via un marché public.',
  },
  {
    id: 'peg-chf',
    question: 'Que signifie « 1 R4V3 = 1 CHF » ?',
    answer:
      'C’est un ancrage d’affichage pédagogique dans l’interface pour lire les montants facilement. Ce n’est pas une promesse financière, ni un stablecoin régulé, ni une garantie de parité.',
  },
  {
    id: 'm4t3r',
    question: 'Qu’est-ce que le m4t3r / M4T3R ?',
    answer:
      'C’est la micro-unité du R4V3 utilisée dans l’exchange, le faucet et les récompenses du metaverse (pickups). Le symbole principal reste R4V3.',
  },
  {
    id: 'launchlab',
    question: 'Quelle différence entre R4V3 et les tokens LaunchLab ?',
    answer:
      'R4V3 est la monnaie de référence de la démo. Les tokens LaunchLab (ex. PXD, NVFI, LAB3, ORB) sont des actifs d’expérimentation cotés par rapport au R4V3 dans le panneau swap.',
  },
  {
    id: 'free',
    question: 'La démo est-elle gratuite ?',
    answer:
      'Oui : l’expérience live sur dartchain.pages.dev est une démonstration. Aucun dépôt d’argent n’est requis pour explorer wallet, faucet, swap pédagogique ou le jumeau 3D de Marseille.',
  },
  {
    id: 'mainnet',
    question: 'Y a-t-il un mainnet aujourd’hui ?',
    answer:
      'Non. Le README du projet place explicitement mainnet, custody et token réel hors scope. La chaîne démo utilise le chain-id 3377 (DartChain Native).',
  },
  {
    id: 'source',
    question: 'Où est le code source ?',
    answer:
      'Le monorepo est public sur GitHub (Rutkarf/dartchain) : frontend Angular + Three.js, backend Spring Boot, Docker et CI.',
  },
  {
    id: 'scam',
    question: 'Comment repérer une arnaque liée à DartChain / R4V3 ?',
    answer:
      'Ne partagez jamais de seed phrase. Vérifiez les URLs officielles listées sur dartchain.review (démo pages.dev, GitHub). Méfiez-vous des DMs proposant d’acheter R4V3 ou de « reclaim » des fonds.',
  },
  {
    id: 'dao',
    question: 'La DAO et le marché sont-ils réels ?',
    answer:
      'Dans l’app, les onglets D.A.O et MARCHÉ sont des surfaces de démonstration / preview UX. Ils ne constituent pas une gouvernance on-chain mainnet ni un marché d’actifs réels.',
  },
  {
    id: 'marseille',
    question: 'Le metaverse Marseille est-il précis ?',
    answer:
      'C’est un jumeau pédagogique basé sur des footprints OpenStreetMap (précision approximative). Ce n’est pas un levé cadastral IGN.',
  },
  {
    id: 'guarantees',
    question: 'Quelles garanties existent sur R4V3 ?',
    answer:
      'Les garanties portent sur la transparence et la pédagogie de la démo, pas sur une couverture financière. Aucune promesse de rendement ou de parité régulée.',
  },
];
