import type { Boite } from "./boiteStore";

export const MOCK_BOITES: Boite[] = [
  {
    uuid: "VTAL01",
    ownerGoogleId: "mock_owner",
    types: ["entreprise", "service"],
    name: "Vitalio HQ",
    location: { label: "Paris, FR" },
    services: [
      { id: "s1", name: "Coaching nutrition", description: "Sessions 1:1 personnalisées" },
      { id: "s2", name: "Bilan énergétique", description: "Évaluation complète en 45 min" },
    ],
    members: [
      { id: "m1", email: "amina@vitalio.app", role: "admin", invitedAt: Date.now() - 86400000 * 30 },
      { id: "m2", email: "yannick@vitalio.app", role: "moderator", invitedAt: Date.now() - 86400000 * 14 },
    ],
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    uuid: "CAFE42",
    ownerGoogleId: "mock_owner",
    types: ["boutique"],
    name: "Café Lumière",
    location: { label: "Lyon, FR" },
    services: [
      { id: "s1", name: "Brunch dominical", description: "Menu saisonnier" },
      { id: "s2", name: "Café spécialité", description: "Torréfaction maison" },
      { id: "s3", name: "Atelier latte art" },
    ],
    members: [
      { id: "m1", email: "lea@cafelumiere.fr", role: "admin", invitedAt: Date.now() - 86400000 * 60 },
    ],
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    uuid: "STUD88",
    ownerGoogleId: "mock_owner",
    types: ["equipe", "organisation"],
    name: "Studio Nord",
    location: { label: "Lille, FR" },
    services: [
      { id: "s1", name: "Shooting photo", description: "Studio 80m² équipé" },
    ],
    members: [
      { id: "m1", email: "team@studionord.io", role: "admin", invitedAt: Date.now() - 86400000 * 10 },
      { id: "m2", email: "paul@studionord.io", role: "moderator", invitedAt: Date.now() - 86400000 * 7 },
      { id: "m3", email: "marie@studionord.io", role: "moderator", invitedAt: Date.now() - 86400000 * 3 },
    ],
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 3600000 * 6,
  },
];

export const MOCK_BOITE_UUIDS = MOCK_BOITES.map((b) => b.uuid);

export const findMockBoite = (uuid: string) => MOCK_BOITES.find((b) => b.uuid === uuid);
