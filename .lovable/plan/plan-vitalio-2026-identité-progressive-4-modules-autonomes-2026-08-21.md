# Plan — Vitalio 2026 : identité progressive + 4 modules autonomes

## Principe directeur
Un utilisateur peut tout explorer sans compte. Dès qu'il **agit** (publier un Flash, rejoindre une Zone, lancer un Scan, créer un Espace), l'app lui demande son prénom — une seule fois, dans une feuille douce — puis demande les permissions (géoloc, caméra, notifications) uniquement au moment où elles servent. Chaque information collectée enrichit progressivement son profil en base.

Langage humain partout : « Dis-nous ton prénom », « On regarde autour de toi », « 3 personnes cherchent la même chose ».

---

## 1. Architecture modulaire (fondation)

Réorganisation en modules autonomes, chacun avec sa propre logique isolée des composants :

```text
src/
  core/            identity, permissions, db (Dexie), sync (Cloud), ui primitives
  modules/
    flash/   { api, hooks, components, FlashPage }
    zone/    { api, hooks, components, ZonePage }
    scan/    { engine, hooks, components, ScanPage }
    espace/  { api, hooks, components, EspacePage, EspaceDetail }
  app/             routing, shell, providers
```

Règles appliquées : zéro logique métier dans les composants (tout en hooks + services), un module ne dépend jamais d'un autre — ils communiquent via `core` (types partagés + event bus léger). Les pages existantes sont déplacées/refactorées, pas dupliquées ; les fichiers devenus inutiles (`Index.tsx`, `spaceStore.ts` legacy, `boiteMocks.ts`) sont supprimés.

## 2. Identité progressive (`core/identity`)

- Table `profiles` en base (Lovable Cloud) + cache local Dexie, clé = `deviceId` anonyme.
- `useIdentity()` expose `{ identity, ensureIdentity(reason) }`. `ensureIdentity` ouvre une feuille « Comment on t'appelle ? » si le prénom manque, sinon résout immédiatement.
- Chaque action sensible passe par `ensureIdentity('publier un Flash')` — le motif est affiché à l'utilisateur.
- Enrichissement progressif : après le prénom, l'app propose (jamais n'impose) la ville, les centres d'intérêt, l'avatar — chaque champ rempli met à jour la ligne en base.
- Sécurité : RLS sur `profiles`, `flashes`, `zone_members` — lecture publique limitée aux champs non sensibles, écriture liée au `deviceId`/session anonyme signée. GRANTs explicites.

## 3. Permissions natives (`core/permissions`)

`usePermission('geolocation' | 'camera' | 'notifications')` : état, demande contextuelle, écran de repli explicite si refusé (« Sans ta position, on te montre les zones populaires de ta ville »). Jamais de demande au démarrage.

## 4. Home — comprendre l'app en 2 secondes

Refonte : une phrase forte (« Dis ce dont tu as besoin. On trouve autour de toi. »), puis 4 tuiles module (Flash, Zone, Scan, Espace) avec une ligne d'explication chacune et un état vivant (nombre de flashs actifs, zone la plus chaude). En dessous, le feed Flash à proximité. Plus de simple liste sans contexte.

## 5. Flash — publier un besoin en 5 secondes

- Composer en une ligne : champ « De quoi as-tu besoin ? », chips de catégorie, durée (15 min / 1 h / 4 h), bouton Publier. Géoloc capturée en arrière-plan si autorisée.
- Publication → table `flashes` (texte, catégorie, position, expiration, auteur) → immédiatement indexée pour Scan/Radar.
- Feed structuré : « Le tien » (avec compte à rebours + bouton Clôturer), « Autour de toi », « Populaires ». Cartes denses, badge live, distance.
- Fin de parcours claire : après publication, écran « Ton flash est en ligne » + suivi des réponses.

## 6. Zone — naviguer et se connecter

- Liste + carte des zones triées par activité (score = flashs actifs + membres + opportunités).
- Détail zone : pouls d'activité, flashs en cours, opportunités (offres des Espaces), membres, bouton « Rejoindre cette zone » (→ `ensureIdentity`, puis `zone_members`).
- Une fois connecté : notifications de zone, accès aux opportunités, CTA vers les Espaces locaux.

## 7. Scan — le moteur, pièce maîtresse

- **Configuration avant lancement** : type de recherche (Urgence / À proximité / Zone ciblée / Personnel), rayon, catégories, zone. Interface de « programmation » du scan, sauvegardable en préréglage.
- **Exécution visuelle** : radar en couches (rayons, sweep, ondes, blips), progression par phases annoncées (« Balayage 300 m », « Croisement des besoins », « Classement ») — animations Framer Motion, GPU-friendly, désactivées si `prefers-reduced-motion`.
- **Moteur** (`scan/engine`, pur TypeScript, testable) : agrège flashs, zones et espaces, score par urgence / distance / pertinence / fraîcheur, dédoublonne et classe.
- **Résultats** : cadre moderne groupé par catégorie, filtres, actions directes (répondre à un flash, rejoindre une zone, ouvrir un espace), bouton Relancer.

## 8. Espace — inchangé sur le fond, aligné sur la forme

Le flux de création en 2 étapes et la page `/espace/{uuid}` sont conservés, migrés vers le module, branchés sur l'identité (plus de `ownerGoogleId` bricolé) et sur la base Cloud, avec les opportunités publiables vers une Zone.

## 9. Qualité, perf, sécurité

- Lazy-loading par module (routes en `React.lazy`) → chargement initial léger.
- Listes virtualisées au-delà de 50 items ; requêtes Cloud paginées et indexées.
- Tests unitaires sur le moteur Scan et le scoring de zones.
- Toutes les tables : RLS + GRANTs ; aucune donnée personnelle exposée en lecture publique.
- Zéro code temporaire : les mocks actuels sont remplacés par des données réelles semées en base.

## Ordre de livraison
1. Core (identity, permissions, db, structure modules) + suppression du legacy
2. Home
3. Flash
4. Zone
5. Scan
6. Espace + finitions perf/tests
