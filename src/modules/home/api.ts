import { countLiveFlashes, listLiveFlashes } from "@/modules/flash/api";
import { listZonePulses } from "@/modules/zone/api";
import { countBoites } from "@/modules/espace/api";
import { getLastScan } from "@/modules/scan/lastScan";
import { timeAgo } from "@/core/geo";

/**
 * DTO de l'écran Home — contrat `home` :
 * une métrique vivante par module + un seul bandeau « reprendre ».
 * Aucune donnée de feed, de score ou de profil ne transite ici.
 */

export interface HomeTileDTO {
  key: "flash" | "zone" | "scan" | "espace";
  to: string;
  metric: string;
}

export type HomeResumeDTO =
  | { kind: "flash"; to: string; title: string; detail: string }
  | { kind: "scan"; to: string; title: string; detail: string }
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
      title: "Ton flash est encore en ligne",
      detail: myFlash.text.length > 60 ? `${myFlash.text.slice(0, 60)}…` : myFlash.text,
    };
  } else if (lastScan) {
    resume = {
      kind: "scan",
      to: "/scan",
      title: "Reprendre ton scan",
      detail: `${lastScan.results} résultat${lastScan.results > 1 ? "s" : ""} · ${timeAgo(lastScan.at)}`,
    };
  }

  return {
    tiles: [
      { key: "flash", to: "/flash", metric: `${live} en direct` },
      { key: "zone", to: "/zone", metric: `${zones.length} quartiers` },
      { key: "scan", to: "/scan", metric: "en 10 s" },
      { key: "espace", to: "/espace", metric: `${espaces} créés` },
    ],
    resume,
  };
};
