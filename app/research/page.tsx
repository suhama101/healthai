import type { Metadata } from "next";
import { PageIntro, ResearchNotice } from "@/components/research-info";

export const metadata: Metadata = { title: "Research & Methodology" };

const sections = [
  { id: "problem", title: "Problem definition",
    description: "Can a model distinguish parasitized and uninfected cell crops from thin blood smears? The unit of analysis is one cell crop. Changes in stain, preparation, or imaging may affect how well a method generalizes." },
  { id: "dataset", title: "Malaria microscopy dataset",
    description: "The NLM Falciparum Thin Cell Images collection is a candidate dataset. Before use, confirm the release terms and provenance and establish a held-out split grouped by patient or source when identifiers are available.",
    link: { href: "https://lhncbc.nlm.nih.gov/LHC-research/LHC-projects/image-processing/malaria-datasheet.html", label: "NLM malaria datasheet" } },
  { id: "model", title: "CLIP and medical vision-language models",
    description: "CLIP encodes images and text in a shared representation space. A planned experiment will compare an image embedding with text embeddings for the candidate classes. The encoder and weights are pending selection.",
    link: { href: "https://proceedings.mlr.press/v139/radford21a.html", label: "Original CLIP paper" } },
  { id: "class-representations", title: "Knowledge-guided class representations",
    description: "Create and document descriptions of visible microscopy features for each class. Hold the encoder and preprocessing fixed so the comparison can isolate the effect of richer class descriptions." },
  { id: "evaluation", title: "Baseline evaluation",
    description: "Compare class-name prompts with knowledge-guided prompts on the same held-out split. Record the model version, preprocessing, per-class errors, and failure cases before drawing conclusions.",
    pending: true },
  { id: "kpl", title: "KPL-inspired research direction",
    description: "Knowledge Proxy Learning explores richer text and multimodal representations for training-free medical image classification. MediLens AI takes inspiration from this research for a future prompt comparison.",
    link: { href: "https://arxiv.org/abs/2501.11231", label: "Knowledge Proxy Learning paper" } },
  { id: "limitations", title: "Limitations and intended use",
    description: "Model performance, score calibration, and generalization are unverified. Cell-level experiments cannot establish patient-level performance. Use the prototype only for research and education.",
    pending: true },
];

export default function Research() {
  return (
    <>
      <PageIntro label="Research protocol" title="Research & Methodology">
        The proposed experiments, candidate sources, and evidence needed before interpreting model outputs.
      </PageIntro>
      <div className="container inner-content">
        <div className="research-grid">
          <nav className="panel research-index" aria-label="Research sections">
            <h2>On this page</h2>
            {sections.map(({ id, title }) => <a key={id} href={`#${id}`}>{title}</a>)}
          </nav>
          <div className="research-sections">
            {sections.map(({ id, title, description, link, pending }) => (
              <section className="panel research-entry" key={id} id={id} aria-labelledby={`${id}-title`}>
                <h2 id={`${id}-title`}>{title}</h2>
                {pending && <p className="pending-label">Evaluation pending</p>}
                <p>{description}</p>
                {link && <a className="text-link" href={link.href}>{link.label}</a>}
              </section>
            ))}
          </div>
        </div>
        <ResearchNotice />
      </div>
    </>
  );
}
