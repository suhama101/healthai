import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/research-info";
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
    <>
      <PageIntro label="Two-sample research demonstration" title="Analyze a Malaria Cell Sample">
        Choose one of two included red blood cell crops. The model runs on your device when you click Analyze.
        The finding concerns one cell and cannot diagnose malaria.
      </PageIntro>
      <div className="container inner-content">
        <BrowserDemo modelSha256={release.model.sha256} samples={release.samples} />
        <p>Only the included research images are available. The model and samples download to your browser for analysis.</p>
        <p>
          Source: U.S. National Library of Medicine. The samples were extracted, masked, and resized.
          {" "}<a href="/licenses/nlm-demo/dataset.txt">Dataset terms and citation</a>
          {" · "}<a href="/licenses/nlm-demo/model.txt">Model license</a>
          {" · "}<a href="/nlm-browser/v1/runtime/LICENSE.txt">LiteRT.js license</a>
        </p>
      </div>
    </>
  );
}
