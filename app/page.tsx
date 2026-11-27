import { Aperture, BookOpen, FlaskConical, Microscope, ScanLine, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import cellIllustration from "@/public/cell-illustration.png";
import { ResearchNotice, workflow } from "@/components/research-info";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-tag"><FlaskConical size={15} aria-hidden="true" /> Healthcare research prototype</p>
            <h1>See Beyond the <span>Microscope.</span></h1>
            <p className="hero-description">A research prototype for malaria cell-crop classification, with a held-out comparison of vision-language prompts and supervised classifiers.</p>
            <div className="button-row">
              <Link href="/workspace" className="button button-primary"><ScanLine size={19} aria-hidden="true" /> Try the Demo</Link>
              <Link href="/research" className="button button-secondary">Technology &amp; Validation</Link>
            </div>
            <p className="hero-privacy"><ShieldCheck size={17} aria-hidden="true" /> Image previews stay in your browser</p>
          </div>
          <figure className="hero-figure">
            <div className="hero-art">
              <Image src={cellIllustration} alt="" fill sizes="(max-width: 760px) 92vw, (max-width: 1200px) 45vw, 525px" preload />
              <div className="art-reticle" aria-hidden="true">
                <span /><span /><span /><span />
              </div>
            </div>
            <figcaption><Aperture size={16} aria-hidden="true" /> Microscopy-inspired illustration</figcaption>
          </figure>
        </div>
      </section>

      <section className="problem section-pad">
        <div className="container problem-inner">
          <div>
            <p className="eyebrow">The research question</p>
            <h2>Can visual knowledge improve cell classification?</h2>
            <p>Stain, image quality, and sample preparation can change the appearance of cells. MediLens AI explores whether descriptions of visible cell features can help a vision-language model distinguish research classes in thin-smear microscopy images.</p>
          </div>
          <Link href="/research" className="research-callout">
            <span className="icon-tile"><BookOpen size={23} aria-hidden="true" /></span>
            <div><h3>Held-out results</h3><p>See where prompt methods struggled, how we selected CLIP ridge, and which errors remained.</p><span className="text-link">Explore the benchmark</span></div>
          </Link>
        </div>
      </section>

      <section className="workflow-section section-pad">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow"><Microscope size={17} aria-hidden="true" /> Screening workflow</p><h2>From image to research output</h2></div>
            <Link href="/how-it-works" className="button button-secondary">How It Works</Link>
          </div>
          <ol className="workflow-grid">
            {workflow.map(({ title, description, icon: Icon }) => (
              <li className="workflow-card" key={title}>
                <span className="icon-tile"><Icon size={22} aria-hidden="true" /></span>
                <h3>{title}</h3><p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <div className="container notice-space"><ResearchNotice /></div>
    </>
  );
}
