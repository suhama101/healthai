import { FlaskConical, Images, ScanLine, ShieldAlert, Upload, Workflow } from "lucide-react";
import type { ReactNode } from "react";

export const workflow = [
  { title: "Upload an image", description: "Select a de-identified JPEG or PNG of a microscopic cell.", icon: Upload },
  { title: "Validate and prepare", description: "The workspace checks the file and displays a preview. The local model service applies CLIP preprocessing.", icon: ScanLine },
  { title: "Run the model", description: "Select Analyze when the local service is ready. The selected research method scores the crop against two cell classes.", icon: Workflow },
  { title: "Review the result", description: "Inspect the research class, model details, and limitations returned by the connected service.", icon: FlaskConical },
];

export const sampleWorkflow = [
  { title: "Select a sample image", description: "Choose one of the two included blood-cell images.", icon: Images },
  { title: "Click Analyze", description: "Run the AI model on the selected sample.", icon: ScanLine },
  { title: "View the finding", description: "Read the cell finding and a short medical explanation.", icon: FlaskConical },
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
