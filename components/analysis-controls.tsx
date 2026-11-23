import { ScanLine } from "lucide-react";

export function AnalysisControls({ canAnalyze, busy, message, onAnalyze, onClear, canClear }: {
  canAnalyze: boolean;
  busy: boolean;
  message: string;
  onAnalyze: () => void;
  onClear: () => void;
  canClear: boolean;
}) {
  return (
    <div className="analysis-controls">
      <p className="status-text" id="analysis-status" role="status">{message}</p>
      <div className="button-row">
        <button type="button" className="button button-primary" disabled={!canAnalyze || busy}
          onClick={onAnalyze} aria-describedby="analysis-status">
          <ScanLine size={18} aria-hidden="true" /> Analyze
        </button>
        <button type="button" className="button button-secondary" disabled={!canClear} onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}
