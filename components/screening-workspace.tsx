"use client";

import { CircleAlert, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnalysisControls } from "@/components/analysis-controls";
import { ImagePreview } from "@/components/image-preview";
import { ImageUploader } from "@/components/image-uploader";
import { ResultsDisplay } from "@/components/results-display";
import { inferenceService, InferenceError, type InferenceService, type PredictionResponse } from "@/lib/inference";
import { validateImage } from "@/lib/image-validation";

function Workspace({ service }: { service: InferenceService }) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [availability, setAvailability] = useState<"checking" | "ready" | "unavailable">("checking");
  const selection = useRef(0);
  const request = useRef<AbortController | null>(null);
  const previewUrl = useRef<string | null>(null);
  const uploadHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => {
    selection.current++;
    request.current?.abort();
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  useEffect(() => {
    if (service.status !== "configured") return;

    const controller = new AbortController();
    let timer: number | undefined;
    async function check() {
      if (service.status !== "configured") return;
      const ready = await service.isReady(controller.signal);
      if (controller.signal.aborted) return;
      setAvailability(ready ? "ready" : "unavailable");
      timer = window.setTimeout(check, 5000);
    }
    void check();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [service]);

  function updatePreview(file: File | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = file ? URL.createObjectURL(file) : null;
    setPreview(file && previewUrl.current ? { file, url: previewUrl.current } : null);
  }

  function cancelAnalysis() {
    request.current?.abort();
    request.current = null;
    setAnalyzing(false);
  }

  async function selectImage(files: FileList) {
    const selectionId = ++selection.current;
    if (files.length !== 1) {
      setError("Select one JPEG or PNG image.");
      setValidating(false);
      return;
    }

    const file = files[0];
    setError("");
    setValidating(true);
    const validationError = await validateImage(file);
    if (selectionId !== selection.current) return;
    setValidating(false);

    if (validationError) {
      setError(validationError);
      return;
    }

    cancelAnalysis();
    setResult(null);
    updatePreview(file);
  }

  function clear() {
    selection.current++;
    cancelAnalysis();
    updatePreview(null);
    setResult(null);
    setError("");
    setValidating(false);
    uploadHeading.current?.focus();
  }

  async function analyze() {
    if (service.status !== "configured" || availability !== "ready" || !preview || validating || request.current) return;

    const controller = new AbortController();
    request.current = controller;
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const response = await service.analyze(preview.file, controller.signal);
      if (!controller.signal.aborted) setResult(response);
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof InferenceError && failure.unavailable) setAvailability("unavailable");
        setError(failure instanceof InferenceError ? failure.message : "Analysis failed. Try again.");
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setAnalyzing(false);
      }
    }
  }

  const readiness = service.status === "disconnected" ? "preview" : availability;
  const status = {
    preview: "Preview only",
    checking: "Checking model readiness…",
    unavailable: "Inference service unavailable",
    ready: "Model ready",
  }[readiness];

  return (
    <div className="workspace-grid">
      <section className="panel" aria-labelledby="upload-heading">
        <div className="panel-heading">
          <div><h2 id="upload-heading" tabIndex={-1} ref={uploadHeading}>Upload a cell image</h2><p>Use de-identified research or test images only.</p></div>
        </div>
        {preview && <ImagePreview {...preview} onRemove={clear} />}
        <ImageUploader hasImage={Boolean(preview)} onSelect={selectImage} />
        {validating && <p className="upload-feedback" role="status">Checking the image…</p>}
        {error && <p className="upload-error" role="alert"><CircleAlert size={17} aria-hidden="true" />{error}</p>}
        <AnalysisControls canAnalyze={service.status === "configured" && availability === "ready" && Boolean(preview) && !validating}
          busy={analyzing} state={readiness} onAnalyze={analyze} message={status}
          onClear={clear} canClear={Boolean(preview || error || validating)} />
        {service.status === "disconnected" && <p className="workspace-status-help">Online inference is unavailable. You can preview images in this browser.</p>}
        {readiness === "unavailable" && <p className="workspace-status-help">Online inference is currently unavailable. The workspace will check the configured service again automatically.</p>}
        {(readiness === "preview" || readiness === "unavailable") && (
          <p className="workspace-status-help"><a className="text-link" href="#research-demo">Explore precomputed research results</a></p>
        )}
        <p className="workspace-privacy">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>{service.status === "configured"
            ? `When you select Analyze, the image is sent to the configured service at ${service.origin}. The service processes it in memory.`
            : "Image previews stay in this browser tab."}</span>
        </p>
      </section>
      <ResultsDisplay result={result} busy={analyzing} previewOnly={readiness === "preview" || readiness === "unavailable"} />
    </div>
  );
}

export function ScreeningWorkspace() {
  return <Workspace service={inferenceService} />;
}
