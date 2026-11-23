import { FlaskConical, ScanLine, ShieldAlert, Upload, Workflow } from "lucide-react";
import type { ReactNode } from "react";

export const workflow = [
  { title: "Upload an image", description: "Select a de-identified JPEG or PNG of a microscopic cell.", icon: Upload },
  { title: "Validate and prepare", description: "The workspace checks the file and displays a preview. The future model will apply its own preprocessing.", icon: ScanLine },
  { title: "Run the model", description: "Once connected, the model will compare the image with the chosen research class representations.", icon: Workflow },
  { title: "Review the result", description: "Inspect the research class, model details, and limitations returned by the connected service.", icon: FlaskConical },
];

export function PageIntro({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <section className="page-intro">
      <div className="container">
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <p className="intro-copy">{children}</p>
      </div>
    </section>
  );
}

export function ResearchNotice() {
  return (
    <aside className="notice" aria-label="Research use notice">
      <span className="icon-tile"><ShieldAlert size={22} aria-hidden="true" /></span>
      <div>
        <h2>For research and education only</h2>
        <p>Use de-identified research or test images only. MediLens AI is a research prototype. Do not use it for diagnosis, treatment, or patient care.</p>
      </div>
    </aside>
  );
}
