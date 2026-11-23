import { LoaderCircle, ScanLine } from "lucide-react";

export function AnalysisControls({ canAnalyze, busy, state, message, onAnalyze, onClear, canClear }: {
  canAnalyze: boolean;
  busy: boolean;
  state: "preview" | "checking" | "ready" | "unavailable";
  message: string;
  onAnalyze: () => void;
  onClear: () => void;
  canClear: boolean;
}) {
  return (
    <div className="analysis-controls">
      <p className="status-text" id="analysis-status" role="status" data-state={state}>{message}</p>
      <div className="button-row">
        <button type="button" className="button button-primary" disabled={!canAnalyze || busy}
          onClick={onAnalyze} aria-describedby="analysis-status">
          {busy ? <><LoaderCircle size={18} aria-hidden="true" /> Analyzing…</> : <><ScanLine size={18} aria-hidden="true" /> Analyze</>}
        </button>
        <button type="button" className="button button-secondary" disabled={!canClear} onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}
