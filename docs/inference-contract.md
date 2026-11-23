# Inference service contract

The frontend imports the active adapter from [lib/inference.ts](../lib/inference.ts). The adapter is disconnected in Step 1. The upload component and result renderer depend on the TypeScript contract and can stay in place when the adapter is connected.

## Adapter input

The connected adapter implements `analyze(image: File, signal: AbortSignal): Promise<PredictionResponse>`. It receives a validated JPEG or PNG and a cancellation signal. The workspace aborts obsolete requests when the image is removed or replaced or the workspace unmounts. The adapter should forward the signal into its request and reject on transport, service, or response validation failure. The transport is deliberately left open so the chosen inference deployment can define the final endpoint. Keep any service credentials on the server.

## Successful result

| Field | Meaning |
| --- | --- |
| `predictedClass` | `parasitized` or `uninfected` for the selected cell crop |
| `model` | Human-readable model name and reproducible version |
| `limitations` | Text describing constraints relevant to the result |
| `scores` | Optional record of finite scores for both classes with semantics below |
| `baseline` | Optional baseline name, version, and class for the same image |

For `calibrated_probability`, return probabilities from 0 to 1 that sum to approximately 1 and identify the evaluated calibration method. For `model_score`, give the metric a clear label, such as cosine similarity, and return raw values. Omit scores when their semantics are unavailable. The renderer displays raw scores as numbers and calibrated probabilities as percentages.

## Requirements before connection

- Validate response shape and class labels at runtime before returning `PredictionResponse`; TypeScript alone does not validate external JSON.
- Validate request type, signatures, byte count, and decoded dimensions again at the server. Document model preprocessing and support the same file types as the browser.
- Configure a verified model endpoint, request timeouts, predictable errors, and the data handling policy. Keep the disconnected adapter active until those checks pass.
- Before enabling requests, explain where images are sent and how long they are retained. Use only de-identified research or test images.
- Exercise the contract with authentic model responses and record the evaluation and calibration decisions in the research documentation.
