import { ArrowRight, Microscope, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { sampleWorkflow } from "@/components/research-info";
import { nlmSiteDemoEnabled } from "@/lib/nlm-demo-release";
import release from "@/research/nlm-fixed-sample-release.json";

export default function Home() {
  const analysisAvailable = nlmSiteDemoEnabled();
  return (
    <>
      <section className="product-hero">
        <div className="container product-hero-grid">
          <div className="product-hero-copy">
            <h1>Intelligent malaria <span>cell analysis</span></h1>
            <p>
              Explore AI-assisted analysis of microscopic blood-cell images through
              an interactive research demonstration.
            </p>
            <div className="button-row">
              {analysisAvailable ? (
                <Link href="/analyze" className="button button-primary">Start Analysis <ArrowRight size={18} aria-hidden="true" /></Link>
              ) : (
                <span className="product-muted">Sample analysis is unavailable in this build.</span>
              )}
              <Link href="/how-it-works" className="button button-secondary">How It Works</Link>
            </div>
            <p className="product-scope"><ShieldCheck size={17} aria-hidden="true" /> Two included samples. Research use only.</p>
          </div>
          <figure className="product-preview">
            <div className="product-preview-heading">
              <span className="icon-tile"><Microscope size={22} aria-hidden="true" /></span>
              <h2>Included microscopy samples</h2>
            </div>
            <ul className="product-sample-gallery">
              {release.samples.map(({ id, title }) => (
                <li key={id}>
                  <Image unoptimized src={`/nlm-browser/v1/${id}.png`} alt={`Microscopic blood-cell crop for ${title}`} width={44} height={44} />
                  <span>{title}</span>
                </li>
              ))}
            </ul>
            <figcaption>
              Choose a sample to see its model finding and a short explanation.
              {" "}<a href="/licenses/nlm-demo/dataset.txt">Images from the U.S. National Library of Medicine.</a>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="container product-section" aria-labelledby="process-heading">
        <h2 id="process-heading">From sample to finding</h2>
        <ol className="product-process">
          {sampleWorkflow.map(({ title, description, icon: Icon }, index) => (
            <li className="product-step" key={title}>
              <span className="icon-tile"><Icon size={21} aria-hidden="true" /></span>
              <p className="product-step-number">Step {index + 1}</p>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
