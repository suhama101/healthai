# Vercel launch

The [existing Vercel frontend](https://healthai-lyart.vercel.app/) has been verified in preview-only mode. Use the [restricted inference plan](restricted-inference.md) for any future backend connection. The import steps below are a reference for setting up a replacement.

## Create the MediLens AI project

1. Sign in to the existing authorized Vercel account and select the intended team or personal scope. Open [New Project](https://vercel.com/new) and import [suhama101/healthai](https://github.com/suhama101/healthai). If the repository is missing, grant the Vercel GitHub integration access to this specific repository.
2. Create a dedicated project named **MediLens AI** using an available project slug. Use the repository root (`.`), the **Next.js** framework preset, and **Node.js 24.x**. Set Production Branch to `main`. The checked-in configuration sets install to `npm ci` and build to `npm run build`.
3. Leave Output Directory at the Next.js preset default. Leave `MEDILENS_STATIC_EXPORT` unset for the standard Vercel build. For a separate static-only configuration the equivalent build uses `MEDILENS_STATIC_EXPORT=1` and publishes `out/`. For this import, use the standard build.
4. Leave `NEXT_PUBLIC_MEDILENS_API_URL` unset in both Production and Preview. The upload preview stays in the browser and Analyze is disabled. Select **Deploy** and use the actual HTTPS production URL returned by Vercel.
5. Check Home, Workspace, How It Works, Technology & Validation, and About at 375, 768, and 1440 pixels. Use a synthetic image in a Workspace demo case to verify preview, disabled Analyze Image, and browser-only handling. Confirm the 384-crop benchmark and expandable details on Technology & Validation. Record the verified URL and update the README status.

Use the GitHub import so Vercel receives tracked source from the dedicated repo. The GitHub URL is the source submission. A separate public frontend URL would be a frontend demonstration while its inference API is unconfigured. Obtain organizer confirmation before relying on that distinction for the working-prototype requirement.

[Vercel Git deployments](https://vercel.com/docs/git) · [Build and output settings](https://vercel.com/docs/builds/configure-a-build) · [Node.js on Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

## Inference decision before the deadline

The requirement for a hosted inference URL remains unresolved. The frozen CLIP checkpoint's model card puts deployed use outside the intended scope, including noncommercial deployment. A restricted jury URL still needs checkpoint-use clearance, authorized infrastructure, and verified access controls. The local loopback session is the demonstrated research workflow.

The selected service is technically compatible with a warm, separate CPU container or VM. The measured Windows process peaked at about 886 MiB in validation and the clean-cache release became ready in 34.31 seconds. Start capacity testing with one worker, 4 vCPUs, 4 GiB RAM, and at least 2 GiB of persistent artifact storage. Stage the 605 MB pinned CLIP cache and exact fitted head bundle before startup. Run in offline release-verification mode and wait for `/health` to mark the frozen revision ready. These are local measurements. A Linux container and hosted latency still need verification.

If the use and an existing host are cleared, require authenticated private ingress over HTTPS, exact allowed hosts and browser origins, request and decode limits, and access logs that exclude images and identifying metadata. CORS alone provides no authentication. The existing frontend omits cross-origin credentials, so a cookie-based gateway needs a compatible same-origin proxy or a verified private network path before the frontend can invoke it. Set the public build variable only to the approved reachable origin after checking this path and testing genuine predictions, unauthorized access rejection, and readiness from the jury network.

Render lists a 2 CPU / 4 GB plan at $85/month and disk at $0.25/GB/month. A 2 GB disk brings the indicative total to $85.50/month. Cloud Run's example request-based rates yield about $0.106 per 1,000 active seconds at 4 vCPUs and 4 GiB before requests, storage, egress and idle charges. Cold starts, private ingress and persistent artifact access need a host-specific test. No paid resources were provisioned.

[CLIP model card](https://huggingface.co/openai/clip-vit-base-patch32) · [Render pricing](https://render.com/pricing) · [Cloud Run pricing](https://cloud.google.com/run/pricing) · [Backend and artifact guide](deployment.md)

## Release verification

Lint, typecheck, the standard production build, and all 19 Python tests passed. The frozen weights, selection, and fitted coefficients passed integrity checks. Chrome exercised navigation across all five routes at 375, 768, and 1440 pixels. The offline session returned real scores and disabled Analyze after FastAPI stopped. With the API variable unset, the local static export previewed an image, displayed the unavailable status, kept Analyze disabled, and made no external requests. The [Step 6 plan](restricted-inference.md) records verification of the live preview.
