# Restricted online inference

## Release status

The public HTTPS frontend is [MediLens AI on Vercel](https://healthai-lyart.vercel.app/). The frozen classifier works through the offline loopback API. There is no verified hosted inference endpoint. Keep the Vercel API variable unset until the hosted release passes the checks below.

Frozen OpenAI CLIP ViT-B/32 at `3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268` extracts features for the supervised ridge head. The unchanged Step 3 result is 95.05% accuracy, 94.27% parasitized recall and 95.83% uninfected recall on 384 cell crops. Scores are uncalibrated. Use only authorized de-identified research images. The service processes the request in memory and has no image storage. [Research report](../research/step-3.md) · [HTTP contract](inference-contract.md)

## Release decision

The OpenAI CLIP software is MIT-licensed. The pinned Hugging Face listing carries no separate weight-license notice and its model card places deployed uses outside its intended scope. Treat a restricted educational jury endpoint as a proposed deployment and obtain confirmation that the intended usage is covered before running it. Authentication protects access to the service. It does not establish model-use clearance or clinical readiness. The verified fallback remains the laptop's loopback demo. [Pinned model files](https://huggingface.co/openai/clip-vit-base-patch32/tree/3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268) · [Model card](https://huggingface.co/openai/clip-vit-base-patch32) · [CLIP software license](https://github.com/openai/CLIP/blob/main/LICENSE)

## Hosting assessment

Indicative USD list prices checked on November 24, 2026. Existing entitlements, regional pricing, storage and egress can affect actual costs.

| Option | CPU, memory and cost | Availability, cache and access |
| --- | --- | --- |
| Existing authorized private Linux VM | Start with 4 vCPUs, 4 GiB RAM and 2 GiB dedicated release-cache space. Incremental cost depends on existing allocation. | Preferred hosted target if cleared. One warm Docker worker uses a read-only persistent cache. A private HTTPS ingress with network-level authentication lets the existing frontend call it without embedding credentials. |
| Hugging Face Docker Space | CPU Basic provides 2 vCPUs and 16 GB RAM at zero hourly compute cost. Creating a compute Space on CPU Basic requires a qualifying plan. Individual PRO lists $9/month. | CPU Basic sleeps after 48 idle hours and its default 50 GB disk is ephemeral. A private Space restricts the running app to authorized collaborators. A protected Space still exposes the app URL publicly. Browser authentication and private artifact staging require a verified integration. |
| Render Docker service | Standard lists 1 CPU and 2 GB at $25/month. The 2 CPU and 4 GB plan is $85/month plus $0.25/GB/month for disk, about $85.50 with 2 GB. Free compute provides 512 MB. | Free capacity is below the measured Windows footprint and has no persistent disk. Paid compute can stay warm with a persistent disk. Use a private service and compatible HTTPS access gateway. Validate latency on the chosen CPU. |
| Google Cloud Run | At 4 vCPUs and 4 GiB, the example request-based rate is about $0.106 per 1,000 active seconds before storage, egress, free allowances, requests and warm idle charges. An active billing account is required even for the free tier. | Docker and managed HTTPS are supported. Private IAM service, private artifact access and a browser-compatible ingress are required. The instance startup deadline is four minutes. Scale-to-zero can delay the demo, so authorize and price a warm instance separately. |

[Hugging Face compute and visibility](https://huggingface.co/docs/hub/en/spaces-overview) · [Spaces sleep policy](https://huggingface.co/docs/hub/en/spaces-gpus) · [Hugging Face pricing](https://huggingface.co/pricing) · [Render pricing](https://render.com/pricing) · [Render free limits](https://render.com/docs/free) · [Cloud Run pricing](https://cloud.google.com/run/pricing) · [Cloud Billing requirements](https://docs.cloud.google.com/free/docs/free-cloud-features) · [Cloud Run startup limits](https://docs.cloud.google.com/run/docs/container-contract)

The preserved local release previously took 34.31 seconds to become ready and recorded 147.8 ms median warm loopback latency. Step 3 measured 886 MiB peak working set for the selected backbone. These are Windows measurements. Re-check cold readiness and warm prediction on the chosen Linux host. The three-second browser readiness deadline makes a warm service important at judging.

## Conditional configuration for an approved host

1. Confirm checkpoint-use clearance, host access and permission to publish the backend DNS name in the Vercel bundle. If the host requires a new account, payment or setup approval, obtain it first.
2. Install the pinned runtime from the [deployment guide](deployment.md) and stage the eight official CLIP assets using `python -m backend.assets model`. Transfer the exact fitted-head bundle through the approved private channel. On the host, set `MEDILENS_RELEASE_CACHE` to an absolute release-only directory outside the source tree. In that shell, run:

   ```sh
   python -m backend.release_assets install /path/to/private/medilens-step3-head.zip --cache "$MEDILENS_RELEASE_CACHE"
   mkdir -p "$MEDILENS_RELEASE_CACHE/model"
   for file in config.json merges.txt preprocessor_config.json pytorch_model.bin special_tokens_map.json tokenizer.json tokenizer_config.json vocab.json; do
     cp ".medilens/model/$file" "$MEDILENS_RELEASE_CACHE/model/$file"
   done
   python -m backend.release_assets verify --cache "$MEDILENS_RELEASE_CACHE"
   ```

   Give container UID 10001 read and directory traversal access to that dedicated cache using the host's approved permission mechanism. The live cache needs just `model/` and `step3/`. Keep the dataset, local logs and evaluation manifests outside it.
3. Set `MEDILENS_RESTRICTED_HOST` to the real gateway hostname only, with no scheme or port. Run `docker compose -f compose.research.yml config --quiet`, then `docker compose -f compose.research.yml up --build -d`. The single non-root container verifies the release and warms before health is ready. The host port stays on `127.0.0.1:8000`, and the read-only cache is mounted at `/app/.medilens`. Use an existing approved private HTTPS gateway to proxy it and preserve the approved HTTP Host header. A restricted mesh VPN with device or user ACLs is one compatible architecture. CORS is an additional browser control. It supplies no authentication.
4. From the approved jury network, check the real HTTPS certificate and `GET /health` for the locked revision and `clip-ridge`. Verify an authorized de-identified crop through `POST /predict`, malformed or oversized rejection, rejected unknown Origin, and busy or interrupted service behavior. Verify from outside the approved network that both health and inference are unreachable or denied. Review gateway logging and retention settings so they exclude images and identifiers.
5. In the existing MediLens AI Vercel project, set Production `NEXT_PUBLIC_MEDILENS_API_URL` to the verified HTTPS origin only and redeploy. The browser client omits credentials, so a login redirect or cookie-only cross-origin gateway does not work with this release. Exercise the exact browser and jury network before advertising remote inference. Confirm mobile preview, readiness, real scores, and loss of readiness. A public-to-private browser request may require a local-network permission. Do not embed authentication tokens in a `NEXT_PUBLIC_` variable.
6. If access breaks, remove the production variable and redeploy the preview-only build. For judging, use the already staged loopback workflow while the issue is resolved.

[Vercel environment changes](https://vercel.com/docs/environment-variables/managing-environment-variables) · [Example private mesh HTTPS ingress](https://tailscale.com/docs/features/tailscale-serve) · [Chrome Local Network Access](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access) · [Offline walkthrough](submission-demo.md)

## Step 6 verification

Chrome loaded all five routes on the actual Vercel HTTPS origin at 375, 768 and 1440 pixels. The mobile menu navigated to the workspace. A synthetic PNG used a local blob preview. Analyze remained disabled and the browser issued no readiness or prediction requests.

Offline loopback reached readiness in 42.05 seconds in this run. With the live Vercel origin configured in the local CORS allowlist, the preflight succeeded. The frozen API returned parasitized for the permitted parasitized example and uninfected for the permitted uninfected example, with finite raw ridge scores. It returned 422 for malformed PNG input and 403 for an unknown Origin. This check sent the samples to loopback.

Lint, typecheck, the production build and all 19 Python tests passed. Docker Compose rendered the expected configuration with the loopback port and read-only mount, and rejected a missing gateway hostname. The Docker daemon was unavailable for a Linux container build or run. There is no verified hosted backend, and the Vercel API setting remains pending approval and host access.
