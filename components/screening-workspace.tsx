"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnalysisControls } from "@/components/analysis-controls";
import { ImagePreview } from "@/components/image-preview";
import { ImageUploader } from "@/components/image-uploader";
import { ResultsDisplay } from "@/components/results-display";
import { inferenceService, type InferenceService, type PredictionResponse } from "@/lib/inference";
import { validateImage } from "@/lib/image-validation";

function Workspace({ service }: { service: InferenceService }) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const selection = useRef(0);
  const request = useRef<AbortController | null>(null);
  const previewUrl = useRef<string | null>(null);
  const uploadHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => {
    selection.current++;
    request.current?.abort();
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

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
    if (service.status !== "connected" || !preview || validating || request.current) return;

    const controller = new AbortController();
    request.current = controller;
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const response = await service.analyze(preview.file, controller.signal);
      if (!controller.signal.aborted) setResult(response);
    } catch {
      if (!controller.signal.aborted) setError("Analysis failed. Check the model connection and try again.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setAnalyzing(false);
      }
    }
  }

  const status = service.status === "disconnected" ? service.message
    : analyzing ? "Analyzing image…" : preview ? "Image ready for analysis" : "Select an image to begin";

  return (
    <div className="workspace-grid">
      <section className="panel" aria-labelledby="upload-heading">
        <div className="panel-heading">
          <div><h2 id="upload-heading" tabIndex={-1} ref={uploadHeading}>Upload a cell image</h2><p>Use de-identified research or test images only.</p></div>
        </div>
        {preview && <ImagePreview {...preview} onRemove={clear} />}
        <ImageUploader hasImage={Boolean(preview)} onSelect={selectImage} />
        <div className="upload-feedback" aria-live="polite">
          {validating ? "Checking the image…" : error || (preview && "Image ready to preview.")}
        </div>
        <AnalysisControls canAnalyze={service.status === "connected" && Boolean(preview) && !validating}
          busy={analyzing} onAnalyze={analyze} message={status}
          onClear={clear} canClear={Boolean(preview || error || validating)} />
        <p className="workspace-privacy"><ShieldCheck size={17} aria-hidden="true" /> The current prototype keeps your image in this browser tab.</p>
      </section>
      <ResultsDisplay result={result} />
    </div>
  );
}

export function ScreeningWorkspace() {
  return <Workspace service={inferenceService} />;
}
