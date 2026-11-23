# MediLens AI two-minute walkthrough

Capital Youth Expo 2026 · Healthcare Hackathon

| Elapsed time | Screen | Narration |
| --- | --- | --- |
| 0:00–0:16 | Public Vercel home, then Workspace | “MediLens AI asks how well a research model can distinguish parasitized and uninfected cells in thin-smear microscopy crops. The public website lets you explore the project and preview an image. Online analysis is unavailable.” |
| 0:16–0:31 | Local Workspace with Model ready visible | “I’ve switched to the local copy. The original CLIP experiment compared the image with class names and then with descriptions of cell morphology. Both approaches strongly favored one class.” |
| 0:31–0:54 | Browse to a permitted de-identified development crop, preview it, then select Analyze | “This is a permitted research crop. Previewing it keeps it in this browser tab. Analyze sends it to FastAPI on this laptop, where the frozen CLIP encoder and fitted ridge classifier process it.” |
| 0:54–1:12 | Hold on the genuine result panel | “The model returned [read the displayed class]. These are the two raw relative scores [point to both]. The higher score determines the research class. The values have no diagnostic probability interpretation.” |
| 1:12–1:37 | Research cards, comparison bars and confusion matrix | “On the same 384 held-out crops, class names reached 50% accuracy and CLIP ridge reached 95.05%. It missed 11 parasitized crops and flagged eight uninfected crops. We selected it for weaker-class recall on validation. BiomedCLIP ridge scored higher on the later locked test.” |
| 1:37–1:53 | Limitations and Research sources | “This is one public cell-crop collection. The groups were separated using released identifiers, with incomplete verification of patient independence. The system is for research and education and has no clinical validation.” |
| 1:53–1:59 | Research sources and public GitHub | “The public repository documents the method, measured failures and reproducible comparison.” |

## Recording checklist

- Queue tabs in this order. Public Workspace, local Workspace and local Research. Keep the public and loopback addresses visible when switching.
- Verify the local release and start FastAPI and Next.js using the [offline setup](submission-demo.md#before-recording-or-presenting). Confirm `/health` reports `ready`, `clip-ridge` and the pinned CLIP revision before recording.
- Stage the permitted de-identified development crops locally under `.medilens/release/`. Start with `demo-parasitized.png` and keep `demo-uninfected.png` available for rehearsal. Keep private file paths, raw identifiers and unrelated windows out of frame.
- Rehearse the actual upload and Analyze flow, then clear the workspace before capturing a fresh run. Read the class from the live result panel, show the model and both scores, and check the public Workspace still has Analyze disabled.
- Review the exported recording for audible narration, readable labels, accurate hosting disclosure and a runtime under two minutes. Keep the original capture available for the jury demo.

[Verified Step 3 comparison](../research/step-3.md) · [Public frontend](https://healthai-lyart.vercel.app/) · [Public source](https://github.com/suhama101/healthai)
