import type { ResearchClass } from "@/lib/inference";

type Source = { label: string; url: string };
export type DescriptionEntry = { title: string; description: string; sources: readonly Source[] };

const who: Source = {
  label: "WHO malaria fact sheet",
  url: "https://www.who.int/news-room/fact-sheets/detail/malaria",
};
const cdc: Source = {
  label: "CDC malaria evaluation and diagnosis",
  url: "https://www.cdc.gov/malaria/hcp/clinical-guidance/evaluation-diagnosis.html",
};

export const malariaDescriptionBank = {
  version: "malaria-cell-v1",
  entries: {
    parasitized: {
      title: "Parasitized red blood cell",
      description: "The model assigned the parasitized class to this red blood cell crop. Malaria is caused by Plasmodium parasites. This research finding concerns one cell and cannot establish a diagnosis.",
      sources: [who, cdc],
    },
    uninfected: {
      title: "Uninfected red blood cell",
      description: "The model assigned the uninfected class to this red blood cell crop. An uninfected finding for one cell cannot rule out malaria in a person.",
      sources: [cdc],
    },
    unableToAssess: {
      title: "Unable to assess",
      description: "The image did not produce a cell finding. For this research demo, use a supported image of one clearly visible red blood cell. This outcome leaves malaria status undetermined.",
      sources: [cdc],
    },
  } satisfies Record<ResearchClass | "unableToAssess", DescriptionEntry>,
} as const;
