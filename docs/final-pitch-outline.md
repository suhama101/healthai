# MediLens AI five-minute pitch outline

Capital Youth Expo 2026 · Healthcare track. Rehearse for **4:55**, with five seconds of margin under the rulebook cap. The rulebook specifies two minutes of jury Q&A. Confirm the actual slot with the organizer. [Format audit](hackathon-checklist.md#deadlines-and-format)

| Slide and time | Slide focus | Speaker notes and evidence |
| --- | --- | --- |
| 1 · 0:00–0:35 | **The problem** | “Given one prepared thin-smear cell crop, how well can we distinguish the two research classes?” Describe how staining, preparation, and imaging affect apparent morphology. Use a simple smear → field → cell diagram. Ground the problem in the existing microscopy workflow. [WHO microscopy](https://www.who.int/teams/global-malaria-programme/case-management/diagnosis/microscopy) |
| 2 · 0:35–1:15 | **The proposed workflow** | Show crop preparation outside MediLens, de-identified upload, review of a research output, and expert comparison with the reference annotation. Research staff and educators are the proposed first users. Explain where a laboratory researcher would review errors. |
| 3 · 1:15–2:05 | **The working prototype** | Create a fictional case in the Vercel Workspace, preview a synthetic PNG, enter a human observation, set Reviewed, and download the report. Show how to reopen or delete a saved case. Point to the precomputed comparison and the disabled public Analyze control. If the organizer accepts local footage, show it separately and use a cleared crop. |
| 4 · 2:05–2:55 | **CLIP, KPL, and the selected method** | Explain how CLIP compares images and text. The KPL paper motivated the question about domain knowledge. MediLens tested fixed morphology prompts. KPL’s proxy optimization and multimodal proxy learning were outside this implementation. Explain how the frozen encoder’s 512 features feed a ridge classifier fitted on 768 labeled crops. The weaker-class recall criterion on 256 validation crops determined the selection. [KPL paper](https://arxiv.org/abs/2501.11231) · [Protocol](../research/step-3.md) |
| 5 · 2:55–3:40 | **Measured results and errors** | Show 50.00% for class-name CLIP, 50.26% for knowledge-guided CLIP, and 95.05% for selected CLIP + Ridge on the same 384 locked-test crops. Point to 11 missed parasitized crops and eight uninfected crops flagged. BiomedCLIP + Ridge reached 96.61% on the locked test. The pre-test validation choice still governs the demo. |
| 6 · 3:40–4:20 | **Customers and commercial roadmap** | Name teaching and research labs as prospective early users. Explain an authorized paid research pilot as a future commercial test, with no existing customers or revenue claimed. Diagnostic labs and hospital microscopy teams are longer-term prospects. Milestones are rights clearance, independent multisite evidence, secure reviewer workflow, usability testing, and intended-use authorization. |
| 7 · 4:20–4:55 | **Limits, originality, and close** | State the single cell-crop collection, incomplete patient-independence evidence, raw scores, and absence of clinical validation or public inference. Credit NLM, CLIP, BiomedCLIP, KPL, Codex, and the generated illustration. Show the public project links. Distinguish dated team work within the competition window from third-party and earlier work. |

## Q&A prompts

- **Why did the ridge release use CLIP?** Validation weaker-class recall was 89.06% for CLIP ridge and 87.50% for BiomedCLIP ridge. The higher later test accuracy for BiomedCLIP did not change the frozen choice.
- **What is original?** The workspace, local integration, grouped experiment and error audit, release tooling, and method comparison. Cite the timeline and disclose any additional pre-window work before submission.
- **What does the result mean clinically?** It is a binary prediction for one crop in a research workflow. A clinical product would require independent site and patient-level evidence and authorization for its intended use.
- **Where does inference happen?** Only on the prepared local system. Public hosting needs checkpoint rights, fitted-head authorization, hosted verification, and access safeguards.

[Verified results](../research/step-3-results.json) · [Video script](final-demo-script.md) · [Submission checklist](hackathon-checklist.md)
