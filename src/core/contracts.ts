/**
 * Contrats d'écran — Phase 2 du plan.
 *
 * Chaque écran déclare ici, de manière typée et vérifiable :
 *  - les champs de données qu'il a le droit d'afficher (`shows`)
 *  - les éléments cliquables et ce qu'ils retournent (`actions`)
 *  - les routes de sortie autorisées (`exits`)
 *  - ce qui est explicitement interdit à l'écran (`forbidden`)
 *
 * Ce fichier est purement déclaratif : aucune UI, aucune donnée.
 * Il sert de référence unique pour les revues et les tests de conformité
 * (« aucune donnée hors contrat rendue »).
 */

export type ScreenId =
  | "home"
  | "flash"
  | "flash.detail"
  | "zone"
  | "zone.detail"
  | "scan"
  | "radar"
  | "espace"
  | "espace.detail"
  | "assistant"
  | "profil";

export type ModuleId = "core" | "flash" | "zone" | "scan" | "radar" | "espace" | "assistant" | "profil";

export interface ScreenAction {
  /** Libellé de l'élément cliquable, tel que perçu par l'utilisateur. */
  label: string;
  /** Ce que le clic retourne : navigation, mutation locale, ou retour visuel. */
  returns: string;
  /** Route de sortie éventuelle. */
  to?: string;
}

export interface ScreenContract {
  id: ScreenId;
  module: ModuleId;
  /** Intention de l'écran, en une phrase humaine. */
  purpose: string;
  /** Données autorisées à l'affichage (informatif ou support d'action). */
  shows: readonly string[];
  /** Éléments cliquables. */
  actions: readonly ScreenAction[];
  /** Routes de sortie autorisées depuis l'écran. */
  exits: readonly string[];
  /** Informations qui ne doivent jamais apparaître ici. */
  forbidden: readonly string[];
}

export const SCREEN_CONTRACTS: Record<ScreenId, ScreenContract> = {
  home: {
    id: "home",
    module: "core",
    purpose: "Où aller maintenant.",
    shows: ["salutation", "phrase d'orientation", "4 tuiles module avec une métrique vivante", "bandeau reprendre"],
    actions: [
      { label: "Tuile module", returns: "ouvre le module", to: "/flash | /zone | /scan | /espace" },
      { label: "Reprendre", returns: "ouvre le dernier flash actif ou le dernier scan" },
    ],
    exits: ["/flash", "/zone", "/scan", "/espace"],
    forbidden: ["feed complet", "cartes de score", "stats de profil", "opportunités"],
  },
  flash: {
    id: "flash",
    module: "flash",
    purpose: "Je demande, je réponds.",
    shows: ["composer (texte, catégorie, durée)", "mes flashs actifs", "flashs autour de moi (texte, distance, âge, badge live)"],
    actions: [
      { label: "Publier", returns: "confirmation « ton flash est en ligne »" },
      { label: "Clôturer", returns: "flash retiré du direct" },
      { label: "Flash voisin", returns: "détail du flash", to: "/flash/:id" },
    ],
    exits: ["/flash/:id"],
    forbidden: ["VitalScore", "niveaux", "tuiles de navigation", "zones"],
  },
  "flash.detail": {
    id: "flash.detail",
    module: "flash",
    purpose: "Comprendre une demande et y répondre.",
    shows: ["texte complet", "auteur (prénom + initiale)", "distance", "expiration", "réponses"],
    actions: [{ label: "Répondre", returns: "réponse ajoutée au fil" }],
    exits: ["/flash"],
    forbidden: ["composer", "métriques globales"],
  },
  zone: {
    id: "zone",
    module: "zone",
    purpose: "Ce qui bouge ici.",
    shows: ["nom", "ville", "pouls", "nombre de flashs actifs"],
    actions: [{ label: "Zone", returns: "détail de la zone", to: "/zone/:id" }],
    exits: ["/zone/:id"],
    forbidden: ["résultats de scan", "cartes profil", "services d'espace"],
  },
  "zone.detail": {
    id: "zone.detail",
    module: "zone",
    purpose: "Vie d'un quartier.",
    shows: ["pouls", "flashs de la zone", "opportunités", "nombre de membres"],
    actions: [
      { label: "Rejoindre", returns: "adhésion enregistrée" },
      { label: "Flash de la zone", returns: "détail du flash", to: "/flash/:id" },
    ],
    exits: ["/flash/:id", "/zone"],
    forbidden: ["scan", "profil"],
  },
  scan: {
    id: "scan",
    module: "scan",
    purpose: "Je configure et je lance.",
    shows: ["mode", "rayon", "catégories", "zone", "phases d'exécution", "résultats groupés (titre, distance, fraîcheur)"],
    actions: [
      { label: "Lancer", returns: "exécution du scan" },
      { label: "Résultat", returns: "route native de l'item", to: "/flash/:id | /zone/:id | /espace/:uuid" },
    ],
    exits: ["/flash/:id", "/zone/:id", "/espace/:uuid"],
    forbidden: ["composer Flash", "cartes identité", "métriques Home"],
  },
  radar: {
    id: "radar",
    module: "radar",
    purpose: "Veille passive continue.",
    shows: ["état du radar", "critères surveillés", "flux d'alertes horodatées"],
    actions: [
      { label: "Activer / mettre en pause", returns: "nouvel état du radar" },
      { label: "Critère", returns: "édition du critère" },
      { label: "Alerte", returns: "source de l'alerte" },
    ],
    exits: ["/flash/:id", "/zone/:id", "/espace/:uuid"],
    forbidden: ["configuration complète du scan", "résultats classés"],
  },
  espace: {
    id: "espace",
    module: "espace",
    purpose: "Mon lieu, mon organisation.",
    shows: ["liste de mes espaces", "formulaire de création en 2 étapes"],
    actions: [
      { label: "Espace", returns: "détail de l'espace", to: "/espace/:uuid" },
      { label: "Créer", returns: "espace créé puis redirection vers son détail" },
    ],
    exits: ["/espace/:uuid"],
    forbidden: ["flashs voisins", "scan", "stats personnelles"],
  },
  "espace.detail": {
    id: "espace.detail",
    module: "espace",
    purpose: "Piloter un espace.",
    shows: ["identité de l'espace", "services", "membres", "code public + QR"],
    actions: [
      { label: "Partager", returns: "lien / QR partagé" },
      { label: "Publier une opportunité", returns: "opportunité visible dans la zone" },
    ],
    exits: ["/espace"],
    forbidden: ["flashs voisins", "scan", "stats personnelles"],
  },
  assistant: {
    id: "assistant",
    module: "assistant",
    purpose: "On m'explique, on m'emmène.",
    shows: ["conversation", "suggestions contextuelles à la page d'origine"],
    actions: [{ label: "Suggestion", returns: "navigation vers l'écran concerné" }],
    exits: ["/", "/flash", "/zone", "/scan", "/espace", "/profile"],
    forbidden: ["cartes de données métier dans le fil"],
  },
  profil: {
    id: "profil",
    module: "profil",
    purpose: "Moi et mes réglages.",
    shows: ["prénom", "avatar", "ville", "compteurs flashs / zones / espaces", "langue", "notifications", "permissions", "données locales"],
    actions: [
      { label: "Éditer", returns: "identité mise à jour" },
      { label: "Compteur", returns: "page du module concerné", to: "/flash | /zone | /espace" },
    ],
    exits: ["/flash", "/zone", "/espace"],
    forbidden: ["XP", "badges de confiance", "avis", "parrainage"],
  },
};

export function getContract(id: ScreenId): ScreenContract {
  return SCREEN_CONTRACTS[id];
}
