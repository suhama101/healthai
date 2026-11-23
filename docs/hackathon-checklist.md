# Hackathon submission checklist

- [ ] Confirm the public source URL and README from a signed-out browser. [Official GitHub repository](https://github.com/suhama101/healthai)
- [ ] Provide an approved deployed prototype URL when available. Confirm the requirement and the permitted local or restricted fallback with the organizers if a hosted inference URL is unavailable.
- [ ] Record a walkthrough of up to two minutes from a real local session. Label the recording as a recording and identify whether any linked web preview has live inference.
- [ ] Export the presentation as PDF or PPTX. Include the research question, frozen model, split audit, measured results, licensing and accuracy limits, and an architecture slide.
- [ ] Rehearse the five-minute pitch and two-minute Q&A. Keep an explanation of the distinction between supervised ridge and KPL, the held-out comparison, and false-negative examples.
- [ ] Include NLM, CLIP, BiomedCLIP, software, artwork, and AI-assistant credits. Describe the original implementation and research workflow.
- [ ] Include the research-only disclaimer, uncalibrated-score labels, scope of group separation, and absence of external or clinical validation.

## Offline handoff

1. Before leaving, run `python -m backend.release_assets verify` with the project Python environment. Keep the user-owned private release bundle and pinned cached weights available on the machine. Stage two permitted de-identified public research crops locally, one per label. Use development crops referenced by the local Step 3 development manifest, or other images permitted for this demo.
2. Start the backend and frontend with the [README commands](../README.md). Set `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, and `MEDILENS_VERIFY_RELEASE=1` before launching the API. Use the existing package cache or install dependencies before arriving.
3. Open `http://127.0.0.1:8000/health`. Confirm it shows ready, `clip-ridge`, and the frozen CLIP revision. Open `http://127.0.0.1:3000/workspace`, choose a permitted crop, and select Analyze.
4. Point out the research class, named supervised method, both raw scores, and limitations. Demonstrate another crop and explain a measured error example from the research report.
5. If venue Wi-Fi fails, continue on loopback. If the process stops, restart it using the cached assets and wait for health readiness. Keep the pre-recorded walkthrough and the report available for a machine failure.

The submission risk is the hosted prototype URL. A source repository or UI-only preview does not demonstrate hosted inference. Ask the organizers to approve a live offline jury session plus the public source, verified test report, and clearly labeled recording if no authorized hosted endpoint is available.
