import type { Metadata } from "next";
import { PageIntro, ResearchNotice } from "@/components/research-info";
import { ResearchDemo } from "@/components/research-demo";
import { ScreeningWorkspace } from "@/components/screening-workspace";
import { demoSamples, publishedMethods } from "@/lib/research-demo";

export const metadata: Metadata = { title: "AI Screening Workspace" };

export default function WorkspacePage() {
  return (
    <>
      <PageIntro label="Research workspace" title="AI Screening Workspace">
        Explore published malaria cell-crop results or preview a de-identified microscopy image in your browser.
      </PageIntro>
      <div className="container inner-content">
        <nav className="research-nav" aria-label="Workspace sections">
          <a href="#research-demo">Research demonstration</a>
          <a href="#upload-preview">Upload preview</a>
        </nav>
        <ResearchDemo methods={publishedMethods} samples={demoSamples} />
        <section id="upload-preview" aria-labelledby="upload-preview-title">
          <h2 id="upload-preview-title" tabIndex={-1}>Upload preview</h2>
          <ScreeningWorkspace />
        </section>
        <ResearchNotice />
      </div>
    </>
  );
}
