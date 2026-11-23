# Local inference service contract

The browser connects to the configured loopback HTTP origin using [lib/inference.ts](../lib/inference.ts). The local FastAPI server loads the pinned checkpoint and the two text embedding sets once at startup. `GET /health` confirms readiness and reports the protocol marker `medilens-clip-v1`, model ID, and checkpoint revision. The workspace checks readiness before enabling Analyze and polls for changes while mounted.

## Requests

Send raw JPEG or PNG bytes to `POST /predict` with `Content-Type: image/jpeg` or `image/png`. The default `class-name` method is the workspace baseline. Use `?method=knowledge-guided` for the separate experimental configuration and paired baseline class. The service limits the body to 10 MiB and the decoded image to 4,096 pixels per edge and 4,194,304 pixels total. It verifies the file and decodes one frame in memory. It accepts one prediction at a time and returns 503 while occupied. A body read has a 15-second deadline. Start the service with one Uvicorn worker bound to loopback.

CORS permits the Next.js development origins `http://localhost:3000` and `http://127.0.0.1:3000`. The client posts only when Analyze is selected and aborts obsolete requests when a selection changes, is cleared, or the workspace unmounts. Aborting the client request does not stop an image already in model computation. The service does not keep or log request images.

## Successful response

| Field | Meaning |
| --- | --- |
| `predictedClass` | `parasitized` or `uninfected` for the input cell crop |
| `method` | `class-name` or `knowledge-guided` |
| `model` | `name` is the checkpoint ID and `version` is the immutable Hugging Face revision |
| `limitations` | Research-use disclaimer and method limitations |
| `scores` | `kind: "model_score"`, label, and two raw image–text cosine similarities in the range from −1 to 1 |
| `baseline` | For a knowledge-guided request, the class-name method's name, version, and class for that same crop |

The frontend validates the response shape and class/method labels before rendering. The API scores are similarities and carry no probability or calibration claim. See the [research report](../research/step-2.md) for prompts, preprocessing, and evaluation scope.

The API returns 408 for a body-read timeout, 413 for an oversized upload, 415 for unsupported media, 422 for a malformed image or invalid method, 503 for an occupied model, and 500 for an inference failure. Browser network failures present a service availability message. The result panel stays empty when a request fails.
