# MediLens AI

**A Malaria Cell Classification Research Prototype**

Capital Youth Expo 2026 · Healthcare Hackathon

| Milestone | Date |
| --- | --- |
| Official development window | November 16–28, 2026 |
| Published submission cutoff | November 28, 2026 at 11:59 PM Pakistan time (18:59 UTC). Confirm the Healthcare team’s submission route and any team-specific cutoff. [Deadline audit](docs/hackathon-checklist.md#deadlines-and-format) |
| Finale | December 2, 2026 |

## Hackathon submission

**Problem.** Staining, preparation, and imaging can change how individual red blood cells look in thin blood smears. MediLens AI tests how well different methods distinguish parasitized and uninfected cells in already-segmented crops and makes their errors visible to researchers.

**Proposed laboratory workflow.** A lab researcher or teaching team would acquire a thin-smear image, prepare and de-identify an individual cell crop outside MediLens, preview it, and run an authorized research model. The reviewer would see the crop class, model version, and raw scores and compare the output with microscopy annotations. Today, the inference step runs on the prepared laptop.

| Working feature | What judges can verify |
| --- | --- |
| Laboratory Workspace | Fictional demo cases, browser-local JPEG/PNG preview, saved human observations and review status, and downloadable PDF reports. Analyze Image is disabled and the Analysis Result panel shows its availability. |
| Technology & Validation | A plain-language overview of the held-out 384-crop benchmark and why independent clinical validation is still needed. Expand the technical sections for all seven methods, results, and sources. |
| Local model demo | The offline FastAPI service verifies the cached release, runs the frozen CLIP encoder and fitted ridge head, and displays a genuinely computed crop label and raw scores. The image is sent to the laptop’s loopback API only when Analyze is selected. |

**What we tested.** Standard CLIP used fixed class-name prompts. Knowledge-guided CLIP used fixed descriptions of visible morphology. The supervised pipeline froze the OpenAI CLIP ViT-B/32 encoder, extracted 512 normalized image features, and fitted ridge on 768 labeled development crops. Selection prioritized weaker-class recall on 256 validation crops before the 384-crop locked test. Knowledge Proxy Learning (KPL) is prior research that motivated the prompt comparison. The project does not implement KPL’s proxy optimization or multimodal proxy learning. [Step 2 audit](research/step-2.md) · [Step 3 methodology](research/step-3.md) · [KPL paper](https://arxiv.org/abs/2501.11231)

**Verified results.** On the same 384 locked-test crops, class-name CLIP scored **50.00%**, knowledge-guided CLIP **50.26%**, and validation-selected CLIP + Ridge **95.05%**. The selected model recorded **94.27% parasitized recall** and **95.83% uninfected recall**, with **11 missed parasitized crops and eight uninfected crops flagged**. BiomedCLIP + Ridge reached **96.61%** on the locked test. The demo model remains the one selected on validation. [Research report](research/step-3.md) · [Machine-readable results](research/step-3-results.json)

**Research limits and roadmap.** The benchmark covers cell crops from one public collection. Released groups were separated, while the identifiers could not fully establish patient independence. Raw scores are uncalibrated. Public inference, automated slide segmentation, whole-slide or patient-level reporting, and lab-system integration are future work. The proposed first users are research and teaching labs. A later diagnostic laboratory or hospital product would require cleared model and data rights, independent multisite and clinical validation, a secure reviewer workflow, and authorization for its intended clinical use. MediLens is for research and education only.

### Laboratory workflow MVP

Use the [public case workspace](https://healthai-lyart.vercel.app/workspace#demo-cases) with a current browser. The case workflow runs without a local backend or installation.

1. Open **Workspace → Demo cases** and select **New demo case**. The browser creates a fictional case ID, timestamp, and Draft status.
2. Under **Upload Image**, attach one authorized, de-identified JPEG or PNG and inspect the preview. The **Analysis Result** panel explains that automatic analysis is unavailable. Keep patient identifiers out of text and image pixels.
3. Under **Human Review**, enter observations and an optional fictional title. Choose **Draft**, **Reviewed**, or **Needs Review**, then **Save changes**. Reopen cases from the same browser profile and website origin. Use **Delete case** or **Reset all demo cases** to clear them.
4. Select **Download Report** for a PDF of the saved review, status, timestamps, image information, and research-only disclosures. The report keeps human observations distinct from the unavailable analysis result. Case files stay in the browser.

IndexedDB keeps the notes and a canvas-generated image preview in the browser. The app drops the original filename and embedded file metadata, and reports contain image information without embedding the image. Browser storage is temporary and accessible to people using the same profile. Exported PDFs remain under the visitor’s control after browser deletion. Accounts, shared records, secure patient-data storage, and clinical workflows are outside the MVP. [PDF generation library](https://github.com/bpampuch/pdfmake)

### Originality and AI assistance

- **Pre-existing research and assets.** The NLM dataset, pretrained CLIP and BiomedCLIP encoders, published KPL paper, microscopy references, and software libraries are third-party work. They are credited as inputs. Any earlier team research or code reused in the submission must be listed and dated by the team before submission.
- **Work documented inside November 16–28.** The public Git history starts November 23. It records the frontend, local integration, and evaluation on November 23, and release tooling and the Research dashboard on November 24. The November 27 commit added the public precomputed comparison and preview-only messaging. The November 24 baseline predated that update. Both are inside the published window. Git dates document the recorded history. The team must attest to when the core work was actually produced. [Commit history](https://github.com/suhama101/healthai/commits/main/) · [Public demonstration implementation](https://github.com/suhama101/healthai/commit/115891248bec8b36a42e248531a545d6d3851717)
- **AI assistance.** OpenAI Codex assisted development, research auditing, verification, and documentation. OpenAI image generation produced the credited homepage illustration. The declared team contribution is the workspace, local inference integration, grouped benchmark and model-selection workflow, and presentation of the verified results.
- **Laboratory MVP increment.** Added the fictional case workflow, human review, browser-local image storage and deletion, and PDF export after the existing November 27 research comparison release. OpenAI Codex assisted with implementation, testing, and documentation. The previously published research, frozen release lock, and inference settings were preserved.
- **Step 1 UX revision.** Reorganized the Workspace around image upload, analysis availability, human review, and report download. Moved the interactive comparison and prepared local model demo into Research. OpenAI Codex assisted with UX design, implementation, and verification.
- **Technology & Validation revision.** Reframed `/research` around the limited held-out benchmark and independent clinical validation. Added expandable technical evidence, removed public upload and empty sample controls from the page, and preserved offline rehearsal at `/workspace/local-model`. OpenAI Codex assisted with design, implementation, documentation, and verification.

## Start the prepared local demo

Use Python 3.12 and Node.js 20.19 or later. After the one-time setup below, start the service and frontend in separate PowerShell terminals from the repo root. The running service uses cached weights and the frozen validation lock. It makes no model downloads during prediction.

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

Open `http://127.0.0.1:3000/workspace/local-model` in the development server for this revision. The route requires a loopback API configuration. The local demo enables Analyze after the locked backend is ready and a valid crop is selected. Its result identifies the method and pretrained revision. The local demo sends the crop to the loopback service only when Analyze is selected. The [inference contract](docs/inference-contract.md) covers score labels, limits, errors, and method availability.

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

- Courtesy of the National Library of Medicine. The labels and mappings come from [the official NLM Malaria Cell Images release](https://data.lhncbc.nlm.nih.gov/public/Malaria/index.html). Cite [Rajaraman et al., 2018](https://lhncbc.nlm.nih.gov/LHC-publications/PDF/pub9752.pdf). The archive reuse findings and data limits are in the research reports.
- The pretrained checkpoints are [OpenAI CLIP](https://huggingface.co/openai/clip-vit-base-patch32) and [Microsoft BiomedCLIP](https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224). Their model cards place deployed use outside scope. Coverage for hosting the exact selected CLIP weight file remains unresolved. [Release notes](docs/restricted-inference.md)
- **Libraries and external services.** Next.js, React, TypeScript, Tailwind CSS, and Lucide React power the Vercel frontend. Python uses FastAPI/Uvicorn, PyTorch/torchvision, Transformers, OpenCLIP, Pillow, and NumPy for local inference or research evaluation. The asset tools fetch checkpoint files from Hugging Face and data from NLM for local staging. The public site calls no third-party inference API. Exact dependencies are recorded in [package.json](package.json), [backend requirements](backend/requirements.txt), and [release requirements](backend/requirements-release.txt).

For research and education only. Use de-identified research or test images. The evaluation concerns cell crops from one public release. Scores are uncalibrated. Do not use the app for diagnosis, treatment, patient care, or patient-level conclusions.

## Deployment and submission

**[Live laboratory workflow](https://healthai-lyart.vercel.app/)** — browser-local case management, human review, PDF export, and the precomputed research comparison. **Hosted AI inference** — unavailable. The prepared laptop runs genuine local inference with the frozen release.

The [official source repository](https://github.com/suhama101/healthai) uses `main` for automatic frontend checks and builds. The standard Next.js build is suitable for Vercel, and `MEDILENS_STATIC_EXPORT=1` generates static files. Set `NEXT_PUBLIC_MEDILENS_API_URL` at build time only for an authorized, reachable HTTPS research backend. An unset value keeps Analyze disabled.

The [restricted-inference plan](docs/restricted-inference.md) records the approval required before connecting an HTTPS backend. The [deployment guide](docs/deployment.md) covers the frozen artifact transfer. See the [two-minute walkthrough](docs/final-demo-script.md), [five-minute pitch outline](docs/final-pitch-outline.md), and [submission checklist](docs/hackathon-checklist.md) for the recording, finale, and organizer confirmation still needed.
