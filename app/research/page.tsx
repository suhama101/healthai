import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Binary, ChevronDown, FlaskConical, Focus, Image as ImageIcon, SlidersHorizontal } from "lucide-react";
import { ResearchDemo } from "@/components/research-demo";
import { demoSamples, publishedMethods } from "@/lib/research-demo";
import evidence from "@/research/step-3-results.json";

export const metadata: Metadata = { title: "Technology & Validation" };

const { clip, biomed } = evidence.final_test;
const selected = clip["clip-ridge"];
const percent = (fraction: number) => `${(fraction * 100).toFixed(2)}%`;
const weakerRecall = (result: typeof selected) =>
  Math.min(result.per_class.parasitized.recall, result.per_class.uninfected.recall);
const validation = evidence.validation.clip.validation["clip-ridge"];
const biomedValidation = evidence.validation.biomed.validation["biomed-ridge"];
const test = evidence.protocol.partitions.test;
const report = "https://github.com/suhama101/healthai/blob/main/research/";
const classes = ["Parasitized", "Uninfected"];
const comparison = [
  { label: "CLIP class names", result: clip["class-name"] },
  { label: "CLIP knowledge-guided prompts", result: clip["knowledge-guided"] },
  { label: "CLIP morphology ensemble", result: clip["clip-ensemble"] },
  { label: "CLIP supervised ridge", result: selected },
  { label: "BiomedCLIP class names", result: biomed["biomed-class-name"] },
  { label: "BiomedCLIP morphology ensemble", result: biomed["biomed-ensemble"] },
  { label: "BiomedCLIP supervised ridge", result: biomed["biomed-ridge"] },
];
const metrics = [
  { label: "Accuracy", value: percent(selected.accuracy), detail: `${selected.confusion_matrix[0][0] + selected.confusion_matrix[1][1]} of ${selected.n} correct` },
  { label: "Parasitized recall", value: percent(selected.per_class.parasitized.recall), detail: `${selected.confusion_matrix[0][0]} of ${test.sample_class_counts.parasitized} detected` },
  { label: "Uninfected recall", value: percent(selected.per_class.uninfected.recall), detail: `${selected.confusion_matrix[1][1]} of ${test.sample_class_counts.uninfected} detected` },
  { label: "Held-out test", value: selected.n, detail: `Cell crops from ${test.sample_groups} released groups` },
];
const steps = [
  { icon: ImageIcon, title: "Microscopy image", detail: "One thin-smear cell crop" },
  { icon: Focus, title: "Frozen CLIP encoder", detail: "OpenAI ViT-B/32" },
  { icon: Binary, title: "Feature representation", detail: "512 normalized image features" },
  { icon: SlidersHorizontal, title: "Supervised ridge classifier", detail: "Fitted on labeled development crops" },
  { icon: FlaskConical, title: "Research result", detail: "Predicted class and raw scores" },
];

