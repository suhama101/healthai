# Local inference service contract

The browser uses an exact configured loopback HTTP or approved HTTPS origin. When `MEDILENS_VERIFY_RELEASE=1`, startup verifies all release artifacts against the frozen lock before loading the model and completing a warm-up. `GET /live` returns a liveness status once the HTTP server is serving. `GET /health` returns `status: "ready"`, protocol `medilens-clip-v1`, checkpoint identity, default `method`, and loaded `methods`. The workspace requires readiness for the frozen checkpoint revision and `clip-ridge`, plus a valid image, before enabling Analyze.

Send raw JPEG or PNG bytes to `POST /predict` with the matching Content-Type. The default is the validation-selected method. An explicit `?method=...` is accepted only for methods listed in health. The same endpoint and response keys from Step 2 remain available. Method availability depends on the loaded backbone.

| Response field | Meaning |
| --- | --- |
| `predictedClass` | `parasitized` or `uninfected` for the cell crop |
| `method` | Stable identifier for the fitted head or prompt method |
| `model` | Pretrained checkpoint ID and immutable revision |
| `scores` | Two uncalibrated model scores. The label identifies cosine similarity or the supervised ridge score. |
| `limitations` | Research-only use, task scope, and score limitations |
| `baseline` | Optional paired comparison for the legacy CLIP knowledge-guided method when loaded |

The server accepts one in-memory prediction at a time. Request bodies are limited to 10 MiB and 15 seconds of reading. Decoded images are limited to 4,096 pixels per edge and 4,194,304 pixels total. The service validates type and bytes and decodes one frame. Timeouts, oversized bodies, unsupported media, invalid images or methods, and occupied models receive 408, 413, 415, 422, and 503 respectively. Inference errors return 500 without printing image data. The workspace presents an error instead of a prediction when analysis fails.

The local server binds to loopback and defaults to development origins `http://localhost:3000` and `http://127.0.0.1:3000`. Hosted configuration requires exact host and origin allowlists and an authorized private access gateway. Unapproved browser origins receive 403 on prediction requests. Upload transmission starts when Analyze is selected. Images are processed in memory without persistence or image logs. Clearing, replacing, or leaving the workspace cancels the browser request. In-flight native computation can finish afterward. Only the research label order and fitted parameters are present in live inference. Evaluation manifests and labels are used by the offline evaluation commands.
