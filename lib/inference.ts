export type ResearchClass = "parasitized" | "uninfected";

export type ClassScores =
  | { kind: "calibrated_probability"; calibrationMethod: string; values: Record<ResearchClass, number> }
  | { kind: "model_score"; label: string; values: Record<ResearchClass, number> };

export interface PredictionResponse {
  predictedClass: ResearchClass;
  model: { name: string; version: string };
  limitations: readonly string[];
  scores?: ClassScores;
  baseline?: { name: string; version: string; predictedClass: ResearchClass };
}

export type InferenceService =
  | { status: "disconnected"; message: string }
  | {
      status: "connected";
      analyze(image: File, signal: AbortSignal): Promise<PredictionResponse>;
    };

// Replace this adapter only after the real inference endpoint is verified.
export const inferenceService: InferenceService = {
  status: "disconnected",
  message: "AI inference not connected yet",
};
