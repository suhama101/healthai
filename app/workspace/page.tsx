import type { Metadata } from "next";
import { DemoCaseWorkspace } from "@/components/demo-case-workspace";
import { PageIntro, ResearchNotice } from "@/components/research-info";
import { ResearchDemo } from "@/components/research-demo";
import { ScreeningWorkspace } from "@/components/screening-workspace";
import { demoSamples, publishedMethods } from "@/lib/research-demo";

export const metadata: Metadata = { title: "Laboratory Workspace" };

export default function WorkspacePage() {
  return (
    <>
      <PageIntro label="Research workflow prototype" title="Laboratory Workspace">
        Review de-identified research images in fictional demo cases, save human observations, and export a PDF.
      </PageIntro>
      <div className="container inner-content">
        <nav className="research-nav" aria-label="Workspace sections">
          <a href="#demo-cases">Demo cases</a>
          <a href="#research-demo">Research demonstration</a>
          <a href="#upload-preview">Upload preview</a>
        </nav>
        <DemoCaseWorkspace />
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
