import type { Metadata } from "next";
import { PageIntro, ResearchNotice } from "@/components/research-info";

export const metadata: Metadata = { title: "Research & Methodology" };

const sections = [
  { id: "problem", title: "Problem definition",
    description: "Can a model distinguish parasitized and uninfected cell crops from thin blood smears? The unit of analysis is one cell crop. Changes in stain, preparation, or imaging may affect how well a method generalizes." },
  { id: "dataset", title: "Malaria microscopy dataset",
    description: "The National Library of Medicine publishes labeled thin-smear cell crops with patient-to-cell mappings. The evaluation workflow groups the released identifiers, checks for source overlap, and excludes unmapped cells and exact byte duplicates.",
    link: { href: "https://lhncbc.nlm.nih.gov/LHC-research/LHC-projects/image-processing/malaria-datasheet.html", label: "NLM malaria datasheet" } },
  { id: "model", title: "CLIP and medical vision-language models",
    description: "The local service uses OpenAI’s pretrained CLIP ViT-B/32, a general-purpose encoder. It compares normalized image and text embeddings using cosine similarity.",
    link: { href: "https://proceedings.mlr.press/v139/radford21a.html", label: "Original CLIP paper" } },
  { id: "class-representations", title: "Knowledge-guided class representations",
    description: "The experimental prompts describe visible red-cell features, including a delicate parasite ring and chromatin dot. Both methods use the same weights and preprocessing.",
    link: { href: "https://www.cdc.gov/dpdx/malaria/", label: "CDC DPDx morphology reference" } },
  { id: "evaluation", title: "Baseline evaluation",
    description: "The class-name baseline predicted parasitized for all 256 crops in the initial patient-grouped held-out sample. The knowledge-guided experiment correctly identified 7 of 128 parasitized crops. See the Step 2 research report in the repository for the split and full benchmark results." },
  { id: "kpl", title: "KPL-inspired research direction",
    description: "Knowledge Proxy Learning explores richer text and multimodal representations for training-free medical image classification. MediLens AI takes inspiration from this research for a future prompt comparison.",
    link: { href: "https://arxiv.org/abs/2501.11231", label: "Knowledge Proxy Learning paper" } },
  { id: "limitations", title: "Limitations and intended use",
    description: "The workspace shows uncalibrated cosine similarities for two cell classes. Generalization and patient-level performance remain unverified. Use the prototype only for research and education." },
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
            {sections.map(({ id, title, description, link }) => (
              <section className="panel research-entry" key={id} id={id} aria-labelledby={`${id}-title`}>
                <h2 id={`${id}-title`}>{title}</h2>
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
