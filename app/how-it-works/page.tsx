import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
        This demo analyzes only the two included research samples. A finding describes one cell
        and cannot diagnose malaria in a person.
      </p>
      {nlmSiteDemoEnabled() && (
        <Link href="/analyze" className="button button-primary">Start Analysis <ArrowRight size={18} aria-hidden="true" /></Link>
      )}
    </section>
  );
}
