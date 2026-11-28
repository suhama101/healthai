"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Microscope, ScanLine } from "lucide-react";
import { malariaDescriptionBank } from "@/lib/local-malaria-descriptions";
import { prepareNlmUpload } from "@/lib/prepare-nlm-upload";

type Prepared = Awaited<ReturnType<typeof prepareNlmUpload>> & { url: string };
type Input = { state: "empty" | "checking" } | { state: "unsupported"; reason: string } | { state: "ready"; image: Prepared };
type Result = { state: "idle" | "running" | "error" | "timeout" } | { state: "ready"; finding: "parasitized" | "uninfected" };
type Reply = { id: number; imageSha256?: string; modelSha256?: string; finding?: "parasitized" | "uninfected"; error?: boolean };

export function CustomUpload({ modelSha256 }: { modelSha256: string }) {
  const [input, setInput] = useState<Input>({ state: "empty" });
  const [prepared, setPrepared] = useState(false);
  const [result, setResult] = useState<Result>({ state: "idle" });
  const selection = useRef(0);
  const sequence = useRef(0);
  const url = useRef<string | null>(null);
  const worker = useRef<Worker | null>(null);
  const pending = useRef<{ id: number; timer: number } | null>(null);

  useEffect(() => () => {
    selection.current++;
    worker.current?.terminate();
    if (pending.current) window.clearTimeout(pending.current.timer);
    if (url.current) URL.revokeObjectURL(url.current);
  }, []);

  function clearPending() {
    if (pending.current) window.clearTimeout(pending.current.timer);
    pending.current = null;
  }

  async function select(file: File) {
    const version = ++selection.current;
    clearPending();
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null;
    setPrepared(false);
    setResult({ state: "idle" });
    setInput({ state: "checking" });
    try {
      const image = await prepareNlmUpload(file);
      if (selection.current !== version) return;
      url.current = URL.createObjectURL(image.png);
      setInput({ state: "ready", image: { ...image, url: url.current } });
    } catch (error) {
      if (selection.current !== version) return;
      setInput({
        state: "unsupported",
        reason: error instanceof Error && error.name === "Error" ? error.message : "This browser could not prepare the image.",
      });
    }
  }

  function analyze() {
    if (input.state !== "ready" || !prepared || pending.current) return;
    const { bytes, imageSha256 } = input.image;
    const id = ++sequence.current;
    setResult({ state: "running" });
    try {
      worker.current ??= new Worker("/nlm-browser/v1/inference-worker.js");
      const engine = worker.current;
      function fail(state: "error" | "timeout") {
        clearPending();
        engine.terminate();
        worker.current = null;
        setResult({ state });
      }
      pending.current = { id, timer: window.setTimeout(() => fail("timeout"), 35_000) };
      engine.onmessage = ({ data }: MessageEvent<Reply>) => {
        if (pending.current?.id !== data.id) return;
        if (data.error || data.imageSha256 !== imageSha256 || data.modelSha256 !== modelSha256
          || (data.finding !== "parasitized" && data.finding !== "uninfected")) {
          fail("error");
          return;
        }
        clearPending();
        setResult({ state: "ready", finding: data.finding });
      };
      engine.onerror = () => {
        if (worker.current !== engine) return;
        if (pending.current) fail("error");
        else {
          engine.terminate();
          worker.current = null;
        }
      };
      const png = bytes.slice(0);
      engine.postMessage({ id, png, imageSha256, modelSha256 }, [png]);
    } catch {
      clearPending();
      worker.current?.terminate();
      worker.current = null;
      setResult({ state: "error" });
    }
  }

  const explanation = result.state === "ready" ? malariaDescriptionBank.entries[result.finding] : null;
  const retry = result.state === "error" || result.state === "timeout";
  return (
    <details className="product-upload">
      <summary><ImagePlus size={20} aria-hidden="true" /> Upload Your Image (Experimental) <small>Experimental Research Beta — Prepared Single-Cell Crop Required</small></summary>
      <div className="product-upload-content">
        <p id="custom-format">
          Only correctly prepared 44 x 44 masked single-cell malaria RBC crops are supported.
          Use one Giemsa-stained red blood cell with a black mask.
          Accepted files are PNG or baseline JPEG, up to 32 KiB, with no embedded metadata.
        </p>
        <p>
          Your file stays on this device. Results are research-only and not for diagnosis or patient care.
          Use permitted, de-identified research images only. The format and mask checks cannot verify that the image contains one suitable cell.
        </p>
        <div className="product-analysis-grid">
          <section className="product-input-card" aria-label="Custom image selection">
            <label htmlFor="custom-cell-image">Choose a prepared cell crop</label>
            <input id="custom-cell-image" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              aria-describedby="custom-format" onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (file) void select(file);
              }} />
            {input.state === "checking" && <p role="status">Checking the image…</p>}
            {input.state === "ready" && (
              <>
                <figure className="product-cell-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={input.image.url} alt="Selected research cell crop" width={264} height={264} />
                </figure>
                <label className="product-upload-confirm">
                  <input type="checkbox" checked={prepared} onChange={(event) => {
                    setPrepared(event.target.checked);
                    if (!event.target.checked) {
                      clearPending();
                      setResult({ state: "idle" });
                    }
                  }} />
                  <span>I confirm this is one red blood cell prepared with a black mask for research use.</span>
                </label>
              </>
            )}
            <button type="button" className="button button-primary" onClick={analyze}
              disabled={input.state !== "ready" || !prepared || result.state === "running"}>
              {result.state === "running"
                ? <><LoaderCircle size={18} className="product-spinner" aria-hidden="true" /> Analyzing uploaded image…</>
                : <><ScanLine size={18} aria-hidden="true" /> {retry ? "Retry uploaded image" : "Analyze uploaded image"}</>}
            </button>
          </section>
          <section className="product-result-card" aria-labelledby="custom-result-title">
            <div className="product-result-heading">
              <span className="icon-tile"><Microscope size={22} aria-hidden="true" /></span>
              <h2 id="custom-result-title">Experimental cell finding</h2>
            </div>
            <div className="product-result-body" aria-live="polite">
              {input.state === "unsupported" ? (
                <>
                  <h3>{malariaDescriptionBank.entries.unableToAssess.title}</h3>
                  <p className="product-analysis-error">{input.reason}</p>
                </>
              ) : explanation ? (
                <>
                  <h3>{explanation.title}</h3>
                  <p>{explanation.description}</p>
                  <ul className="product-result-sources">
                    {explanation.sources.map((source) => <li key={source.url}><a href={source.url}>{source.label}</a></li>)}
                  </ul>
                </>
              ) : (
                <p>{result.state === "running" ? "Running the model on your device…"
                  : result.state === "error" ? "Analysis is unavailable. Retry the selected image."
                  : result.state === "timeout" ? "Analysis timed out. Retry the selected image."
                  : "Choose and confirm a prepared crop to see its research finding."}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </details>
  );
}
