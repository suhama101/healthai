import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ResearchNotice, workflow } from "@/components/research-info";

export const metadata: Metadata = { title: "How It Works" };

export default function HowItWorks() {
  return (
    <>
      <PageIntro label="Screening workflow" title="How It Works">
        Follow the path from a single cell image to a research classification. Run the local inference service to enable Analyze.
      </PageIntro>
      <div className="container inner-content">
        <ol className="step-grid">
          {workflow.map(({ title, description, icon: Icon }, index) => (
            <li className="panel step-card" key={title}>
              <span className="icon-tile"><Icon size={24} aria-hidden="true" /></span>
              <div>
                <p className="step-label">Step {index + 1}</p>
                <h2>{title}</h2><p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div><Link href="/workspace" className="button button-primary">Try the Demo</Link></div>
        <ResearchNotice />
      </div>
    </>
  );
}
