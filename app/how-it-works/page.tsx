import type { Metadata } from "next";
import { ArrowRight, Upload } from "lucide-react";
import Link from "next/link";
import { sampleWorkflow } from "@/components/research-info";
import { nlmSiteDemoEnabled } from "@/lib/nlm-demo-release";

export const metadata: Metadata = { title: "How It Works" };

export default function HowItWorks() {
  return (
    <section className="container product-section product-guide">
      <h1>How It Works</h1>
      <ol className="product-process" aria-label="Steps to analyze a sample">
        {sampleWorkflow.map(({ title, description, icon: Icon }, index) => (
          <li className="product-step" key={title}>
            <span className="icon-tile"><Icon size={21} aria-hidden="true" /></span>
            <p className="product-step-number">Step {index + 1}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </li>
        ))}
      </ol>
      <p className="product-guide-note">
        The experimental upload accepts only correctly prepared 44 x 44 black-masked single-cell malaria RBC crops.
        Findings are for research and education only, not diagnosis or patient care.
      </p>
      {nlmSiteDemoEnabled() && (
        <div className="button-row">
          <Link href="/analyze#upload-your-image" className="button button-primary">Upload Your Image <Upload size={18} aria-hidden="true" /></Link>
          <Link href="/analyze" className="button button-secondary">Start Analysis <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      )}

      <section className="product-roadmap" aria-labelledby="roadmap-heading">
        <div className="product-section-heading product-section-heading-wide">
          <div>
            <p className="eyebrow">Future Development Roadmap</p>
            <h2 id="roadmap-heading">A bounded prototype with a clear path forward</h2>
          </div>
          <p className="product-section-lede">Each next step adds capability and evidence; none is implied by the current research demo.</p>
        </div>
        <ol className="product-roadmap-list">
          <li className="product-roadmap-item" data-status="current">
            <span className="product-roadmap-status">Current</span>
            <h3>Prepared single-cell classification</h3>
            <p>Classify one correctly prepared 44 x 44 malaria RBC crop in the browser using the pinned NIH/NLM model.</p>
          </li>
          <li className="product-roadmap-item" data-status="planned">
            <span className="product-roadmap-status">Planned</span>
            <h3>Full-image preprocessing</h3>
            <p>Add supervised preprocessing and cell extraction so a full microscopy image can be prepared before inference.</p>
          </li>
          <li className="product-roadmap-item" data-status="planned">
            <span className="product-roadmap-status">Planned</span>
            <h3>Multi-cell analysis and reporting</h3>
            <p>Support multiple extracted cells with traceable summaries and research reports rather than a single-cell result.</p>
          </li>
          <li className="product-roadmap-item" data-status="required">
            <span className="product-roadmap-status">Required before clinical use</span>
            <h3>Validation, review, and compliance</h3>
            <p>Independent validation, expert review, and applicable regulatory compliance would be required before any clinical use claim.</p>
          </li>
        </ol>
      </section>
    </section>
  );
}
