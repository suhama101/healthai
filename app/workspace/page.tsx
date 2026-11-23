import type { Metadata } from "next";
import { PageIntro, ResearchNotice } from "@/components/research-info";
import { ScreeningWorkspace } from "@/components/screening-workspace";

export const metadata: Metadata = { title: "AI Screening Workspace" };

export default function WorkspacePage() {
  return (
    <>
      <PageIntro label="Research workspace" title="AI Screening Workspace">
        Preview a de-identified microscopy cell crop and analyze it with the local CLIP research baseline.
      </PageIntro>
      <div className="container inner-content">
        <ScreeningWorkspace />
        <ResearchNotice />
      </div>
    </>
  );
}
