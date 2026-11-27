"use client";

import { useEffect, useRef, useState } from "react";
import { malariaDescriptionBank } from "@/lib/local-malaria-descriptions";

const assets = "/nlm-browser/v1";
type Sample = { id: string; title: string; imageSha256: string };
type Finding = "parasitized" | "uninfected";
type Preview = { state: "loading" | "error" } | { state: "ready"; url: string; bytes: ArrayBuffer };
type Outcome = { state: "idle" | "running" | "error" | "timeout" } | { state: "ready"; finding: Finding };
type WorkerReply = { id: number; error?: boolean; imageSha256?: string; modelSha256?: string; finding?: Finding };

export function BrowserDemo({ samples, modelSha256 }: { samples: Sample[]; modelSha256: string }) {
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [preview, setPreview] = useState<Preview>({ state: "loading" });
  const [outcome, setOutcome] = useState<Outcome>({ state: "idle" });
  const worker = useRef<Worker | null>(null);
  const sequence = useRef(0);
  const pending = useRef<{ id: number; timeout: number } | null>(null);
  const cached = useRef(new Map<string, ArrayBuffer>());
  const sample = samples[index];

  useEffect(() => {
    const abort = new AbortController();
    const timeout = window.setTimeout(() => {
      abort.abort();
      setPreview({ state: "error" });
    }, 15_000);
    let url: string | undefined;
    async function load() {
      try {
        let bytes = cached.current.get(sample.id);
        if (!bytes) {
          const response = await fetch(`${assets}/${sample.id}.png`, { redirect: "error", signal: abort.signal });
          if (!response.ok) throw new Error();
          bytes = await response.arrayBuffer();
          const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
          const hex = Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("");
          if (hex !== sample.imageSha256) throw new Error();
          cached.current.set(sample.id, bytes);
        }
        if (abort.signal.aborted) return;
        url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
        setPreview({ state: "ready", url, bytes });
      } catch {
        if (!abort.signal.aborted) setPreview({ state: "error" });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      abort.abort();
      window.clearTimeout(timeout);
      if (url) URL.revokeObjectURL(url);
    };
  }, [sample.id, sample.imageSha256, attempt]);

  useEffect(() => () => {
    worker.current?.terminate();
    if (pending.current) window.clearTimeout(pending.current.timeout);
  }, []);

  function clearPending() {
    if (pending.current) window.clearTimeout(pending.current.timeout);
    pending.current = null;
  }

  function analyze() {
    if (preview.state !== "ready" || pending.current) return;
    const id = ++sequence.current;
    setOutcome({ state: "running" });
    try {
      worker.current ??= new Worker(`${assets}/inference-worker.js`);
      const engine = worker.current;
      const timeout = window.setTimeout(() => {
        clearPending();
        engine.terminate();
        worker.current = null;
        setOutcome({ state: "timeout" });
      }, 35_000);
      pending.current = { id, timeout };
      engine.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
        if (data.id !== pending.current?.id) return;
        clearPending();
        if (data.error || data.modelSha256 !== modelSha256 || data.imageSha256 !== sample.imageSha256
          || (data.finding !== "parasitized" && data.finding !== "uninfected")) {
          engine.terminate();
          worker.current = null;
          setOutcome({ state: "error" });
          return;
        }
        setOutcome({ state: "ready", finding: data.finding });
      };
      engine.onerror = () => {
        if (worker.current !== engine) return;
        const analyzing = pending.current !== null;
        engine.terminate();
        worker.current = null;
        clearPending();
        if (analyzing) setOutcome({ state: "error" });
      };
      const png = preview.bytes.slice(0);
      engine.postMessage({ id, png, imageSha256: sample.imageSha256, modelSha256 }, [png]);
    } catch {
      clearPending();
      setOutcome({ state: "error" });
    }
  }

  const explanation = outcome.state === "ready" ? malariaDescriptionBank.entries[outcome.finding] : null;
  return (
    <section className="card p-5 space-y-3">
      <label htmlFor="browser-sample" className="block font-semibold">Research sample</label>
      <select id="browser-sample" className="rounded border p-2" value={index} onChange={(event) => {
        clearPending();
        setOutcome({ state: "idle" });
        setPreview({ state: "loading" });
        setIndex(Number(event.target.value));
      }}>
        {samples.map(({ id, title }, i) => <option key={id} value={i}>{title}</option>)}
      </select>
      {preview.state === "loading" && <p role="status">Loading sample…</p>}
      {preview.state === "error" && (
        <div>
          <p role="alert">Sample unavailable.</p>
          <button type="button" className="button button-secondary" onClick={() => {
            setPreview({ state: "loading" });
            setAttempt((value) => value + 1);
          }}>Retry sample</button>
        </div>
      )}
      {preview.state === "ready" && (
        // The verified image uses a browser-local blob URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.url} alt={`Red blood cell crop for ${sample.title}`} width={176} height={176} className="rounded border" />
      )}
      <div>
        <button type="button" className="button button-primary" onClick={analyze}
          disabled={preview.state !== "ready" || outcome.state === "running"}>
          {outcome.state === "running" ? "Analyzing…" : "Analyze sample"}
        </button>
      </div>
      <div aria-live="polite">
        {outcome.state === "error" && <p>Analysis unavailable in this browser. Try again.</p>}
        {outcome.state === "timeout" && <p>Analysis timed out. Try again.</p>}
        {explanation && (
          <>
            <h2 className="text-lg font-semibold">{explanation.title}</h2>
            <p>{explanation.description}</p>
            <ul className="mt-2">
              {explanation.sources.map((source) => <li key={source.url}><a href={source.url}>{source.label}</a></li>)}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
