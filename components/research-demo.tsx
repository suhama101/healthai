"use client";

import { FlaskConical, ImageOff, Microscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DemoSample, PublishedMethod } from "@/lib/research-demo";

const classes = { parasitized: "Parasitized", uninfected: "Uninfected" };
const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

function SampleDetails({ sample, methods }: { sample: DemoSample; methods: readonly PublishedMethod[] }) {
  const [imageStatus, setImageStatus] = useState<"loading" | "ready" | "error">("loading");

  return (
    <div className="demo-sample-details">
      <figure>
        {imageStatus !== "error" && (
          <Image src={sample.image} alt={`Microscopy crop for ${sample.title}`} unoptimized
            onLoad={() => setImageStatus("ready")} onError={() => setImageStatus("error")} />
        )}
        {imageStatus === "loading" && <p role="status">Loading the microscopy crop…</p>}
        {imageStatus === "error" && <p role="alert">The microscopy crop could not be loaded. Reload the page or choose another sample.</p>}
        <figcaption>{sample.source.credit} · <a className="text-link" href={sample.source.url}>Image source</a> · {" "}
          <a className="text-link" href={sample.source.redistributionTermsUrl}>Redistribution terms</a></figcaption>
      </figure>
      {imageStatus === "ready" && (
        <div className="demo-sample-results" aria-live="polite">
          <p><strong>Dataset label</strong> {classes[sample.actualClass]} · Development crop</p>
          {methods.map((method) => {
            const result = sample.results.find((entry) => entry.method === method.id);
            return (
              <section className="demo-sample-method" key={method.id}>
                <h4>{method.name}</h4>
                {result ? (
                  <>
                    <p><strong>Stored prediction</strong> {classes[result.predictedClass]}</p>
                    <p>{result.model.name}<span className="model-revision">{result.model.version}</span></p>
                    <p>{method.scoreLabel} · uncalibrated</p>
                    <dl className="demo-scores">
                      <div><dt>Parasitized</dt><dd>{result.scores.parasitized}</dd></div>
                      <div><dt>Uninfected</dt><dd>{result.scores.uninfected}</dd></div>
                    </dl>
                  </>
                ) : <p>A verified result for this method is unavailable.</p>}
              </section>
            );
          })}
          <p>Each method assigns the class with the higher score. Cosine similarities and ridge scores use different scales and have no probability interpretation.</p>
        </div>
      )}
    </div>
  );
}

export function ResearchDemo({ methods, samples }: {
  methods: readonly PublishedMethod[];
  samples: readonly DemoSample[];
}) {
  const [methodId, setMethodId] = useState<PublishedMethod["id"]>("clip-ridge");
  const [sampleId, setSampleId] = useState(samples[0]?.id);
  const method = methods.find((item) => item.id === methodId);
  const sample = samples.find((item) => item.id === sampleId);

  return (
    <section id="research-demo" className="research-demo" aria-labelledby="research-demo-title">
      <div className="demo-banner">
        <FlaskConical size={22} aria-hidden="true" />
        <div>
          <h2 id="research-demo-title" tabIndex={-1}>Precomputed Research Demonstration — Not Live Image Analysis</h2>
          <p>Explore stored experimental results without a model connection. For research and education only.</p>
        </div>
      </div>
      <div className="workspace-grid">
        <section className="panel" aria-labelledby="demo-samples-title">
          <div className="panel-heading">
            <span className="icon-tile"><Microscope size={21} aria-hidden="true" /></span>
            <div><h3 id="demo-samples-title">Microscopy examples</h3><p>Development crops with stored results</p></div>
          </div>
          {sample ? (
            <>
              <label className="demo-select" htmlFor="demo-sample">Choose a research example
                <select id="demo-sample" value={sample.id} onChange={(event) => setSampleId(event.target.value)}>
                  {samples.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
                </select>
              </label>
              <SampleDetails key={sample.id} sample={sample} methods={methods} />
            </>
          ) : (
            <div className="results-empty">
              <ImageOff size={30} strokeWidth={1.5} aria-hidden="true" />
              <h4>Sample results unavailable</h4>
              <p>Development images and their paired predictions are pending public release clearance.</p>
              <Link className="text-link" href="/workspace#demo-cases">Review a de-identified image in the Workspace</Link>
            </div>
          )}
        </section>
        <section className="panel demo-comparison" aria-labelledby="demo-comparison-title">
          <div className="panel-heading">
            <div><h3 id="demo-comparison-title">Compare research methods</h3><p>Published aggregate benchmark · OpenAI CLIP ViT-B/32</p></div>
          </div>
          <fieldset className="demo-method-picker">
            <legend>Choose a method</legend>
            <div>
              {methods.map(({ id, name }) => (
                <label key={id}>
                  <input type="radio" name="demo-method" value={id} checked={id === methodId} onChange={() => setMethodId(id)} />
                  {name}
                </label>
              ))}
            </div>
          </fieldset>
          {method && (
            <div className="demo-benchmark" aria-live="polite">
              <p>{method.description}</p>
              <p><strong>Locked-test summary</strong> · {method.count} crops</p>
              <dl className="demo-scores">
                <div><dt>Accuracy</dt><dd>{percent(method.accuracy)}</dd></div>
                <div><dt>Parasitized recall</dt><dd>{percent(method.recall.parasitized)}</dd></div>
                <div><dt>Uninfected recall</dt><dd>{percent(method.recall.uninfected)}</dd></div>
              </dl>
            </div>
          )}
          <a className="text-link" href="#comparison">View the full benchmark and methodology</a>
        </section>
      </div>
    </section>
  );
}
