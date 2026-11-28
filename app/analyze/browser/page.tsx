import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileCheck2, Microscope, ScanLine, ShieldCheck, Upload } from "lucide-react";
import { malariaDescriptionBank } from "@/lib/local-malaria-descriptions";
import release from "@/research/nlm-fixed-sample-release.json";
import { BrowserDemo } from "./browser-demo";
import { CustomUpload } from "./custom-upload";

export const metadata: Metadata = { title: "Analyze a Sample in Your Browser" };

export default function BrowserAnalyzePage() {
  if (
    (process.env.NODE_ENV !== "development" && process.env.NLM_BROWSER_DEMO_ENABLED !== "1")
    || release.descriptionBank !== malariaDescriptionBank.version
  ) notFound();
  const customUploadEnabled = process.env.NLM_BROWSER_CUSTOM_UPLOAD !== "0";

  return (
    <section className="product-analysis-page">
      <div className="container product-section">
        <div className="product-analysis-intro">
          <p className="eyebrow">Experimental Research Beta</p>
          <h1>Upload a prepared malaria cell crop</h1>
          <p>Upload, validate, and analyze one supported crop. The pinned LiteRT.js model runs entirely in your browser.</p>
        </div>
        {customUploadEnabled && <CustomUpload modelSha256={release.model.sha256} />}
        <ol className="product-upload-flow product-upload-flow-page" aria-label="Upload workflow">
          <li><Upload size={18} aria-hidden="true" /><span><strong>Upload</strong><small>Choose your crop</small></span></li>
          <li><FileCheck2 size={18} aria-hidden="true" /><span><strong>Validate</strong><small>Check the prepared format</small></span></li>
          <li><ScanLine size={18} aria-hidden="true" /><span><strong>Analyze</strong><small>Run locally in browser</small></span></li>
          <li><Microscope size={18} aria-hidden="true" /><span><strong>Finding</strong><small>Read the explanation</small></span></li>
        </ol>
        <section className="product-sample-section" id="included-samples" aria-labelledby="sample-option-heading">
          <div className="product-section-heading">
            <div>
              <p className="eyebrow">Secondary option</p>
              <h2 id="sample-option-heading">Analyze a Malaria Cell Sample</h2>
              <p>Use one of the two included samples if you do not have a prepared image.</p>
            </div>
          </div>
          <BrowserDemo modelSha256={release.model.sha256} samples={release.samples} />
        </section>
        <aside className="product-analysis-notice" aria-label="Research use">
          <ShieldCheck size={19} aria-hidden="true" />
          <p>
            <strong>Research use only.</strong> Findings describe one cell and are not for diagnosis or patient care.
            {!customUploadEnabled && " This demo accepts only the included images."}
          </p>
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
