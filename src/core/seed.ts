import { db, type Flash, type Zone } from "./db";
import { createId } from "./ids";

/** Reference zones shipped with the app so exploration is never empty. */
const ZONES: Zone[] = [
  {
    id: "zn-bastille",
    name: "Bastille",
    city: "Paris",
    description: "Quartier vivant, terrasses et petits commerces ouverts tard.",
    center: { lat: 48.8532, lng: 2.3692 },
    radiusM: 900,
    tags: ["restauration", "nuit", "commerce"],
    opportunities: [
      { id: "op-1", title: "-30% après 21 h", detail: "Trois cantines de quartier écoulent leurs invendus." },
      { id: "op-2", title: "Coup de main recherché", detail: "Deux boutiques cherchent un renfort le samedi." },
    ],
  },
  {
    id: "zn-canal",
    name: "Canal Saint-Martin",
    city: "Paris",
    description: "Zone créative : studios, ateliers et beaucoup d'entraide.",
    center: { lat: 48.8709, lng: 2.3653 },
    radiusM: 1100,
    tags: ["créatif", "atelier", "entraide"],
    opportunities: [
      { id: "op-3", title: "Atelier partagé", detail: "Places libres dans un studio photo mutualisé." },
    ],
  },
  {
    id: "zn-lyon-part-dieu",
    name: "Part-Dieu",
    city: "Lyon",
    description: "Pôle d'affaires : services rapides et forte demande en journée.",
    center: { lat: 45.7605, lng: 4.8572 },
    radiusM: 1200,
    tags: ["bureau", "service", "express"],
    opportunities: [
      { id: "op-4", title: "Livraison en 20 min", detail: "Réseau de coursiers actif entre 11 h et 14 h." },
    ],
  },
  {
    id: "zn-marseille-vieux-port",
    name: "Vieux-Port",
    city: "Marseille",
    description: "Zone touristique et maritime, activité continue.",
    center: { lat: 43.2951, lng: 5.3743 },
    radiusM: 1000,
    tags: ["tourisme", "mer", "restauration"],
    opportunities: [
      { id: "op-5", title: "Saison qui démarre", detail: "Six espaces recrutent pour l'été." },
    ],
  },
];

const communityFlashes = (): Flash[] => {
  const now = Date.now();
  const make = (
    minutesAgo: number,
    minutesLeft: number,
    authorName: string,
    text: string,
    category: Flash["category"],
    zoneId: string,
    urgency: Flash["urgency"] = "normal",
    replies = 0,
  ): Flash => ({
    id: createId(),
    authorId: `community-${zoneId}`,
    authorName,
    text,
    category,
    urgency,
    zoneId,
    position: ZONES.find((z) => z.id === zoneId)?.center,
    createdAt: now - minutesAgo * 60_000,
    expiresAt: now + minutesLeft * 60_000,
    replies,
  });

  return [
    make(4, 55, "Inès", "Je cherche un vélo à emprunter pour 2 h, secteur Bastille.", "transport", "zn-bastille", "normal", 3),
    make(11, 20, "Karim", "Besoin urgent d'un chargeur USB-C, je suis à la gare.", "objet", "zn-lyon-part-dieu", "urgent", 1),
    make(25, 180, "Léa", "Studio photo dispo cet après-midi, je partage le créneau.", "service", "zn-canal", "normal", 5),
    make(8, 40, "Théo", "Quelqu'un pour m'aider à porter un meuble au 3e ?", "aide", "zn-bastille", "normal", 2),
    make(33, 240, "Sofia", "Je propose 3 h de renfort en salle ce soir.", "emploi", "zn-marseille-vieux-port", "normal", 4),
    make(2, 15, "Malik", "Pharmacie ouverte maintenant dans le coin ?", "aide", "zn-canal", "urgent", 0),
    make(17, 120, "Camille", "Je cherche un traiteur végétarien pour 12 personnes.", "service", "zn-lyon-part-dieu", "normal", 6),
    make(45, 90, "Yanis", "Prête une perceuse contre un café.", "objet", "zn-marseille-vieux-port", "normal", 1),
  ];
};

let seeding: Promise<void> | null = null;

/** Idempotent: fills the local database once, then never touches it again. */
export const ensureSeeded = (): Promise<void> => {
  if (!seeding) {
    seeding = (async () => {
      const zoneCount = await db.zones.count();
      if (zoneCount === 0) await db.zones.bulkPut(ZONES);
      const flashCount = await db.flashes.count();
      if (flashCount === 0) await db.flashes.bulkPut(communityFlashes());
    })();
  }
  return seeding;
};
