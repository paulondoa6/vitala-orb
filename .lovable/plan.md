# Vitala 2026 — Plan d'organisation par écran + refonte modulaire

## Problème central
Aujourd'hui les pages partagent les mêmes cartes et affichent des informations qui n'appartiennent pas à leur rôle. Chaque écran doit avoir un **contrat d'affichage** : ce qu'il montre, ce qui est cliquable, ce que chaque clic retourne. Tout le reste sort de l'écran.

Règle appliquée partout : **1 carte = 1 rôle = 1 source de données = 1 action principale.**

---

## Partie A — Contrat d'affichage de chaque écran

Notation : `[C]` cliquable → résultat · `[i]` informatif seulement (jamais cliquable).

### HOME — « où aller maintenant »
- Salutation + phrase d'orientation `[i]`
- 4 tuiles module (Flash, Zone, Scan, Espace) : titre, une ligne d'usage, **une** métrique vivante `[C]` → route du module
- Bandeau « reprendre » : dernier flash actif OU dernier scan `[C]` → détail
- **Retiré de Home** : feed complet, cartes de score, stats profil, opportunités.

### FLASH — « je demande / je réponds »
- Composer une ligne + catégorie + durée `[C]` → publie, retourne l'écran « ton flash est en ligne »
- Section « Le tien » : texte, compte à rebours, nb de réponses `[C: Clôturer]`
- Section « Autour de toi » : texte, distance, âge, badge live `[C]` → détail flash
- Détail flash (sous-page) : texte complet, auteur (prénom + initiale), distance, expiration, réponses `[C: Répondre]`
- **Retiré** : VitalScore, niveaux, tuiles de navigation, zones.

### ZONE — « ce qui bouge ici »
- Liste zones triées par pouls : nom, ville, pouls, nb flashs actifs `[C]` → détail zone
- Détail zone : pouls `[i]`, flashs de la zone `[C]`, opportunités `[C]`, membres (compte) `[i]`, `[C: Rejoindre]`
- **Retiré** : résultats de scan, cartes profil, services d'Espace.

### SCAN — « je configure et je lance »
- Écran de configuration : mode, rayon, catégories, zone `[C: Lancer]`
- Exécution : radar + phases annoncées `[i]`
- Résultats groupés par catégorie : chaque item n'affiche que ce qui sert à décider (titre, distance, fraîcheur) `[C]` → route native de l'item (flash / zone / espace)
- **Retiré** : composer Flash, cartes identité, métriques Home.

### RADAR — « veille passive continue »
Écran distinct du Scan : le Scan est ponctuel, le Radar tourne en fond.
- État du radar (actif/en pause) `[C: activer/pause]`
- Critères surveillés (chips) `[C]` → édition
- Flux d'alertes horodatées `[C]` → source de l'alerte
- **Retiré** : configuration complète du scan, résultats classés.

### ESPACE — « mon lieu / mon organisation »
- Liste de mes espaces `[C]` → détail
- Création en 2 étapes (inchangée sur le fond)
- Détail espace : identité de l'espace, services, membres, code public + QR `[C: partager]`, `[C: publier une opportunité]`
- **Retiré** : flashs voisins, scan, stats personnelles.

### ASSISTANT — « on m'explique / on m'emmène »
- Plein écran dédié (plus un widget flottant sur toutes les pages)
- Conversation + suggestions contextuelles à la page d'origine `[C]` → navigation
- **Retiré** : cartes de données métier dans le fil.

### PROFIL — « moi et mes réglages »
- Identité (prénom, avatar, ville) `[C: éditer]`
- Mes flashs / mes zones / mes espaces : **compteurs** `[C]` → la page du module (pas de duplication des listes)
- Langue, notifications, permissions, données locales `[C]`
- **Retiré** : XP, badges de confiance, avis, parrainage tant qu'aucun backend ne les alimente.

---

