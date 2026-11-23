import { ClipboardList } from "lucide-react";
import type { PredictionResponse, ResearchClass } from "@/lib/inference";

const labels: Record<ResearchClass, string> = {
  parasitized: "Parasitized",
  uninfected: "Uninfected",
};

export function ResultsDisplay({ result }: { result: PredictionResponse | null }) {
  const scores = result?.scores;
  return (
    <section className="panel results-panel" aria-labelledby="results-title">
      <div className="panel-heading">
        <span className="icon-tile"><ClipboardList size={21} aria-hidden="true" /></span>
        <div><h2 id="results-title">Research results</h2><p>Outputs from a connected model</p></div>
      </div>
      <div aria-live="polite">
        {result ? (
          <div className="result-content">
            <dl>
              <div><dt>Predicted research class</dt><dd>{labels[result.predictedClass]}</dd></div>
              <div><dt>Model</dt><dd>{result.model.name} · {result.model.version}</dd></div>
              {result.baseline && (
                <div><dt>Baseline</dt><dd>{result.baseline.name} · {result.baseline.version} · {labels[result.baseline.predictedClass]}</dd></div>
              )}
            </dl>
            {scores && (
              <div>
                <h3>{scores.kind === "calibrated_probability" ? "Calibrated probabilities" : scores.label}</h3>
                {scores.kind === "calibrated_probability" && <p>Calibration method: {scores.calibrationMethod}</p>}
                <dl>
                  {(Object.keys(labels) as ResearchClass[]).map((label) => (
                    <div key={label}><dt>{labels[label]}</dt><dd>
                      {scores.kind === "calibrated_probability"
                        ? scores.values[label].toLocaleString(undefined, { style: "percent", maximumFractionDigits: 2 })
                        : scores.values[label]}
                    </dd></div>
                  ))}
                </dl>
              </div>
            )}
            <div><h3>Limitations</h3><ul>{result.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
          </div>
        ) : (
          <div className="results-empty">
            <ClipboardList size={34} strokeWidth={1.5} aria-hidden="true" />
            <h3>No analysis yet</h3>
            <p>A research classification and model details will appear here after a connected model completes an analysis.</p>
          </div>
        )}
      </div>
    </section>
  );
}
