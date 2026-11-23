export type ResearchClass = "parasitized" | "uninfected";
export type ResearchMethod =
  | "class-name" | "knowledge-guided" | "clip-ensemble" | "clip-ridge"
  | "biomed-class-name" | "biomed-ensemble" | "biomed-ridge";

export const methodLabels: Record<ResearchMethod, string> = {
  "class-name": "Class-name CLIP baseline",
  "knowledge-guided": "Knowledge-guided CLIP prompt experiment",
  "clip-ensemble": "CLIP morphology prompt ensemble · zero-shot",
  "clip-ridge": "CLIP Image Encoder + Supervised Ridge Classifier",
  "biomed-class-name": "BiomedCLIP class-name prompts · zero-shot",
  "biomed-ensemble": "BiomedCLIP morphology prompt ensemble · zero-shot",
  "biomed-ridge": "BiomedCLIP frozen encoder · supervised ridge",
};

export type ClassScores =
  | { kind: "calibrated_probability"; calibrationMethod: string; values: Record<ResearchClass, number> }
  | { kind: "model_score"; label: string; values: Record<ResearchClass, number> };

export interface PredictionResponse {
  predictedClass: ResearchClass;
  method: ResearchMethod;
  model: { name: string; version: string };
  limitations: readonly string[];
  scores?: ClassScores;
  baseline?: { name: string; version: string; predictedClass: ResearchClass };
}

export type InferenceService =
  | { status: "disconnected"; message: string }
  | {
      status: "configured";
      origin: string;
      isReady(signal: AbortSignal): Promise<boolean>;
      analyze(image: File, signal: AbortSignal): Promise<PredictionResponse>;
    };

export class InferenceError extends Error {
  constructor(message: string, readonly unavailable = false) {
    super(message);
    this.name = "InferenceError";
  }
}

const PROTOCOL = "medilens-clip-v1";
const RELEASE_MODEL = "openai/clip-vit-base-patch32";
const RELEASE_REVISION = "3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268";
const RELEASE_METHOD = "clip-ridge";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isResearchClass(value: unknown): value is ResearchClass {
  return value === "parasitized" || value === "uninfected";
}

function isModel(value: unknown): value is { name: string; version: string } {
  return isRecord(value) && isText(value.name) && isText(value.version);
}

function isScores(value: unknown): value is ClassScores {
  if (!isRecord(value) || !isRecord(value.values)) return false;
  const { parasitized, uninfected } = value.values;
  if (typeof parasitized !== "number" || typeof uninfected !== "number"
      || !Number.isFinite(parasitized) || !Number.isFinite(uninfected)) return false;
  if (value.kind === "model_score") return isText(value.label);
  return value.kind === "calibrated_probability" && isText(value.calibrationMethod)
    && parasitized >= 0 && parasitized <= 1 && uninfected >= 0 && uninfected <= 1
    && Math.abs(parasitized + uninfected - 1) <= 0.001;
}

function isPrediction(value: unknown): value is PredictionResponse {
  if (!isRecord(value)) return false;
  const { predictedClass, method, model, limitations, scores, baseline } = value;
  return isResearchClass(predictedClass)
    && typeof method === "string" && Object.hasOwn(methodLabels, method)
    && isModel(model)
    && Array.isArray(limitations) && limitations.length > 0 && limitations.every(isText)
    && (scores === undefined || isScores(scores))
    && (baseline === undefined || (isRecord(baseline) && isResearchClass(baseline.predictedClass) && isModel(baseline)));
}

export function createInferenceService(baseUrl: string | undefined): InferenceService {
  if (!baseUrl?.trim()) return { status: "disconnected", message: "Online inference is unavailable. Image preview is available." };

  let origin: string;
  try {
    const url = new URL(baseUrl);
    const loopback = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if ((!loopback && url.protocol !== "https:")
        || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error("Use a loopback HTTP or approved HTTPS origin.");
    }
    origin = url.origin;
  } catch {
    return { status: "disconnected", message: "Configure a local HTTP or approved HTTPS inference URL" };
  }

  return {
    status: "configured",
    origin,
    async isReady(signal) {
      try {
        const response = await fetch(`${origin}/health`, {
          cache: "no-store", credentials: "omit", redirect: "error",
          signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
        });
        if (!response.ok) return false;
        const data: unknown = await response.json();
        return isRecord(data) && data.status === "ready" && data.protocol === PROTOCOL
          && data.model === RELEASE_MODEL && data.version === RELEASE_REVISION && data.method === RELEASE_METHOD;
      } catch {
        return false;
      }
    },
    async analyze(image, signal) {
      let response: Response;
      const timeout = AbortSignal.timeout(30_000);
      try {
        response = await fetch(`${origin}/predict`, {
          method: "POST", headers: { "Content-Type": image.type }, body: image,
          cache: "no-store", credentials: "omit", redirect: "error",
          signal: AbortSignal.any([signal, timeout]),
        });
      } catch {
        if (timeout.aborted) throw new InferenceError("The model request timed out. Try again.");
        throw new InferenceError("Cannot reach the configured inference service.", true);
      }
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = isRecord(data) && isText(data.detail) ? data.detail : null;
        throw new InferenceError(detail ?? "The model could not analyze this image. Try again.");
      }
      if (!isPrediction(data) || data.scores?.kind !== "model_score" || data.method !== RELEASE_METHOD
          || data.model.name !== RELEASE_MODEL || data.model.version !== RELEASE_REVISION) {
        throw new InferenceError("The service returned an invalid model response.");
      }
      return data;
    },
  };
}

export const inferenceService = createInferenceService(process.env.NEXT_PUBLIC_MEDILENS_API_URL);
