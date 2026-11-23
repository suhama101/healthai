import type { Metadata } from "next";
import { PageIntro, ResearchNotice } from "@/components/research-info";
import { ScreeningWorkspace } from "@/components/screening-workspace";

export const metadata: Metadata = { title: "AI Screening Workspace" };

export default function WorkspacePage() {
  return (
    <>
      <PageIntro label="Research workspace" title="AI Screening Workspace">
        Preview a microscopic cell image from a de-identified research sample.
      </PageIntro>
      <div className="container inner-content">
        <ScreeningWorkspace />
        <ResearchNotice />
      </div>
    </>
  );
}
