# MediLens AI submission demo

Deadline **November 28, 2026 at 11:59 PM Pakistan time**.

## Before recording or presenting

Keep the pinned CLIP cache, the private fitted-artifact bundle, and permitted de-identified development crops on the laptop. This prepared checkout has two such crops under `.medilens/release/` named `demo-parasitized.png` and `demo-uninfected.png`. Verify the frozen cache, then start FastAPI and Next.js in separate PowerShell terminals.

```powershell
.\.venv\Scripts\python.exe -m backend.release_assets verify
$env:HF_HUB_OFFLINE = '1'
$env:TRANSFORMERS_OFFLINE = '1'
$env:MEDILENS_VERIFY_RELEASE = '1'
.\.venv\Scripts\python.exe -m uvicorn backend.api:app --host 127.0.0.1 --port 8000 --no-access-log
```

```powershell
$env:NEXT_PUBLIC_MEDILENS_API_URL = 'http://127.0.0.1:8000'
npm.cmd run dev -- --hostname 127.0.0.1
```

Confirm that `http://127.0.0.1:8000/health` returns ready, method `clip-ridge`, and revision `3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268`. Open `http://127.0.0.1:3000/workspace`. If the backend stops, restart it with the same cached files, wait for health readiness, and retry. Loopback works without event Wi-Fi. Use a clearly labeled recording if the laptop cannot run the live session.

## Two-minute walkthrough script

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:15 | Home page and research-use notice | “MediLens AI is our Healthcare Hackathon research prototype for classifying cropped microscopy cell images. This demo runs a real model on the laptop.” |
| 0:15–0:30 | Local health response, then Workspace | “The response shows the frozen model is ready. Analyze becomes available only when the service is ready and an image is selected.” |
| 0:30–1:05 | Choose a permitted development crop. Pause on its preview, then select Analyze and show the generated result. | “The preview stays in the browser. Selecting Analyze sends this crop to the local FastAPI service. Here is the method, the class it returned, and its two uncalibrated model scores.” |
| 1:05–1:25 | Show the lock and evaluation summary | “The original class-name CLIP baseline scored 50% on the locked comparison. The supervised ridge method reached 95.05% on the same 384 crops, with 94.27% parasitized recall and 95.83% uninfected recall.” |
| 1:25–1:45 | Replace the crop and analyze again. Read the actual output. | “The encoder stays frozen. The small ridge head learned from labeled development crops. We selected the method on validation before opening the locked test.” |
| 1:45–2:00 | Show limitations and the GitHub source | “These results are from one public cell-crop collection. This is research and education only. The source and reproducible analysis are on GitHub.” |

If showing a hosted frontend preview as well, say that its local image preview works and online inference is unavailable. Keep the recording under two minutes.

## Five-minute pitch outline

| Time | Topic | Evidence |
| --- | --- | --- |
| 0:00–0:35 | Research question | Can an accessible workspace support reproducible comparison of parasitized and uninfected cell-crop classifiers? The unit of analysis is one crop. |
| 0:35–1:20 | Why change the baseline | The raw class-name CLIP prompts favored one class throughout the locked comparison. Matching the native cosine computation ruled out a class-order or similarity-extraction error in the audited path. |
| 1:20–2:05 | Method and split | Frozen CLIP extracts 512 normalized visual features. A supervised, regularized linear ridge head was fitted on 768 labeled development crops with penalty 0.001. Validation used 256 separate crops and selected CLIP ridge by weaker-class recall. The locked test used 384 crops across 32 newly reserved groups. |
| 2:05–3:05 | Genuine demonstration | Run the prepared local Workspace flow and show the actual result. Explain the uncalibrated scores and upload boundary. |
| 3:05–4:10 | What the test showed | CLIP ridge reached 95.05% accuracy with 11 false negatives and 8 false positives. BiomedCLIP ridge reached 96.61% on the locked sample. The released method stays with the selection made on validation. |
| 4:10–5:00 | Originality, limits and release | Show the original workflow, evaluation, and release tooling. Credit NLM, pretrained models, and AI coding assistance. Clarify the single dataset, group-level separation, research-only use, and actual hosting status. |

The ridge head is supervised because its coefficients were fitted from labeled crops. KPL remains future research. Prepare for Q&A on group leakage, why the model selection was locked, and what an external test would need to establish.

[Verified Step 3 report](../research/step-3.md) · [Submission checklist](hackathon-checklist.md) · [Official source](https://github.com/suhama101/healthai)
