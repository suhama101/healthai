import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ResearchNotice, sampleWorkflow, workflow } from "@/components/research-info";
import { nlmSiteDemoEnabled } from "@/lib/nlm-demo-release";

export const metadata: Metadata = { title: "How It Works" };

export default function HowItWorks() {
  const showAnalyze = nlmSiteDemoEnabled();
  const steps = showAnalyze ? sampleWorkflow : workflow;
  return (
    <>
      <PageIntro label="Screening workflow" title="How It Works">
        {showAnalyze
          ? "Follow the path from a research sample to a model finding about one red blood cell."
          : "Follow the path from a single cell image to a research classification. Run the local inference service to enable Analyze."}
      </PageIntro>
      <div className="container inner-content">
        <ol className="step-grid">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li className="panel step-card" key={title}>
              <span className="icon-tile"><Icon size={24} aria-hidden="true" /></span>
              <div>
                <p className="step-label">Step {index + 1}</p>
                <h2>{title}</h2><p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div><Link href={showAnalyze ? "/analyze" : "/workspace"} className="button button-primary">
          {showAnalyze ? "Analyze a Sample" : "Try the Demo"}
        </Link></div>
        <ResearchNotice />
      </div>
    </>
  );
}
