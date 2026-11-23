# Release and deployment

## Frozen release

The verified model is **CLIP Image Encoder + Supervised Ridge Classifier**. It uses OpenAI CLIP ViT-B/32 at revision `3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268`. The unchanged Step 3 reference results are 95.05% accuracy, 94.27% parasitized recall, and 95.83% uninfected recall on 384 locked crops. The fitted head was trained on 768 development crops, with 512 normalized image features and ridge penalty 0.001. The [release lock](../backend/release-lock.json) records image preprocessing, runtime versions, the original development manifest fingerprint, and expected SHA-256 values for every required file. [Original Step 3 report](../research/step-3.md)

The two release artifacts are `.medilens/step3/selection.json` and `.medilens/step3/clip-head.json`. The exact head SHA-256 is `01189869ca5b57b48fd16ac82ff711b5ac77687df257c14fa62d60514b2e79ca`. The bundle does not contain images, data manifests, weights, BERT assets, or credentials. Keep the bundle in the project owner's private storage and transfer it only for an approved research use. The ZIP generated for this release has SHA-256 `4e962ee824054b445fc76ce9668d55299cd7588fc1cdc575d4c7318e62b258f8`.

Create the bundle from the verified machine.

```powershell
.\.venv\Scripts\python.exe -m backend.release_assets pack .medilens/release/medilens-step3-head.zip
```

