# MediLens AI submission demo

For submission timing and the permitted demo format, see the [deadline audit](hackathon-checklist.md#deadlines-and-format).

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

Confirm that `http://127.0.0.1:8000/health` returns ready, method `clip-ridge`, and revision `3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268`. In the Step 1 revision, open `http://127.0.0.1:3000/research#upload-preview` for the Local model demo. If the backend stops, restart it with the same cached files, wait for health readiness, and retry. Loopback works without event Wi-Fi. Use a clearly labeled recording if the laptop cannot run the live session.

## Before showing local inference

Keep the loopback address and a local-inference label visible. Use only crops permitted for the intended viewing audience. The two staged files are for private rehearsal. Public redistribution clearance has yet to be verified. Use the public-only segment in the [recording script](final-demo-script.md) if the crop or footage lacks clearance.

[Two-minute recording script](final-demo-script.md) · [Five-minute pitch outline](final-pitch-outline.md) · [Submission checklist](hackathon-checklist.md)
