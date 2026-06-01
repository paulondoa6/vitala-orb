## Plan — Mock data + boite card profile + nettoyage bottom-bar

### 1. Données mock pour `/boite/{uuid}`
- Nouveau fichier `src/lib/boiteMocks.ts` exportant `MOCK_BOITES: Boite[]` avec 3 espaces représentatifs (uuid 6 chars conformes au regex Crockford, ex. `VTAL01`, `CAFE42`, `STUD88`), couvrant différents `types`, services, membres (admin + modérateur), location avec label.
- Ajouter dans `src/lib/boiteStore.ts` :
  - export `MOCK_BOITE_UUIDS` (liste des uuids mock).
  - modifier `getBoite(uuid)` pour, si Dexie ne renvoie rien, retomber sur les mocks (`MOCK_BOITES.find(...)`).
  - exposer helper `seedMockBoites()` (optionnel) — non appelé automatiquement, juste utile.
- Résultat : ouvrir `/boite/VTAL01`, `/boite/CAFE42`, `/boite/STUD88` fonctionne sans rien créer.
- Bonus mock pour profil / activités : ajouter quelques entrées factices uniquement consommées par la nouvelle card du profil (voir §2). Pas de nouveau store, juste un tableau exporté depuis `boiteMocks.ts`.

### 2. Card « Mes Espaces » dans le profil
- Dans `src/pages/Profile.tsx`, ajouter une nouvelle section après la section Stats (avant « Confiance & crédibilité ») : carte glass listant les espaces de l’utilisateur.
- Source : `useEffect` qui fait `db.boites.where('ownerGoogleId').equals(getCurrentOwnerId()).toArray()` ; si vide, fallback sur `MOCK_BOITES` pour la démo.
- Contenu de la card :
  - Header avec icône `LayoutGrid`, titre « Mes Espaces », compteur, lien « Voir tout » (placeholder vers `/create`).
  - Liste (max 3) : logo/initiale, nom, types (badge), uuid mono, `ChevronRight` → `Link to={/boite/${uuid}}`.
  - État vide : CTA « Créer un Espace » → `/create`.
- Aucun changement de logique métier ailleurs.

### 3. Bottom-bar : retirer l’icône Paramètres
- Dans `src/components/layout/BottomNav.tsx`, supprimer l’entrée `{ to: "/settings", icon: Settings, label: "Paramètres" }` de `itemsRight` et l’import `Settings` de lucide.
- `itemsRight` ne contient plus que `{ to: "/create", icon: LayoutGrid, label: "Espace" }`. La barre reste équilibrée (2 gauche / scan / 1 droite).
- La route `/settings` reste accessible (non supprimée), juste plus de bouton dans la nav.

### Détails techniques
- Format UUID mock : 6 chars dans `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` pour passer `isValidBoiteUuid`.
- `getBoite` reste `async` ; ajout simple :
  ```ts
  export const getBoite = async (uuid: string) =>
    (await db.boites.get(uuid)) ?? MOCK_BOITES.find((b) => b.uuid === uuid);
  ```
- Aucun ajout de dépendance.