On a fresh machine, create the venv with Python 3.12.10 and install the frozen runtime. Retrieve the approved private copy of the bundle and download the pinned official CLIP assets once during setup.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install torch==2.14.0+cpu torchvision==0.29.0+cpu --index-url https://download.pytorch.org/whl/cpu --no-deps
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-release.txt
.\.venv\Scripts\python.exe -m backend.assets model
.\.venv\Scripts\python.exe -m backend.release_assets install .medilens/release/medilens-step3-head.zip
.\.venv\Scripts\python.exe -m backend.release_assets verify
```

This path transfers the exact fitted coefficients from the verified run. Re-fitting from the development manifest is a separate research reproduction. A re-fit is the same release artifact only if both frozen file digests match. The official NLM dataset, Step 3 split files, BiomedCLIP, and held-out test labels are unnecessary on an inference host.

## Model and data usage

| Context | Release decision |
| --- | --- |
| Local researcher demo | Use the verified offline loopback service and de-identified, permitted research crops. |
| Restricted jury demo | Demonstrate locally on the prepared machine. Obtain explicit scope and access approval before offering an externally hosted URL, including a private URL. |
| Public inference | Keep disabled pending confirmation that the checkpoint's applicable terms and intended-use guidance cover the proposed deployment, plus independent validation and privacy controls. |
| Public source | Publish the audited application code and aggregate benchmark. Keep model files, fitted artifacts, data images, and private configuration outside Git. |

The [OpenAI CLIP model card](https://huggingface.co/openai/clip-vit-base-patch32) describes general deployed use as out of scope and positions the checkpoint as a research output. The [CLIP software's MIT license](https://github.com/openai/CLIP/blob/main/LICENSE) and checkpoint intended-use guidance address different questions. The pinned checkpoint listing does not provide a separate weight license notice. The compared [BiomedCLIP model card](https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224) likewise puts deployed uses out of scope.

Courtesy of the National Library of Medicine. Cite Rajaraman et al. (2018), *Pre-trained convolutional neural networks as feature extractors toward improved malaria parasite detection in thin blood smear images*, PeerJ 6:e4568. The paper carries a public-domain dedication. The official ZIP listing does not show a separate archive-specific license. Follow the NLM attribution and no-endorsement requirements and verify applicable rights before redistributing any images or raw data. The supplied local demo uses official research copies. [Official dataset](https://data.lhncbc.nlm.nih.gov/public/Malaria/index.html) · [Dataset paper](https://doi.org/10.7717/peerj.4568) · [NLM terms](https://www.nlm.nih.gov/databases/download.html)

## Deployment configuration

The browser renders the Next.js interface. When a valid JPEG or PNG has been selected and `GET /health` advertises the exact release method and revision, Analyze sends the file to FastAPI. FastAPI verifies the image, acquires one inference slot, runs the frozen encoder and ridge head, and returns the two uncalibrated relative scores. The browser and service use no database. The API keeps request images in memory and startup loads the model once per worker. [HTTP contract](inference-contract.md)

### Frontend and GitHub builds

The production branch is `main` in the [official GitHub repository](https://github.com/suhama101/healthai). GitHub Actions runs lint, typecheck, the normal Next.js build, and the static export on pushes and pull requests. To configure Vercel after access is available, import that repository, choose Next.js with the repository root, and use `main` as the production branch. Set `NEXT_PUBLIC_MEDILENS_API_URL` at build time only for a real, approved HTTPS inference origin. Leave the variable unset for any UI-only preview. Analyze will remain disabled and decline image transmission. A UI-only preview has no live online inference. [Vercel Git deployments](https://vercel.com/docs/git)

For a static host, set `MEDILENS_STATIC_EXPORT=1` before `npm run build` and serve `out/`. The export uses directory-style routes and unoptimized bundled artwork. Vercel's normal Next.js build can serve the same pages without that flag. [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)

### CPU backend and access boundary

Start with one worker, 4 vCPUs, 4 GiB RAM, and at least 2 GiB persistent artifact space. The verified Windows run used about 886 MiB peak process working set. The 605 MB CLIP checkpoint and the private bundle must be staged before startup. The container reads a bind-mounted cache, runs offline in release verification mode and starts the one worker only after integrity checks and warm-up. The API exposes `/live` and `/health`, with HTTP readiness after lifespan startup completes. Configure health checks with an allowed Host header.

```powershell
docker build -t medilens-research .
$cache = (Resolve-Path .medilens).Path
docker run --rm --cpus 4 --memory 4g -p 127.0.0.1:8000:8000 --mount "type=bind,source=$cache,target=/app/.medilens,readonly" medilens-research
```

For an approved restricted ingress, configure exact comma-separated `MEDILENS_ALLOWED_HOSTS` and `MEDILENS_ALLOWED_ORIGINS`, set the matching HTTPS frontend endpoint, and enforce access outside FastAPI through an authorized private network or gateway. CORS controls browser origins. Authentication and network access controls must be enforced separately. The frontend does not send cross-origin login credentials. A gateway that requires those credentials will need an explicitly authorized same-origin proxy or another compatible private access pattern. The generic Dockerfile does not provision a host, authentication, TLS, or storage.

### Hosting comparison

Indicative US list prices checked during release preparation. Exact regional charges, taxes, usage, and billing eligibility vary. No paid hosting was provisioned.

| Target | Capacity and costs | Startup, storage, HTTPS, and timeouts |
| --- | --- | --- |
| Prepared laptop or approved existing private VM | Laptop has no incremental hosting charge. For a VM, start with 4 vCPUs, 4 GiB RAM and a 2 GiB persistent cache. | Keep one worker warm and pre-stage verified assets. Loopback works without Wi-Fi. Any hosted access needs an approved TLS and access gateway. The app uses a 15 s body-read limit and a 30 s browser deadline. |
| Render paid Docker web service | Published 2 CPU / 4 GB plan is $85/month. A 2 GB disk at $0.25/GB/month gives about $85.50/month before other charges. The 1 CPU / 2 GB option is $25/month and needs a fresh load and latency test. | Paid disks persist across deploys when the model path is correctly mounted. Use startup health checks and managed TLS. Render publishes a 100-minute HTTP response ceiling. The shorter browser and API deadlines still apply. Free web services have 512 MB RAM, no persistent disk, and sleep after 15 idle minutes. |
| Google Cloud Run container | Example request-based rates are $0.000024 per vCPU-second and $0.0000025 per GiB-second of active time. At 4 vCPUs and 4 GiB that is about $0.106 per 1,000 active seconds, before requests, storage, egress, region, or free allowances. Keeping an instance warm adds idle charges. | Scale-to-zero introduces startup delay. Use an approved private object store or volume and a startup probe. HTTPS and IAM are available. Request timeout defaults to 300 seconds and can be extended to 3,600 seconds. The platform startup limit is four minutes. A proper authorized gateway or private access path is required for browser integration. |

[Render prices](https://render.com/pricing) · [Render free limits](https://render.com/docs/free) · [Render response limit](https://render.com/docs/render-vs-vercel-comparison) · [Render disks](https://render.com/docs/disks) · [Cloud Run prices](https://cloud.google.com/run/pricing) · [Cloud Run timeouts](https://docs.cloud.google.com/run/docs/configuring/request-timeout) · [Cloud Run limits](https://docs.cloud.google.com/run/quotas) · [Cloud Run authentication](https://docs.cloud.google.com/run/docs/authenticating/overview) · [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)

Vercel Hobby is free for eligible personal, non-commercial frontend use. Serving the frontend there still requires a linked account and a separately authorized backend for live inference.

The preferred demo target is the prepared laptop. A separate, persistent private VM or container is the next candidate once model scope, hosting access, spend, and jury authentication are confirmed.

## Local release verification

The release started from a fresh Windows virtual environment with the existing pinned CPU PyTorch installation and 22 missing pinned dependencies installed from the local cache. An isolated application cache contained only the eight verified CLIP files and the exact two JSON release artifacts. There were no evaluation files or BiomedCLIP weights in that cache. With offline flags and release verification enabled, cold HTTP readiness took 34.31 seconds. Twelve warm loopback predictions had 147.8 ms median round-trip latency.

Chrome verified the real method label, actual prediction on public development crops, upload only after Analyze, invalid image rejection, and disabling Analyze after service shutdown. The Python suite passed all 19 tests. It emitted one upstream TestClient deprecation warning. Docker Desktop had no available engine on the test host, so the Linux image remains unbuilt here.


Frontend lint, typecheck, the normal production build and the static export passed. Chrome checked all five routes at 375, 768 and 1440 pixels. With the API variable unset, the static workspace supported a local preview, disabled Analyze and made no external requests.
