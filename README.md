# MediLens AI

**An Explainable Malaria Cell Screening Research Prototype**

Capital Youth Expo 2026 · Healthcare Hackathon

| Milestone | Date |
| --- | --- |
| Official development window | November 16–28, 2026 |
| Submission deadline | November 28, 2026 at 11:59 PM |
| Finale | December 2, 2026 |

MediLens AI is an original hackathon frontend built during the official development window. The interface and upload workflow were created for this project. The proposed evaluation draws on the prior work cited below.

## Problem and proposed solution

Cell appearance can vary with staining, preparation, and image quality. MediLens AI asks whether a vision-language model using descriptions of visible cell features can distinguish parasitized and uninfected crops from thin-smear microscopy. The planned experiment will compare those descriptions with a class-name baseline on the same held-out data.

## Run locally

Use Node.js 20.9 or later and npm. From the project directory:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. On Windows, use `npm.cmd` if PowerShell blocks the npm script shim.

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

`npm start` serves the completed production build. Step 1 uses no environment variables. The frontend uses Next.js App Router, React, TypeScript, Tailwind CSS, Lucide React, and ESLint, with exact versions recorded in the npm lockfile. It is structured for a standard Next.js build on Vercel. Python and PyTorch are planned for a separately deployed inference service.

## Implemented in Step 1

| Route | Contents |
| --- | --- |
| `/` | Project overview, research question, workflow preview, and demo entry point |
| `/workspace` | Drag-and-drop and keyboard-accessible file browsing, validation, preview, replacement, removal, and clearing |
| `/how-it-works` | Four-step screening workflow with the future model steps identified |
| `/research` | Candidate dataset, modeling approach, evaluation plan, sources, and limitations |
| `/about` | Original project scope, intended use, and hackathon timeline |

The workspace checks that a selection contains one JPEG or PNG of at most 10 MB, verifies its file signature, and decodes it locally. Previews use revocable browser object URLs, and clearing or leaving the workspace releases them. The workspace sends no image requests. Analyze remains disabled because inference is disconnected. The result panel is empty until it receives a genuine response from a connected service.

## Inference integration

See the [inference contract](docs/inference-contract.md) for response types and adapter requirements. Future work will:

1. Confirm dataset access terms and provenance, split held-out data by patient or acquisition source where supported, and document the classes and preprocessing.
2. Choose and disclose the encoder, pretrained weights, versions, and licenses. Implement the Python/PyTorch inference service and a class-name baseline.
3. Validate the request and response on the service boundary, including limits on file size, type, and decoded dimensions. Verify the service and select its approved hosting and data-retention policy before connecting it.
4. Evaluate both approaches on the held-out split. Document per-class performance, failure cases, and score semantics. Display probabilities only if calibration has been evaluated.
5. Wire, test, and enable the real service adapter. Update the privacy copy to explain the destination and handling of uploaded images before enabling transmission.

## Third-party disclosures

| Material | Status |
| --- | --- |
| Next.js, React, Tailwind CSS, ESLint, and related tooling | Open-source packages listed in `package.json` and `package-lock.json`. Use the resolved packages for their redistribution notices. |
| TypeScript and Lucide React | Open-source packages listed in the lockfile. See the respective package license notices, including any inherited icon notices. |
| [NLM Falciparum Thin Cell Images](https://lhncbc.nlm.nih.gov/LHC-research/LHC-projects/image-processing/malaria-datasheet.html) | Candidate only. Dataset release, terms, attribution, and data split are pending verification before use. No dataset files are included. |
| [CLIP paper](https://proceedings.mlr.press/v139/radford21a.html) | Conceptual reference. Encoder, model code, weight versions, and applicable licenses are pending selection. |
| [Knowledge Proxy Learning (KPL)](https://arxiv.org/abs/2501.11231) | Research inspiration. No KPL implementation or weights were imported. |
| Landing-page artwork | Generated with OpenAI image generation. It is an illustration and contains no patient data. |

OpenAI Codex assisted with implementation, documentation, and verification. OpenAI image generation produced the landing-page illustration.

## Intended use and limitations

For research and education only. Do not use for clinical diagnosis, treatment, or patient care. Only use de-identified research or test images. Step 1 includes no inference service, model weights, clinical validation, calibration, or evaluation results. Cell-level performance, if established later, would not establish patient-level performance.
