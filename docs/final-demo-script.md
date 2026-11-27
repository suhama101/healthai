# MediLens AI video walkthrough

Capital Youth Expo 2026 · Healthcare track · Target **1:55**, including the closing card. Use the public-only segment by default. Substitute the local segment only if the exact crop and its result are cleared for the intended recording audience, including any organizer reuse.

| Time | Screen action | Say |
| --- | --- | --- |
| 0:00–0:15 | Show the public Vercel address. Select **Try the Demo**, then **Demo cases**. | “MediLens AI is a laboratory workflow prototype for reviewing research images. This is the public site. The case workflow runs in this browser.” |
| 0:15–0:34 | Create a case. Show the generated ID and attach a synthetic non-medical PNG. | “The browser creates a fictional case ID and timestamp. I’m attaching a synthetic image. Its preview stays in this browser.” |
| 0:34–0:50 | Under **Human Review**, enter a short fictional observation. Select **Reviewed**, save, and choose **Download Report**. | “These are my observations. I’ll mark the case Reviewed and save it. The PDF records the notes and review status. AI analysis is unavailable for this case.” |
| 0:50–1:15 | Use one segment below. | Use its matching narration. |
| 1:15–1:42 | Open **Technology & Validation**. Show the benchmark summary and expand **Per-class results and confusion matrix**. | “The selected model reached 95.05 percent on 384 held-out cell crops. It missed 11 parasitized crops and flagged eight uninfected crops. The benchmark used one public collection. Independent studies are needed before clinical use.” |
| 1:42–1:55 | Show the research-only notice and a readable end card with the project and repository. | “MediLens is for research and education. The source documents the methods, their limitations, and the pretrained models, data, and AI assistance we used.” |

### 0:50–1:15 public-only segment

Show the report briefly, then reload the site to show the case remains. Say “The saved case reopens after a refresh. This report is for research only. On Technology and Validation, we explain what the benchmark tested and where its evidence ends.”

### 0:50–1:15 optional genuine local inference segment

Use the development server’s **Local model demo** at `/workspace/local-model` in a separate browser window. Show the loopback URL and keep the overlay **Local inference on this laptop** visible for the entire clip. Preload the cleared crop in preview, click **Analyze** in the recorded take, and show the returned class, model name, and raw scores. Say “I’ve switched to the local model demo. Analyze sends this cleared crop to FastAPI on this laptop. Frozen CLIP and ridge have just returned [read the class on screen]. These are raw scores. Online inference remains disabled on our public site.”

## Recording and delivery checklist

- Use a clean browser profile with notifications off and readable zoom. Check Home, Workspace, and Technology & Validation immediately before recording. Rehearse case creation, a synthetic image upload, save, and PDF download. Use only fictional details in the public recording.
- For local footage, verify the exact release and warm the laptop using the [local runbook](submission-demo.md#before-recording-or-presenting). Keep the pinned revision, model-ready state, and loopback address legible. Confirm the expected method in rehearsal.
- Verify permission for the crop and its presentation in the exported clip. Keep local-only development images, dataset identifiers, filenames with identifiers, credentials, private paths, and unrelated windows out of the recording. Use the public-only segment if any approval is missing or the model is unavailable. Keep local demonstration images out of the public submission files.
- Record the actual result in one take. Clearly label any genuine prerecorded local take if replayed live. Read only what the panel actually displays. Avoid showing or implying diagnostic probabilities.
- Caption the split between public and local footage. Play back the exported artifact and verify readable text, intelligible audio, and a complete runtime of **2:00 or less**. Open the submitted video link in a signed-out browser or check the uploaded file as the jury will receive it.

[Public frontend](https://healthai-lyart.vercel.app/) · [Source](https://github.com/suhama101/healthai) · [Research results](../research/step-3.md)