export default function Research() {
  return (
    <>
      <section className="validation-intro" aria-labelledby="validation-title">
        <div className="container validation-lead">
          <div className="validation-copy">
            <h1 id="validation-title">Technology &amp; Validation</h1>
            <p>MediLens AI investigates whether software can distinguish red blood cells containing malaria parasites from cells without parasites in individual microscope images.</p>
            <Link className="button button-primary" href="/workspace#demo-cases">Open Laboratory Workspace</Link>
          </div>
          <section className="validation-benchmark panel" aria-labelledby="results">
            <h2 id="results">Held-out research benchmark</h2>
            <p className="validation-value">{percent(selected.accuracy)}</p>
            <p>Selected model accuracy on <strong>{selected.n} individual cell crops</strong> from one public dataset.</p>
            <p className="validation-context">Research and education only. Clinical diagnostic accuracy has not been established.</p>
          </section>
        </div>
      </section>
      <div className="container inner-content research-dashboard">
        <section className="validation-overview" aria-label="Validation overview">
          <div>
            <h2>What was tested</h2>
            <p>Seven methods classified the same {selected.n} prepared cell images. The test images were separate from the images used to select the model.</p>
          </div>
          <div>
            <h2>Why more validation is needed</h2>
            <p>Labs use different stains, microscopes, and preparation workflows. Independent studies across sites would need to establish performance on whole slides and patient samples before clinical use.</p>
          </div>
        </section>

        <section className="validation-evidence" aria-labelledby="technical-evidence">
          <h2 id="technical-evidence">Technical evidence</h2>
          <details className="panel evidence-disclosure">
            <summary>Model comparison <ChevronDown size={18} aria-hidden="true" /></summary>
            <div className="evidence-disclosure-body">
              <section className="evidence-panel" aria-labelledby="comparison">
                <h3 id="comparison">All seven methods</h3>
                <p>Accuracy on the same {selected.n} locked-test crops.</p>
                <div className="comparison-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
                <ul className="comparison-chart">
                  {comparison.map(({ label, result }) => (
                    <li key={label} data-selected={result === selected}>
                      <div className="comparison-label">
                        <span>{label}{result === selected && <small>Selected on validation</small>}</span>
                        <strong>{percent(result.accuracy)}</strong>
                      </div>
                      <div className="comparison-track" aria-hidden="true">
                        <span style={{ width: percent(result.accuracy) }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <ResearchDemo methods={publishedMethods} samples={demoSamples} />
            </div>
          </details>

          <details className="panel evidence-disclosure">
            <summary>Per-class results and confusion matrix <ChevronDown size={18} aria-hidden="true" /></summary>
            <div className="evidence-disclosure-body">
              <p className="research-description">Validation-selected frozen OpenAI CLIP ViT-B/32 image encoder with a supervised ridge classifier.</p>
              <dl className="research-metrics">
                {metrics.map(({ label, value, detail }) => (
                  <div className="research-metric" key={label}>
                    <dt>{label}</dt><dd className="metric-value">{value}</dd><dd>{detail}</dd>
                  </div>
                ))}
              </dl>
              <section className="evidence-panel" aria-labelledby="confusion">
                <h3 id="confusion">Confusion matrix</h3>
                <p>Selected CLIP ridge model. Rows are actual classes and columns are predicted classes.</p>
                <table className="confusion-matrix">
                  <caption className="sr-only">Locked-test crop counts for CLIP supervised ridge</caption>
                  <thead><tr>
                    <th scope="col">Actual class</th>
                    {classes.map((label) => <th scope="col" key={label}>Predicted<br />{label}</th>)}
                  </tr></thead>
                  <tbody>
                    {selected.confusion_matrix.map((row, i) => (
                      <tr key={classes[i]}>
                        <th scope="row">{classes[i]}</th>
                        {row.map((count, j) => (
                          <td key={classes[j]} data-correct={i === j}>
                            <strong>{count}</strong><span>{i === j ? "Correct" : "Error"}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="matrix-summary"><strong>{selected.confusion_matrix[0][1]}</strong> missed parasitized crops · <strong>{selected.confusion_matrix[1][0]}</strong> uninfected crops flagged</p>
              </section>
            </div>
          </details>

          <details className="panel evidence-disclosure">
            <summary>Methodology and model selection <ChevronDown size={18} aria-hidden="true" /></summary>
            <div id="methodology" className="evidence-disclosure-body">
              <ol className="method-flow">
                {steps.map(({ icon: Icon, title, detail }, index) => (
                  <li key={title}>
                    <span className="icon-tile"><Icon size={21} aria-hidden="true" /></span>
                    <div><h3>{title}</h3><p>{detail}</p></div>
                    {index < steps.length - 1 && <>
                      <ArrowRight className="flow-arrow-right" size={16} aria-hidden="true" />
                      <ArrowDown className="flow-arrow-down" size={16} aria-hidden="true" />
                    </>}
                  </li>
                ))}
              </ol>
              <ol className="research-story">
                <li>The original class-name prompts predicted parasitized for every crop in the locked comparison and scored {percent(clip["class-name"].accuracy)}.</li>
                <li>Knowledge-guided prompts shifted the bias toward uninfected, with {percent(clip["knowledge-guided"].per_class.parasitized.recall)} parasitized recall. The morphology ensemble still recalled only {percent(clip["clip-ensemble"].per_class.uninfected.recall)} of uninfected crops.</li>
                <li>We froze the encoder and fitted a small ridge classifier on {evidence.protocol.partitions.development.sample_class_counts.parasitized + evidence.protocol.partitions.development.sample_class_counts.uninfected} labeled development crops using a penalty of {evidence.protocol.ridge_penalty}.</li>
                <li>The prespecified selection rule prioritized weaker-class recall across {validation.n} validation crops. CLIP ridge led BiomedCLIP ridge by {percent(weakerRecall(validation))} to {percent(weakerRecall(biomedValidation))} on this criterion.</li>
                <li>On the newly reserved locked test, CLIP ridge scored {percent(selected.accuracy)} and BiomedCLIP ridge scored {percent(biomed["biomed-ridge"].accuracy)}. The demo uses the method selected before test access.</li>
              </ol>
              <p>We checked for overlap between the development, validation and locked-test partitions using released group IDs, source fields and exact file digests.</p>
            </div>
          </details>

          <details className="panel evidence-disclosure">
            <summary>Study limitations and sources <ChevronDown size={18} aria-hidden="true" /></summary>
            <div className="evidence-disclosure-body">
            <section className="research-limits" aria-labelledby="limitations">
              <h3 id="limitations">Limitations and intended use</h3>
              <ul>
                <li>Research and education only. The prototype has no clinical validation.</li>
                <li>The benchmark used a balanced sample from one public NLM cell-crop dataset. Evidence for generalization across sites, stains and imaging systems is limited.</li>
                <li>The model returns uncalibrated raw ridge scores, which have no interpretation as diagnostic probabilities.</li>
                <li>The split separated released groups. The published identifiers cannot fully verify patient independence.</li>
              </ul>
            </section>

            <section aria-labelledby="sources">
              <h3 id="sources">Research sources</h3>
              <ul className="research-sources">
                <li><a className="text-link" href={`${report}step-3.md`}>Step 3 report</a></li>
                <li><a className="text-link" href={`${report}step-3-results.json`}>Step 3 results JSON</a></li>
                <li><a className="text-link" href="https://data.lhncbc.nlm.nih.gov/public/Malaria/index.html">NLM malaria dataset</a></li>
                <li><a className="text-link" href="https://huggingface.co/openai/clip-vit-base-patch32">CLIP model card</a></li>
                <li><a className="text-link" href="https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224">BiomedCLIP model card</a></li>
                <li><a className="text-link" href="https://www.cdc.gov/dpdx/malaria/">CDC morphology reference</a></li>
                <li><a className="text-link" href="https://arxiv.org/abs/2501.11231">KPL paper (future research)</a></li>
              </ul>
            </section>
            </div>
          </details>
        </section>
      </div>
    </>
  );
}