## Partie B — Phases d'exécution (une phase = un problème résolu = un message)

**Fondations**
1. Cartographie des composants et des données affichées ; liste des fuites d'information à supprimer.
2. Contrat d'écran typé : `ScreenContract` (données autorisées, actions, routes de sortie) par module.
3. Découpage strict `ui/` (présentation pure) vs `logic/` (hooks + services) dans chaque module ; aucun appel de données dans un composant.
4. `core/` figé comme seul point de partage : types, db, events, identity, permissions, i18n, analytics. Interdiction module → module.
5. Nettoyage : suppression des composants legacy non conformes (VitalScore, cartes mixtes, mocks résiduels).

**Données & backend**
6. Schéma backend : `profiles`, `flashes`, `zones`, `zone_members`, `espaces`, `espace_services`, `espace_members`, `radar_watches`, `radar_alerts` — RLS + GRANTs sur chaque table.
7. Politiques de lecture minimales : chaque table n'expose que les champs affichés par son écran (vues publiques dédiées).
8. Couche d'accès unique par module (`api.ts`) retournant des **DTO d'écran**, pas les lignes brutes.
9. Sync offline-first : Dexie = source de lecture, file d'attente d'écritures, réconciliation au retour du réseau.
10. Résolution de conflits + états `pending / synced / failed` visibles sur les seuls éléments concernés.

**Écrans**
11. Home recodée selon son contrat.
12. Flash : composer + feed + écran de confirmation.
13. Flash : sous-page détail + réponses.
14. Zone : liste par pouls.
15. Zone : détail + adhésion.
16. Scan : configuration et préréglages.
17. Scan : exécution (phases, radar) et moteur pur testé.
18. Scan : résultats groupés + actions sortantes.
19. Radar : veille, critères, alertes.
20. Espace : liste + création 2 étapes.
21. Espace : détail, services, membres, partage.
22. Assistant : page dédiée + contexte d'origine.
23. Profil : identité, compteurs, réglages.

**Plateforme**
24. i18n `fr / en / es` : détection navigateur et appareil, sélecteur manuel persistant, aucune chaîne en dur, formats de date/nombre localisés.
25. PWA installable : manifest, icônes, `id`/`scope`/`start_url`, prompt d'installation contextuel, écrans iOS.
26. Offline : app shell mis en cache, écrans de repli explicites, indicateur de connexion discret.
27. Navigation native : transitions par pile, geste retour, respect des safe-areas, cible tactile ≥ 44 px, pas de rebond de scroll parasite, barre d'état thématisée iOS.
28. Permissions contextuelles : demandées au moment de l'usage, écran de repli si refusées.

**Qualité**
29. Performance : lazy-loading par route, virtualisation au-delà de 50 items, budget de bundle, images dimensionnées, animations GPU + `prefers-reduced-motion`.
30. Accessibilité : rôles, focus visible, ordre clavier, contrastes AA, annonces `aria-live` sur les flux.
31. Tests : moteur Scan, scoring Zone, file de sync, contrats d'écran (aucune donnée hors contrat rendue).
32. Sécurité : revue RLS, aucune donnée personnelle en lecture publique, secrets côté serveur uniquement.
33. Observabilité : erreurs, échecs de sync, événements produits — sans donnée personnelle.
34. Cohérence finale : tokens de design uniques, métadonnées SEO/social, nom d'application unifié (**Vitala**), passage complet du parcours sur mobile.

---

## Détails techniques
- Arborescence cible : `src/core/*`, `src/modules/{flash,zone,scan,radar,espace,assistant,profil}/{ui,logic,api.ts,routes.tsx}`, `src/app/*`.
- Chaque module exporte uniquement ses routes et ses types publics ; communication inter-module par le bus d'événements de `core`.
- i18n : `react-i18next`, namespaces par module, `fr` langue de repli.
- Offline : Dexie + file d'écriture, backend Lovable Cloud pour la source distante.
