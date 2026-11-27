import { notFound } from "next/navigation";
import { PageIntro, ResearchNotice } from "@/components/research-info";
import { ScreeningWorkspace } from "@/components/screening-workspace";
import { inferenceService } from "@/lib/inference";

export default function LocalModelPage() {
  if (process.env.NODE_ENV !== "development" || inferenceService.status !== "configured" ||
      !["localhost", "127.0.0.1"].includes(new URL(inferenceService.origin).hostname)) {
    notFound();
  }

  return (
    <>
      <PageIntro label="Offline rehearsal" title="Local model demo">
        Use authorized, de-identified research images with the prepared local model service.
      </PageIntro>
      <div className="container inner-content">
        <ScreeningWorkspace />
        <ResearchNotice />
      </div>
    </>
  );
}
