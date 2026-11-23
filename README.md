# MediLens AI

**An Explainable Malaria Cell Screening Research Prototype**

Capital Youth Expo 2026 · Healthcare Hackathon

| Milestone | Date |
| --- | --- |
| Official development window | November 16–28, 2026 |
| Submission deadline | November 28, 2026 at 11:59 PM |
| Finale | December 2, 2026 |

MediLens AI started as an original hackathon frontend. Step 2 adds an original local inference adapter, FastAPI service, dataset audit, and evaluation workflow. General-purpose CLIP weights, the NLM dataset, and prior research are third-party inputs credited below.

## What it does

The research question is whether text describing visible cell features can help a vision-language model distinguish parasitized and uninfected crops from thin-smear microscopy. The workspace accepts a de-identified JPEG or PNG up to 10 MiB, validates it, and shows a local preview. Analyze becomes available after a configured local model service loads. The class-name CLIP baseline returns a research class and two raw image–text cosine similarities. A separate experimental configuration uses morphology-guided prompts.

Previewing an image makes no image request. Selecting Analyze sends that image to the loopback address shown in the workspace. The FastAPI service processes it in memory. There is no patient-image persistence.

## Run locally

Use Python 3.12 with a CPU PyTorch build and Node.js 20.9 or later. The following examples use PowerShell on Windows. On platforms that use `.venv/bin/python`, run the matching executable and set `NEXT_PUBLIC_MEDILENS_API_URL` in the frontend process environment.

From the project root, set up the environment once. If PowerShell resolves Python to an unused Store shim, use the actual Python 3.12 executable.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install torch==2.14.0 --index-url https://download.pytorch.org/whl/cpu
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe -m backend.assets model
npm.cmd ci
```

The model download is about 605 MB and is needed once. The dataset is optional for the workspace and required for evaluating and running the public-image integration test. Start the backend in one terminal. Health becomes ready once the weights and text embeddings have loaded.

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.api:app --host 127.0.0.1 --port 8000 --no-access-log
```

Start Next.js in a second terminal and open `http://127.0.0.1:3000/workspace`. Keep port 3000 for the configured development CORS origins.

```powershell
$env:NEXT_PUBLIC_MEDILENS_API_URL = 'http://127.0.0.1:8000'
npm.cmd run dev -- --hostname 127.0.0.1
```

Without the variable, the pages and image preview still work and Analyze stays disabled. If using a production build locally, set the variable before `npm.cmd run build` because Next.js embeds public values at build time. The PyTorch service is designed for a local process.

## Dataset, evaluation, and checks

Source: National Library of Medicine. The [NLM Malaria Cell Images archive and official mappings](https://data.lhncbc.nlm.nih.gov/public/Malaria/index.html) contain labeled cell crops. Cite Rajaraman et al. (2018), *Pre-trained convolutional neural networks as feature extractors toward improved malaria parasite detection in thin blood smear images*, PeerJ 6:e4568. See the linked report for terms, class counts, grouping, split audits, actual results, and limitations. [Original dataset paper](https://doi.org/10.7717/peerj.4568)

```powershell
.\.venv\Scripts\python.exe -m backend.assets dataset
.\.venv\Scripts\python.exe -m backend.dataset
.\.venv\Scripts\python.exe -m backend.evaluate --per-class 128
.\.venv\Scripts\python.exe -m pytest backend/tests
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

The archive, weights, manifest, and detailed per-image predictions stay under the Git-ignored `.medilens/` directory. See the [research report](research/step-2.md) and [inference contract](docs/inference-contract.md).

In the initial 256-crop held-out benchmark, the class-name baseline labeled every crop parasitized. The experimental prompts identified 7 of 128 parasitized crops. These results illustrate the limits of this checkpoint and prompt setup. [Machine-readable results](research/step-2-results.json)

## Third-party disclosures

| Material | Use |
| --- | --- |
| [OpenAI CLIP ViT-B/32 checkpoint](https://huggingface.co/openai/clip-vit-base-patch32/tree/3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268) | Pinned general-purpose research weights and tokenizer. Upstream [OpenAI CLIP software is MIT-licensed](https://github.com/openai/CLIP/blob/main/LICENSE). The [checkpoint model card](https://huggingface.co/openai/clip-vit-base-patch32) describes research use and puts deployed use out of scope. |
| [Original CLIP paper](https://proceedings.mlr.press/v139/radford21a.html) and [Knowledge Proxy Learning](https://arxiv.org/abs/2501.11231) | Prior research. Step 2 uses fixed English prompts and cosine scoring. KPL is future research. |
| [CDC DPDx malaria morphology](https://www.cdc.gov/dpdx/malaria/) | Source for the experimental prompt wording. No CDC images are included. |
| Python dependencies | PyTorch, Hugging Face Transformers, Pillow, FastAPI/Pydantic, Uvicorn, pytest, and HTTPX. The tested core versions are in the report and requirements. |
| Frontend dependencies | Next.js App Router, React, Tailwind CSS, TypeScript, Lucide React, and ESLint, with resolved versions in `package-lock.json`. |
| Landing-page artwork | OpenAI-generated illustration. |

OpenAI Codex assisted with the source implementation, research documentation, and verification. OpenAI image generation produced the landing-page illustration.

## Intended use

Research and education only. Use de-identified research or test images. Do not use the prototype for diagnosis, treatment, patient care, or patient-level conclusions. The model is general-purpose CLIP, chooses from two classes even for out-of-scope inputs, and has no clinical validation or probability calibration.
