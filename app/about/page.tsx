import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ResearchNotice } from "@/components/research-info";

export const metadata: Metadata = { title: "About the Project" };

export default function About() {
  return (
    <>
      <PageIntro label="Capital Youth Expo 2026" title="About the Project">
        A Malaria Cell Classification Research Prototype
      </PageIntro>
      <div className="container inner-content">
        <div className="about-grid">
          <section className="panel">
            <h2>An original Healthcare Hackathon prototype</h2>
            <p>MediLens AI was built for the Capital Youth Expo 2026 Healthcare Hackathon. Its local image workspace runs a validation-selected CLIP-based research method and presents its outputs and limitations.</p>
            <p>Prior academic research into training-free medical image classification informs the proposed experiments. The research page and project README document third-party sources and prior work.</p>
            <Link className="text-link" href="/research">Explore the research</Link>
          </section>
          <section className="panel event-card">
            <h2>Hackathon timeline</h2>
            <dl>
              <div><dt>Build window</dt><dd>November 16–28, 2026</dd></div>
              <div><dt>Submission deadline</dt><dd>November 28, 2026 at 11:59 PM</dd></div>
              <div><dt>Finale</dt><dd>December 2, 2026</dd></div>
            </dl>
          </section>
        </div>
        <ResearchNotice />
      </div>
    </>
  );
}
