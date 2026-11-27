"use client";

import { Download, FilePlus2, FlaskConical, FolderOpen, ImageIcon, ShieldAlert, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  caseDate, caseImageInfo, createDemoCase, deleteDemoCase, loadDemoCases, prepareDemoImage, readDemoCase,
  resetDemoCases, reviewStatuses, saveDemoCase, type DemoCase, type DemoImage, type ReviewStatus,
} from "@/lib/demo-cases";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/image-validation";

function CasePreview({ image }: { image: DemoImage }) {
  const showPreview = useCallback((element: HTMLImageElement | null) => {
    if (!element) return;
    const url = URL.createObjectURL(image.blob);
    element.src = url;
    return () => URL.revokeObjectURL(url);
  }, [image.blob]);

  return (
    <figure className="case-preview">
      {/* An object URL is visible only in the browser and needs no image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={showPreview} alt="Uploaded research image for this demo case" />
      <figcaption>{caseImageInfo(image)}</figcaption>
    </figure>
  );
}

const storageError = "This browser could not open demo storage. Check that site storage is allowed and try again.";

export function DemoCaseWorkspace() {
  const [cases, setCases] = useState<DemoCase[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edits, setEdits] = useState<DemoCase | null>(null);
  const [operation, setOperation] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [refreshNeeded, setRefreshNeeded] = useState(false);
  const locked = Boolean(operation);
  const saved = cases?.find((item) => item.id === selectedId);
  const current = edits ?? saved;

  useEffect(() => {
    let cancelled = false;
    loadDemoCases().then((items) => {
      if (cancelled) return;
      setCases(items);
      setSelectedId(items[0]?.id ?? null);
    }).catch(() => {
      if (!cancelled) setError(storageError);
    });
    return () => { cancelled = true; };
  }, []);

  async function perform(label: string, work: () => Promise<void>, failureMessage: string) {
    setOperation(label);
    setError("");
    setFeedback("");
    try {
      await work();
    } catch (failure) {
      setError(failure instanceof DOMException && failure.name === "QuotaExceededError"
        ? "Browser storage is full. Delete an older demo case and try again."
        : failureMessage);
    } finally {
      setOperation("");
    }
  }

  function canLeaveEditor() {
    return !edits || window.confirm("Discard unsaved changes to this demo case?");
  }

  function selectCase(id: string | null) {
    setSelectedId(id);
    setEdits(null);
    setFeedback("");
    setError("");
  }

  function changeCase(changes: Partial<Pick<DemoCase, "title" | "notes" | "status" | "image">>) {
    setEdits((latest) => current ? { ...(latest ?? current), ...changes } : null);
    setFeedback("");
  }

  function reportStaleCase() {
    setRefreshNeeded(true);
    setError("This case changed or was deleted in another tab. Reload cases to get the current saved version.");
  }

  async function refresh() {
    if (!canLeaveEditor()) return;
    await perform("Loading cases…", async () => {
      const items = await loadDemoCases();
      setCases(items);
      selectCase(items.find((item) => item.id === selectedId)?.id ?? items[0]?.id ?? null);
      setRefreshNeeded(false);
    }, storageError);
  }

  async function create() {
    if (!canLeaveEditor()) return;
    await perform("Creating case…", async () => {
      const item = await createDemoCase();
      setCases((items) => [item, ...(items ?? [])]);
      selectCase(item.id);
      setFeedback("Draft case created and saved in this browser.");
    }, "Could not create the demo case. Check that browser storage is available.");
  }

  async function upload(file: File) {
    await perform("Preparing the local image preview…", async () => {
      try {
        changeCase({ image: await prepareDemoImage(file) });
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Could not prepare the image.");
      }
    }, "Could not prepare the image.");
  }

  async function save() {
    if (!edits || locked || refreshNeeded) return;
    await perform("Saving changes…", async () => {
      const item = await saveDemoCase(edits);
      if (!item) {
        reportStaleCase();
        return;
      }
      setCases((items) => items?.map((entry) => entry.id === item.id ? item : entry) ?? null);
      setEdits(null);
      setFeedback("Review saved in this browser.");
    }, "Could not save the review. Your edits are still open.");
  }

  async function removeCase(id: string) {
    if (!window.confirm("Delete this demo case, its image, and review notes from this browser?")) return;
    await perform("Deleting case…", async () => {
      await deleteDemoCase(id);
      const remaining = await loadDemoCases();
      setCases(remaining);
      selectCase(remaining[0]?.id ?? null);
      setRefreshNeeded(false);
      setFeedback("Demo case deleted.");
    }, "Could not confirm case deletion. Reload cases to check what remains.");
  }

  async function reset() {
    if (!window.confirm("Delete all MediLens demo cases, images, and review notes from this browser?")) return;
    await perform("Resetting demo cases…", async () => {
      await resetDemoCases();
      setCases([]);
      selectCase(null);
      setRefreshNeeded(false);
      setFeedback("All demo cases were removed from this browser.");
    }, "Could not reset the demo cases. Try again or clear the site’s data in browser settings.");
  }

  async function download() {
    if (!saved || edits) return;
    await perform("Preparing report…", async () => {
      const item = await readDemoCase(saved.id);
      if (!item || item.revision !== saved.revision) {
        reportStaleCase();
        return;
      }
      const { downloadDemoReport } = await import("@/lib/demo-report");
      await downloadDemoReport(item);
      setFeedback("PDF report prepared for download.");
    }, "Could not create the PDF. Try again or use another browser.");
  }

  return (
    <section id="demo-cases" className="case-workspace" aria-labelledby="demo-cases-title">
      <div className="case-header">
        <div>
          <h2 id="demo-cases-title" tabIndex={-1}>Laboratory demo cases</h2>
          <p>Create a fictional case, review a research image, and export a report.</p>
        </div>
        <button type="button" className="button button-primary" disabled={locked || !cases} onClick={create}>
          <FilePlus2 size={18} aria-hidden="true" /> New demo case
        </button>
      </div>
      <aside className="case-notice" aria-label="Demo storage and privacy">
        <ShieldAlert size={20} aria-hidden="true" />
        <p><strong>Temporary browser workspace.</strong> Use fictional details and authorized de-identified research images only. Keep patient names, identifiers, and clinical records out of notes and images. This browser profile’s users can access and delete saved cases. Use a secure record system for patient data.</p>
      </aside>
      <div className="case-feedback">
        <p role="status">{operation || feedback || (!cases && !error ? "Loading saved demo cases…" : "")}</p>
        {error && <p className="case-error" role="alert">{error}</p>}
        {(refreshNeeded || (!cases && error)) && (
          <button type="button" className="button button-secondary" onClick={refresh} disabled={locked}>Reload cases</button>
        )}
      </div>
      <div className="case-layout">
        <section className="panel case-list" aria-labelledby="case-list-title">
          <h3 id="case-list-title">Saved cases{cases ? ` (${cases.length})` : ""}</h3>
          {cases?.length ? (
            <ul>
              {cases.map((item) => (
                <li key={item.id}>
                  <button type="button" className="case-list-item" aria-pressed={item.id === selectedId} disabled={locked}
                    onClick={() => { if (item.id !== selectedId && canLeaveEditor()) selectCase(item.id); }}>
                    <strong>{item.title || item.id}</strong>
                    <span>{item.status} · {caseDate(item.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : cases && <p>No saved cases yet.</p>}
          {Boolean(cases?.length) && (
            <button type="button" className="button button-secondary case-delete" disabled={locked} onClick={reset}>Reset all demo cases</button>
          )}
        </section>

        {current ? (
          <form className="panel case-editor" aria-labelledby="case-editor-title" onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <header className="case-editor-header">
              <div>
                <h3 id="case-editor-title">{current.id}</h3>
                <p>Created <time dateTime={current.createdAt}>{caseDate(current.createdAt)}</time></p>
              </div>
              <p className="case-saved-state" data-dirty={Boolean(edits)}>{edits ? "Unsaved changes" : "Saved in this browser"}</p>
            </header>
            <div className="case-fields">
              <label htmlFor="case-title"><span>Fictional case title <small>(optional)</small></span>
                <input id="case-title" type="text" value={current.title} maxLength={80} autoComplete="off" disabled={locked}
                  onChange={(event) => changeCase({ title: event.target.value })} />
              </label>
              <label htmlFor="case-status">Review status
                <select id="case-status" value={current.status} disabled={locked}
                  onChange={(event) => changeCase({ status: event.target.value as ReviewStatus })}>
                  {reviewStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
            </div>
            <div className="case-review-grid">
              <section className="case-image" aria-labelledby="case-image-title">
                <h4 id="case-image-title">Research image</h4>
                {current.image ? <CasePreview image={current.image} /> : (
                  <div className="case-preview case-preview-empty"><ImageIcon size={25} aria-hidden="true" /><p>No image attached</p></div>
                )}
                <label htmlFor="case-file">{current.image ? "Replace research image" : "Choose a research image"}</label>
                <input id="case-file" type="file" accept={ACCEPTED_IMAGE_TYPES} aria-describedby="case-file-hint" disabled={locked}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file) void upload(file);
                  }} />
                <p id="case-file-hint">JPEG or PNG up to 10 MB. The saved preview omits the original name and metadata.</p>
                {current.image && <button type="button" className="text-link" disabled={locked} onClick={() => changeCase({ image: null })}>Remove image</button>}
              </section>
              <div className="case-notes">
                <label htmlFor="case-notes">Human review observations</label>
                <textarea id="case-notes" rows={7} maxLength={4000} value={current.notes} disabled={locked} autoComplete="off"
                  aria-describedby="case-notes-hint" placeholder="Record what you see in the research image."
                  onChange={(event) => changeCase({ notes: event.target.value })} />
                <p id="case-notes-hint">Reviewer-entered research notes. Avoid patient details and diagnostic conclusions.</p>
              </div>
            </div>
            <div className="case-ai-status">
              <FlaskConical size={19} aria-hidden="true" />
              <p><strong>AI result unavailable for this case.</strong> Case images stay in the browser. <a className="text-link" href="#research-demo">Explore the published research comparison</a>.</p>
            </div>
            <footer className="case-actions">
              <div className="button-row">
                <button type="submit" className="button button-primary" disabled={locked || !edits || refreshNeeded}>Save changes</button>
                <button type="button" className="button button-secondary" disabled={locked || Boolean(edits) || refreshNeeded}
                  aria-describedby="case-export-hint" onClick={download}><Download size={18} aria-hidden="true" /> Download PDF</button>
              </div>
              <p id="case-export-hint">Save your review before exporting. Downloaded files are managed separately from browser cases.</p>
              <button type="button" className="button button-secondary case-delete" disabled={locked}
                onClick={() => { void removeCase(current.id); }}><Trash2 size={16} aria-hidden="true" /> Delete case</button>
            </footer>
          </form>
        ) : (
          <div className="panel case-empty">
            <span className="icon-tile"><FolderOpen size={24} aria-hidden="true" /></span>
            <h3>Ready for a demo review</h3>
            <p>Create a case to attach an image, record observations, and save your review.</p>
          </div>
        )}
      </div>
    </section>
  );
}
