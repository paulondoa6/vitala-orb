import { countLiveFlashes, listLiveFlashes } from "@/modules/flash/api";
import { listZonePulses } from "@/modules/zone/api";
import { countBoites } from "@/modules/espace/api";
import { getLastScan } from "@/modules/scan/lastScan";

/**
 * DTO de l'écran Home — contrat `home` :
 * une métrique vivante par module + un seul bandeau « reprendre ».
 * Aucune donnée de feed, de score ou de profil ne transite ici.
 */

export interface HomeTileDTO {
  key: "flash" | "zone" | "scan" | "espace";
  to: string;
  count: number;
}

export type HomeResumeDTO =
  | { kind: "flash"; to: string; detail: string }
  | { kind: "scan"; to: string; results: number; at: number }
  | null;

export interface HomeScreenDTO {
  tiles: HomeTileDTO[];
  resume: HomeResumeDTO;
}

export const getHomeScreen = async (viewerId: string): Promise<HomeScreenDTO> => {
  const [live, zones, espaces, mine] = await Promise.all([
    countLiveFlashes(),
    listZonePulses(),
    countBoites(),
    listLiveFlashes(),
  ]);

  const myFlash = mine
    .filter((f) => f.authorId === viewerId)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  const lastScan = getLastScan();

  let resume: HomeResumeDTO = null;
  if (myFlash) {
    resume = {
      kind: "flash",
      to: `/flash/${myFlash.id}`,
      detail: myFlash.text.length > 60 ? `${myFlash.text.slice(0, 60)}…` : myFlash.text,
    };
  } else if (lastScan) {
    resume = {
      kind: "scan",
      to: "/scan",
      results: lastScan.results,
      at: lastScan.at,
    };
  }

  return {
    tiles: [
      { key: "flash", to: "/flash", count: live },
      { key: "zone", to: "/zone", count: zones.length },
      { key: "scan", to: "/scan", count: 0 },
      { key: "espace", to: "/espace", count: espaces },
    ],
    resume,
  };
};
