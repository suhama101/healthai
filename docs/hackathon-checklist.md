# MediLens AI submission readiness

Capital Youth Expo 2026 · Hackathon (Innovation Sprint), 04-HK · Healthcare track

## Deadlines and format

| Source | Published information | How to use it |
| --- | --- | --- |
| [Official Hackathon rulebook, pp. 1–2](https://www.capitalyouthexpo.com/rulebooks/04-hackathon.pdf) | Build window November 16–28, 2026. Submission due November 28 at 11:59 PM. December 2 finale, with at most five minutes for the presentation and two minutes for jury Q&A. | Use the five-minute format for rehearsal pending confirmation. The rulebook does not print a timezone next to the cutoff. |
| [Hackathon Hub listing](https://hh.etlonline.org/competitions/hackathon-innovation-sprint-competition-cye-2026-mwihw2ix) | Timeline displays November 28 at 6:59 PM. The published page data gives `submissionEnd = 2026-11-28T18:59:00.000Z`, equivalent to **November 28 at 11:59 PM Pakistan time**. The listing’s prose also says 11:59 PM. Its overview says 20 minutes plus 10 minutes of Q&A, while the judging section refers to a five-minute pitch. | The two displayed submission times resolve to the same instant when the timestamp is converted. Confirm the exact submission route and enforced cutoff for the registered Healthcare team before relying on it. Confirm the stage format separately. |
| [Expo homepage](https://www.capitalyouthexpo.com/) and [Hackathon Hub registration timeline](https://hh.etlonline.org/competitions/hackathon-innovation-sprint-competition-cye-2026-mwihw2ix) | The Expo homepage advertises a **November 22 registration deadline** without a time. The Hub displays **November 26 at 6:59 PM** for Hackathon registration. The underlying UTC timestamp converts to **November 26 at 11:59 PM Pakistan time**. | These are registration notices with different dates and possibly different scopes. Confirm which applies to the team if registration status is uncertain. Neither notice is the project-file cutoff. |

No later submission cutoff or extension was verified. Ask the [Hackathon focal person](https://www.capitalyouthexpo.com/competitions) to confirm in writing the registered team’s submission portal and cutoff in Pakistan time, the arrival and pitch instructions, and whether the public precomputed demo plus a separately labeled local inference demonstration satisfies the working-live-link requirement.

## Submission items

| Item | Status | Final check |
| --- | --- | --- |
| Public GitHub | Public source, methods, results, and README with the workflow and AI-assistance disclosure. | Verify the submitted GitHub link and release checks in a signed-out browser. [Public repository](https://github.com/suhama101/healthai) |
| Working live link | The laboratory MVP provides fictional case creation, image preview, saved human observations and review status, and PDF download on the public Workspace. The research comparison remains precomputed. | Rehearse the full workflow on the public URL and confirm organizer acceptance of the demo format. Use a separately labeled segment if showing local inference. [Existing Vercel Workspace](https://healthai-lyart.vercel.app/workspace#demo-cases) |
| Genuine local inference | The verified frozen API returned the expected class and finite raw scores for both staged development crops in offline rehearsal. These examples are for private rehearsal. | Use a cleared crop for the actual audience. Use the public-only script if recording or redistributing local material is outside the approval. [Local runbook](submission-demo.md) |
| Recorded walkthrough | Complete script and recording checklist prepared. Video capture and export pending. | Export at **2:00 or less** and check that judges can open it. [Video script](final-demo-script.md) |
| Slide deck | Five-minute, seven-slide outline prepared. Deck file pending. | Export PDF or PPTX and inspect fonts, figure readability, references, disclosures, and links. [Pitch outline](final-pitch-outline.md) |
| Originality | Dated Git timeline, prior-work credits, and disclosure draft prepared. | Team must confirm actual work dates, disclose any pre-window team work, and verify registered members and Healthcare track. The rulebook requires the core workflow and integration to be built during November 16–28. [README disclosure](../README.md#originality-and-ai-assistance) |
| AI and dependency disclosure | Draft includes Codex assistance, the generated homepage illustration, NLM data, pretrained models, prior research, software packages, and external services. | Include it in the submitted README and credits slide. [README credits](../README.md#sources-and-intended-use) |
| Portal delivery | Pending exact route and cutoff confirmation. | Test links while signed out, submit the final file set, save the receipt, and freeze major feature work at the applicable cutoff. |

## Release and recording checks

- Only the credited generated illustration ships as a public image asset. Keep the public sample allowlist empty until image rights and stored-result clearance are verified. Keep private model files, the dataset, and per-image outputs out of the repo and submission files.
- Read metrics directly from the locked report. The 95.05% result applies to supervised CLIP + Ridge on 384 cell crops from one collection. KPL is prior research. The public site does not compute predictions.
- Make the live URL, clear local-only inference label, uncalibrated score label, and research-only notice readable in the recording and deck. Remove personal details, paths, and any images whose presentation is outside authorized use.
- Confirm the finale slot and rehearse the five-minute pitch and Q&A. The rulebook asks finalists to report at least 15 minutes before their slot.

**Next action.** Send one written confirmation request to the organizer covering the Healthcare team’s exact cutoff and portal, acceptance of the public-plus-local demo format, and the finale timing.
