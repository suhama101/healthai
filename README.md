# MediLens AI

**An Explainable Malaria Cell Screening Research Prototype**

Capital Youth Expo 2026 · Healthcare Hackathon

| Milestone | Date |
| --- | --- |
| Official development window | November 16–28, 2026 |
| Submission deadline | November 28, 2026 at 11:59 PM |
| Finale | December 2, 2026 |

MediLens AI is an original research workspace and evaluation workflow for classifying segmented microscopy crops as parasitized or uninfected. It preserves the Step 2 zero-shot baseline and audit. Step 3 compares the two pretrained encoders and fixed prompt sets, fits separately labeled supervised heads on development data, and selects the live method using validation data. See the [Step 3 comparison](research/step-3.md) and [archived Step 2 findings](research/step-2.md).

The local demo uses a supervised ridge head on frozen OpenAI CLIP features. It achieved **95.05% accuracy** on the 384-crop locked research sample. BiomedCLIP ridge reached **96.61%** on the same sample. The demo selection was made on validation before either method saw the locked test.

## Start the prepared local demo

Use Python 3.12 and Node.js 20.9 or later. After the one-time setup below, start the service and frontend in separate PowerShell terminals from the repo root. The running service uses cached weights and the frozen validation lock. It makes no model downloads during prediction.

```powershell
$env:HF_HUB_OFFLINE = '1'
$env:TRANSFORMERS_OFFLINE = '1'
$env:MEDILENS_VERIFY_RELEASE = '1'
.\.venv\Scripts\python.exe -m uvicorn backend.api:app --host 127.0.0.1 --port 8000 --no-access-log
```

```powershell
$env:NEXT_PUBLIC_MEDILENS_API_URL = 'http://127.0.0.1:8000'
npm.cmd run dev -- --hostname 127.0.0.1
```

Open `http://127.0.0.1:3000/workspace`. Analyze is disabled until the backend finishes startup and a valid crop is selected. The result identifies the chosen method and pretrained revision. The workspace sends the file only when Analyze is selected. The loopback server processes it in memory. The [inference contract](docs/inference-contract.md) covers score labels, limits, errors, and method availability.

## One-time setup for a fresh checkout

Use the actual Python 3.12 executable if Windows resolves `python` to a Store shim. On other platforms, use the equivalent virtual-environment executable. Install the matching CPU PyTorch and torchvision builds before the pinned Python requirements.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install torch==2.14.0 torchvision==0.29.0 --index-url https://download.pytorch.org/whl/cpu
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
npm.cmd ci
.\.venv\Scripts\python.exe -m backend.assets model
.\.venv\Scripts\python.exe -m backend.assets dataset
.\.venv\Scripts\python.exe -m backend.dataset
.\.venv\Scripts\python.exe -m backend.step3 assets
.\.venv\Scripts\python.exe -m backend.step3 validation
```

The two checkpoints total about 1.39 GB. The official cell archive is about 353 MB. They live under the ignored `.medilens/` directory along with the local validation lock, any fitted heads, split manifests, and per-image results. Prepare those files before the demo. For a local production build, set the public API variable before `npm.cmd run build`.

For the exact Step 3 demo on a fresh machine, use the private verified artifact transfer described in [Deployment](docs/deployment.md). The research setup above reproduces an experiment and can produce different floating-point coefficient bytes. Release mode requires the original frozen digests.

## Reproduce the research comparison

The validation command creates a separate group-disjoint Step 3 split, evaluates all candidates against the same validation sample, and freezes the selection. The entire historical Step 2 holdout stays quarantined. The final benchmark only reads the preregistered test sample after selection.

```powershell
# Needed on a fresh checkout to reconstruct the historical per-image audit
.\.venv\Scripts\python.exe -m backend.evaluate --per-class 128
.\.venv\Scripts\python.exe -m backend.step3 audit
.\.venv\Scripts\python.exe -m backend.step3 prepare
.\.venv\Scripts\python.exe -m backend.step3 final
```

The final command records a one-time test marker and saves `.medilens/step3/final-report.json`. The completed reference run is [step-3-results.json](research/step-3-results.json). It records the exact sample hashes, selection rule, metrics, failure digests, and startup, latency, and memory measurements. A fresh cache can reproduce the protocol independently. Do not use the final results to tune a candidate against this test sample.

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

## Sources and intended use

- Courtesy of the National Library of Medicine. The labels and mappings come from [the official NLM Malaria Cell Images release](https://data.lhncbc.nlm.nih.gov/public/Malaria/index.html). Cite [Rajaraman et al., 2018](https://doi.org/10.7717/peerj.4568). The archive reuse findings and data limits are in the research reports.
- The pretrained checkpoints are [OpenAI CLIP](https://huggingface.co/openai/clip-vit-base-patch32) and [Microsoft BiomedCLIP](https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224). The MIT license materials and model cards describe their licensing and research scope. Both cards put deployed uses out of scope. The prototype uses offline local research inference.
- Python uses PyTorch, Transformers, OpenCLIP, Pillow, and FastAPI/Uvicorn. The Next.js frontend uses React, TypeScript, Tailwind CSS, and Lucide React. Package versions are recorded in the dependency files.
- OpenAI Codex assisted with implementation, audit, evaluation, documentation, and verification. OpenAI image generation produced the landing-page illustration. The original work is the application and research workflow. Pretrained weights, data, and prior research are separately credited.

For research and education only. Use de-identified research or test images. The evaluation concerns cell crops from one public release. Scores are uncalibrated. Do not use the app for diagnosis, treatment, patient care, or patient-level conclusions.

## Deployment and submission

**[Live frontend](https://healthai-lyart.vercel.app/)** — verified public preview. **Hosted AI inference** — unavailable. The prepared laptop runs genuine local inference with the frozen release.

The [official source repository](https://github.com/suhama101/healthai) uses `main` for automatic frontend checks and builds. The standard Next.js build is suitable for Vercel, and `MEDILENS_STATIC_EXPORT=1` generates static files. Set `NEXT_PUBLIC_MEDILENS_API_URL` at build time only for an authorized, reachable HTTPS research backend. An unset value keeps Analyze disabled.

The [restricted-inference plan](docs/restricted-inference.md) records the live checks, hosting comparison, and approval required before connecting an HTTPS backend. The [deployment guide](docs/deployment.md) covers the frozen artifact transfer. The [demo script and pitch outline](docs/submission-demo.md) and [submission checklist](docs/hackathon-checklist.md) cover the offline jury session and the unresolved hosted-prototype requirement.
