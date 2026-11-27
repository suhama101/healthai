import { ClipboardList, ScanLine } from "lucide-react";
import { methodLabels, type PredictionResponse, type ResearchClass } from "@/lib/inference";

const labels: Record<ResearchClass, string> = {
  parasitized: "Parasitized",
  uninfected: "Uninfected",
};

export function ResultsDisplay({ result, busy, previewOnly }: {
  result: PredictionResponse | null;
  busy: boolean;
  previewOnly: boolean;
}) {
  const scores = result?.scores;
  return (
    <section className="panel results-panel" aria-labelledby="results-title">
      <div className="panel-heading">
        <span className="icon-tile"><ClipboardList size={21} aria-hidden="true" /></span>
        <div><h2 id="results-title">Research results</h2><p>Single cell-crop classification</p></div>
      </div>
      <div aria-live="polite">
        {result ? (
          <div className="result-content">
            <div className="result-prediction">
              <p>Predicted research class</p>
              <h3>{labels[result.predictedClass]}</h3>
            </div>
            <dl>
              <div><dt>Method</dt><dd>{methodLabels[result.method]}</dd></div>
              <div><dt>Model</dt><dd>{result.model.name}<span className="model-revision">{result.model.version}</span></dd></div>
              {result.baseline && (
                <div><dt>Baseline</dt><dd>{result.baseline.name} · {result.baseline.version} · {labels[result.baseline.predictedClass]}</dd></div>
              )}
            </dl>
            {scores && (
              <div>
                <h3>{scores.kind === "calibrated_probability" ? "Calibrated probabilities" : scores.label}</h3>
                {scores.kind === "calibrated_probability" && <p>Calibration method: {scores.calibrationMethod}</p>}
                {scores.kind === "model_score" && <p>Raw relative outputs. A higher score determines the research class. The values have no diagnostic probability interpretation.</p>}
                <dl className="result-scores">
                  {(Object.keys(labels) as ResearchClass[]).map((label) => (
                    <div key={label}><dt>{labels[label]}</dt><dd>
                      {scores.kind === "calibrated_probability"
                        ? scores.values[label].toLocaleString(undefined, { style: "percent", maximumFractionDigits: 2 })
                        : scores.values[label].toFixed(4)}
                    </dd></div>
                  ))}
                </dl>
              </div>
            )}
            <div className="result-limitations"><h3>Limitations</h3><ul>{result.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
          </div>
        ) : (
          <div className="results-empty">
            {busy ? <ScanLine size={34} strokeWidth={1.5} aria-hidden="true" /> : <ClipboardList size={34} strokeWidth={1.5} aria-hidden="true" />}
            {busy ? (
              <><h3>Analyzing the selected crop</h3><p>Waiting for the model service to return a research result.</p></>
            ) : previewOnly ? (
              <><h3>Image preview only</h3><p>Upload predictions require a connected model service.</p></>
            ) : (
              <><h3>No analysis yet</h3><p>A research class and model scores will appear after a completed analysis.</p></>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
