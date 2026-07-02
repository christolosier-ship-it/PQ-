# PQ+

PQ+ est une mini PWA mobile-first de papier toilette numérique écologique. Elle présente, avec un sérieux volontairement disproportionné, une expérience sanitaire numérique basée sur un rouleau SVG interactif, des statistiques pseudo-scientifiques et des certifications locales.

## Architecture

```text
/pq-plus
├── index.html
├── style.css
├── app.js
├── manifest.webmanifest
├── service-worker.js
└── README.md
```

## Fonctionnalités

- Rouleau de papier toilette en SVG inline avec tube, feuille, lignes de prédécoupe et ombre.
- Swipe tactile ou souris via Pointer Events, compatible vertical et horizontal.
- Bouton **Déroulement assisté** pour l’accessibilité.
- Modes Classique, Éco et Premium avec comportements et messages distincts.
- Tableau de bord d’impact : feuilles virtuelles, sessions, indice de propreté, confort, arbres préservés, CO₂ narratif et dématérialisation sanitaire.
- Badges persistants : premier déroulement, sobriété, confort augmenté et certifications avancées.
- Onboarding léger affiché uniquement au premier lancement.
- Thème clair / sombre sauvegardé en `localStorage`.
- Service worker cache-first pour un fonctionnement offline après première visite.
- Manifest PWA avec icônes SVG en data URI, sans fichier externe.

## Lancer localement

Aucune dépendance, aucun build et aucun CDN ne sont nécessaires.

```bash
python3 -m http.server 8080
```

Ouvrez ensuite :

```text
http://localhost:8080
```

> Le service worker nécessite un contexte sécurisé ou `localhost`. L’ouverture directe du fichier `index.html` affiche l’interface, mais l’installation PWA et le cache offline nécessitent un petit serveur local.

## Données locales

PQ+ utilise `localStorage` pour conserver :

- les statistiques ;
- le mode actif ;
- les badges débloqués ;
- le thème ;
- l’état de l’onboarding.

Le bouton **Réinitialiser mon protocole sanitaire numérique** remet à zéro les statistiques, les badges et l’onboarding.
