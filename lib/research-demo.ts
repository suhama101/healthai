import type { StaticImageData } from "next/image";
import type { ResearchClass } from "@/lib/inference";
import evidence from "@/research/step-3-results.json";

export const demoMethods = {
  "class-name": {
    name: "Standard CLIP",
    description: "Compares a crop with short prompts that name each class. The method uses the pretrained model without fitting it to labeled malaria crops.",
    scoreLabel: "Image–text cosine similarity",
  },
  "knowledge-guided": {
    name: "Knowledge-guided CLIP",
    description: "Compares a crop with prompts that describe visible cell features. The encoder stays frozen and the method uses no labeled crops for fitting.",
    scoreLabel: "Image–text cosine similarity",
  },
  "clip-ridge": {
    name: "Supervised CLIP + Ridge",
    description: "Uses frozen CLIP image features as input to a ridge classifier fitted on labeled development crops. Validation results determined the selected method.",
    scoreLabel: "Raw ridge score",
  },
};

type DemoMethod = keyof typeof demoMethods;

export type PublishedMethod = (typeof demoMethods)[DemoMethod] & {
  id: DemoMethod;
  count: number;
  accuracy: number;
  recall: Record<ResearchClass, number>;
};

export type DemoSample = {
  id: string;
  title: string;
  image: StaticImageData;
  actualClass: ResearchClass;
  partition: "development";
  source: { credit: string; url: string; redistributionTermsUrl: string };
  results: readonly {
    method: DemoMethod;
    predictedClass: ResearchClass;
    model: { name: string; version: string };
    scores: Record<ResearchClass, number>;
  }[];
};

export const publishedMethods = (Object.keys(demoMethods) as DemoMethod[]).map((id): PublishedMethod => {
  const result = evidence.final_test.clip[id];
  return {
    id,
    ...demoMethods[id],
    count: result.n,
    accuracy: result.accuracy,
    recall: {
      parasitized: result.per_class.parasitized.recall,
      uninfected: result.per_class.uninfected.recall,
    },
  };
});

// Public allowlist. See docs/public-research-demo.md before adding an image or result.
export const demoSamples: readonly DemoSample[] = [];
