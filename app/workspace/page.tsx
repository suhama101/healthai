import type { Metadata } from "next";
import Link from "next/link";
import { DemoCaseWorkspace } from "@/components/demo-case-workspace";
import { PageIntro, ResearchNotice } from "@/components/research-info";

export const metadata: Metadata = { title: "Laboratory Workspace" };

export default function WorkspacePage() {
  return (
    <div className="laboratory-workspace">
      <PageIntro label="Research and education only" title="Laboratory Workspace">
        Review a research image, save your observations, and download a report.
      </PageIntro>
      <div className="container inner-content">
        <nav className="research-nav" aria-label="Workspace sections">
          <a href="#demo-cases">Demo cases</a>
          <Link id="research-demo" href="/research#research-demo">Research comparison</Link>
        </nav>
        <DemoCaseWorkspace />
        <ResearchNotice />
      </div>
    </div>
  );
}
