# Hackathon submission checklist

The CYE competition rulebook requires a working live link for web or cloud projects, a walkthrough of at most two minutes, and a slide deck in PDF or PPTX. The finale format is a five-minute maximum pitch and two minutes of jury Q&A. The submission deadline is November 28, 2026 at 11:59 PM Pakistan time. [Official CYE Hackathon rulebook](https://www.capitalyouthexpo.com/rulebooks/04-hackathon.pdf)

- [x] **Public GitHub.** Source and README accessible. [Official GitHub repository](https://github.com/suhama101/healthai)
- [x] **Online frontend.** Vercel frontend available in preview-only mode. [Live frontend](https://healthai-lyart.vercel.app/)
- [x] **Offline genuine AI inference.** The pinned CLIP encoder and fitted ridge head run on the local FastAPI service. [Offline setup](submission-demo.md#before-recording-or-presenting)
- [ ] **Hosted real inference.** Unavailable. A working live prototype still requires evidence of authorized hosted inference or organizer acceptance of the public preview with a genuine offline jury demo. [Restricted inference notes](restricted-inference.md)
- [ ] **Recorded walkthrough.** Pending capture and export from a genuine local session. [Timed walkthrough script](final-demo-script.md)
- [ ] **Slide deck.** Pending creation and export as PDF or PPTX. [Seven-slide pitch outline](final-pitch-outline.md)
- [ ] Rehearse the pitch and Q&A. [Timing and jury questions](final-pitch-outline.md)
- [ ] Include NLM, OpenAI CLIP, Microsoft BiomedCLIP, prior KPL research, software and artwork credits. Disclose OpenAI Codex assistance with implementation, verification and documentation. Describe the original implementation and research workflow. [Project credits](../README.md)
- [ ] Include the research-only disclaimer, uncalibrated-score labels, scope of group separation, and absence of external or clinical validation.

## Offline handoff

1. Before leaving, run `python -m backend.release_assets verify` with the project Python environment. Keep the user-owned private release bundle and pinned cached weights available on the machine. Stage two permitted de-identified public research crops locally, one per label. Use development crops referenced by the local Step 3 development manifest, or other images permitted for this demo.
2. Start the backend and frontend with the [README commands](../README.md). Set `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, and `MEDILENS_VERIFY_RELEASE=1` before launching the API. Use the existing package cache or install dependencies before arriving.
3. Open `http://127.0.0.1:8000/health`. Confirm it shows ready, `clip-ridge`, and the frozen CLIP revision. Open `http://127.0.0.1:3000/workspace`, choose a permitted crop, and select Analyze.
4. Point out the research class, named supervised method, both raw scores, and limitations. Demonstrate another crop and explain a measured error example from the research report.
5. If venue Wi-Fi fails, continue on loopback. If the process stops, restart it using the cached assets and wait for health readiness. Keep the pre-recorded walkthrough and the report available for a machine failure.

The submission risk is the hosted prototype URL. A source repository or UI-only preview does not demonstrate hosted inference. Ask the organizers to approve a live offline jury session plus the public source, verified test report, and clearly labeled recording if no authorized hosted endpoint is available.
