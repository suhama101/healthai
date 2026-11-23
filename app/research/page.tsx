import type { Metadata } from "next";
import { PageIntro, ResearchNotice } from "@/components/research-info";

export const metadata: Metadata = { title: "Research & Methodology" };

const sections = [
  { id: "problem", title: "Problem definition",
    description: "Can a model distinguish parasitized and uninfected cell crops from thin blood smears? The unit of analysis is one cell crop. Changes in stain, preparation, or imaging may affect how well a method generalizes." },
  { id: "dataset", title: "Malaria microscopy dataset",
    description: "The National Library of Medicine publishes labeled thin-smear cell crops and grouping identifiers. We checked for overlap by released group, source field, and exact bytes. The mappings alone cannot confirm independence between people.",
    link: { href: "https://lhncbc.nlm.nih.gov/LHC-research/LHC-projects/image-processing/malaria-datasheet.html", label: "NLM malaria datasheet" } },
  { id: "model", title: "CLIP and medical vision-language models",
    description: "The research comparison tests OpenAI CLIP ViT-B/32 and Microsoft BiomedCLIP. It keeps the encoders frozen and labels cosine prompt scoring and supervised ridge scoring separately.",
    link: { href: "https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224", label: "BiomedCLIP model card" } },
  { id: "class-representations", title: "Knowledge-guided class representations",
    description: "The prompt ensemble uses three descriptions per class. The descriptors reference possible appearances in a stained smear, such as a delicate ring or visible chromatin.",
    link: { href: "https://www.cdc.gov/dpdx/malaria/", label: "CDC DPDx morphology reference" } },
  { id: "evaluation", title: "Validation and held-out comparison",
    description: "The original class-name baseline predicted parasitized for all 256 crops. Step 3 reserved new groups and selected a supervised ridge head on frozen CLIP features. On validation, it recalled 89.1% of parasitized crops and 89.8% of uninfected crops. The repository research report contains the locked paired test." },
  { id: "kpl", title: "KPL-inspired research direction",
    description: "Knowledge Proxy Learning explores richer text and multimodal representations for training-free medical image classification. MediLens AI takes inspiration from this research for a future prompt comparison.",
    link: { href: "https://arxiv.org/abs/2501.11231", label: "Knowledge Proxy Learning paper" } },
  { id: "limitations", title: "Limitations and intended use",
    description: "The workspace shows uncalibrated scores for two cell classes. Generalization and patient-level performance remain unverified. Use the prototype only for research and education." },
];

export default function Research() {
  return (
    <>
      <PageIntro label="Research protocol" title="Research & Methodology">
        Model comparisons, held-out testing, and the limits of the research results.
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
