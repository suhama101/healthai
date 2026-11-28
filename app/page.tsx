import { ArrowRight, Microscope, ShieldCheck, Upload } from "lucide-react";
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
            <p className="eyebrow">Experimental Research Beta</p>
            <h1>Upload a prepared <span>malaria cell crop</span></h1>
            <p>
              Run the pinned LiteRT.js model locally in your browser on one supported
              44 x 44 black-masked single-cell image.
            </p>
            <div className="button-row">
              {analysisAvailable ? (
                <Link href="/analyze#upload-your-image" className="button button-primary">Upload Your Image <Upload size={18} aria-hidden="true" /></Link>
              ) : (
                <span className="product-muted">Sample analysis is unavailable in this build.</span>
              )}
              {analysisAvailable && <Link href="/analyze" className="button button-secondary">Start Analysis <ArrowRight size={18} aria-hidden="true" /></Link>}
              <Link href="/how-it-works" className="button button-secondary">How It Works</Link>
            </div>
            <p className="product-scope"><ShieldCheck size={17} aria-hidden="true" /> Research only. Not for diagnosis or patient care.</p>
          </div>
          <section className="product-upload-hero-panel" aria-labelledby="upload-panel-heading">
            <div className="product-preview-heading">
              <span className="icon-tile"><Upload size={22} aria-hidden="true" /></span>
              <h2 id="upload-panel-heading">Upload workflow</h2>
            </div>
            <ol className="product-upload-flow product-upload-flow-hero">
              <li><strong>1. Upload</strong><span>Select a prepared crop.</span></li>
              <li><strong>2. Validate</strong><span>Check size, format, and mask.</span></li>
              <li><strong>3. Analyze</strong><span>Run the model on-device.</span></li>
              <li><strong>4. Finding</strong><span>Read the research explanation.</span></li>
            </ol>
            <p className="product-upload-hero-note">
              Only correctly prepared 44 x 44 black-masked single-cell malaria RBC crops are supported.
              Your image stays in this browser.
            </p>
          </section>
        </div>
      </section>

      <section className="container product-section product-secondary-demo" aria-labelledby="secondary-demo-heading">
        <div className="product-section-heading">
          <div>
            <p className="eyebrow">Secondary option</p>
            <h2 id="secondary-demo-heading">Use an included sample</h2>
          </div>
          <Link href="/analyze" className="text-link">Open sample analysis <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <figure className="product-preview product-sample-preview">
          <div className="product-preview-heading">
            <span className="icon-tile"><Microscope size={22} aria-hidden="true" /></span>
            <h3>Two included microscopy samples</h3>
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
            Choose a sample to see its model finding and short explanation.
            {" "}<a href="/licenses/nlm-demo/dataset.txt">Images from the U.S. National Library of Medicine.</a>
          </figcaption>
        </figure>
      </section>

      <section className="container product-section product-sample-process" aria-labelledby="process-heading">
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
