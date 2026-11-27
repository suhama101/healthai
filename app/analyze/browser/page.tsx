import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { malariaDescriptionBank } from "@/lib/local-malaria-descriptions";
import release from "@/research/nlm-fixed-sample-release.json";
import { BrowserDemo } from "./browser-demo";

export const metadata: Metadata = { title: "Analyze a Sample in Your Browser" };

export default function BrowserAnalyzePage() {
  if (
    (process.env.NODE_ENV !== "development" && process.env.NLM_BROWSER_DEMO_ENABLED !== "1")
    || release.descriptionBank !== malariaDescriptionBank.version
  ) notFound();

  return (
    <section className="product-analysis-page">
      <div className="container product-section">
        <div className="product-analysis-intro">
          <h1>Analyze a Malaria Cell Sample</h1>
          <p>Choose one of the two included samples. Analyze runs the model on your device.</p>
        </div>
        <BrowserDemo modelSha256={release.model.sha256} samples={release.samples} />
        <aside className="product-analysis-notice" aria-label="Research use">
          <ShieldCheck size={19} aria-hidden="true" />
          <p><strong>Research use only.</strong> The finding describes one cell and cannot diagnose malaria in a person. This demo accepts only the included images.</p>
        </aside>
        <p className="product-credits">
          Source: U.S. National Library of Medicine. The samples were extracted, masked, and resized.
          {" "}<a href="/licenses/nlm-demo/dataset.txt">Dataset terms and citation</a>
          {" · "}<a href="/licenses/nlm-demo/model.txt">Model license</a>
          {" · "}<a href="/nlm-browser/v1/runtime/LICENSE.txt">LiteRT.js license</a>
        </p>
      </div>
    </section>
  );
}
