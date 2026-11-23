# Step 3 research comparison

## Step 2 audit

The saved per-crop score file matches the 256 archived Step 2 sample digests in order. Recomputing argmax in `parasitized, uninfected` order reproduced all predicted labels, both confusion matrices, and the positive-class metrics. The output values are cosine similarities between normalized embeddings. The report treated parasitized as positive, and its matrix used actual rows and predicted columns.

The class-name CLIP prompt assigned a higher cosine to parasitized on every crop. The parasitized-minus-uninfected margin was positive for both reference labels, ranging from +0.00472 to +0.01788 with a median of +0.01035. The knowledge-guided pair shifted the margins in the opposite direction. Its median was −0.01935, and 243 of 256 crops favored uninfected. The zero decision boundary was the ordinary argmax. The margin shift explains the output behavior, while the scores alone cannot tell us which visual features drove it. The first morphology prompt focused on one ring appearance, and the second relied on absence wording. Those are plausible contributors and remain hypotheses.

On a development crop, manual cosines matched native CLIP logits divided by the learned positive logit scale, with a maximum absolute difference of 5.96 × 10⁻⁸. The model uses the pinned tokenizer and RGB image processor described in the [Step 2 report](step-2.md). Class lists, actual labels, prompts, and result columns all follow the same order.

## Locked protocol

The official NLM ZIP and two mapping CSVs are unchanged. All 27,558 PNGs were mapped in Step 2. The mapping rows are public identifiers for grouping. The canonical groups merge apparent aliases by shared C or P identifiers. The split supports independence by released group and by filename-derived source field. Independent persons cannot be confirmed from the published identifiers alone. [Official NLM release](https://data.lhncbc.nlm.nih.gov/public/Malaria/index.html) · [Rajaraman et al., 2018](https://doi.org/10.7717/peerj.4568)

I quarantined all 35 Step 2 holdout groups and the group used by the prior development smoke tests and warm-up. This left 164 groups. SHA-256 ranks with seed `medilens-step3-split-v1` assigned 32 groups to test, 32 to validation, and 100 to development. The sample within each partition takes a fixed number per class by cycling through SHA-ranked groups and SHA-ranked crops within each group. The split audit checks canonical group, source field, and exact file digest. The frozen local JSONL files record every selected crop, and the aggregate results record their digests and source file hashes.

| Partition | Available crops | Groups | Scored or fitted crops |
| --- | ---: | ---: | ---: |
| Historical quarantine | 5,647 | 36 | 0 |
| Development | 13,455 | 100 | 768, 384 per class |
| Validation | 4,958 | 32 | 256, 128 per class |
| Locked test | 3,498 | 32 | 384, 192 per class |

The unscored crops in a test group remain reserved. Selection used only validation, maximizing minimum class recall, then balanced accuracy, then macro F1, then lower median single-crop latency. Runtime and license eligibility refer to the local research demo. The final command locks the selection before opening test membership and uses identical examples for both backbones. Each head is fitted only against development labels. The live service loads the selected backbone and any selected fitted coefficients independently of evaluation data or labels.

## Model and prompt decisions

- OpenAI CLIP ViT-B/32 uses the exact Step 2 weights, preprocessing and two historical prompt pairs. The CLIP software is MIT-licensed and the published model card puts deployed use out of scope. [CLIP model card](https://huggingface.co/openai/clip-vit-base-patch32) · [Software license](https://github.com/openai/CLIP/blob/main/LICENSE)
- Microsoft BiomedCLIP uses ViT-B/16 at 224 pixels with the official PubMedBERT text tower, OpenCLIP bicubic shortest-edge resize and center crop, and a 256-token context. RGB images are rescaled and normalized to mean [0.48145466, 0.4578275, 0.40821073] and standard deviation [0.26862954, 0.26130258, 0.27577711]. Its pinned Hub repository carries Microsoft's MIT license. The model card also specifies that deployed uses are out of scope. The experiment and demo here run offline for research. The exact checkpoint revision, weight digest, and upstream BERT configuration are pinned in source. [Microsoft model card](https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224) · [Pinned Microsoft license](https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224/blob/9f341de24bfb00180f1b847274256e9b65a3a32e/LICENSE.md) · [BiomedCLIP paper](https://arxiv.org/abs/2303.00915)
- Both encoders were evaluated with the class-name pair and the frozen morphology ensemble. CLIP also ran the original Step 2 knowledge-guided prompt. The new ensemble uses three prompts per class. It normalizes text features, averages them by class, and normalizes the mean again. Every score comes from an actual pretrained image encoding.
- Both supervised candidates fit a centered two-output ridge head to frozen 512-dimensional normalized image embeddings, with penalty 0.001. The fitted head has 1,026 coefficients including bias. Its raw outputs are relative regression scores, with no probability calibration. This is supervised transfer from labeled cell crops. KPL remains future work.

### Morphology prompt version `cell-morphology-v1`

| Parasitized | Uninfected |
| --- | --- |
| A Giemsa-stained thin blood smear showing a parasitized red blood cell. | A Giemsa-stained thin blood smear showing an uninfected red blood cell. |
| A thin blood smear crop of a red cell with a small delicate intracellular parasite ring. | A thin blood smear crop of a red cell with no visible intracellular parasite. |
| A stained red blood cell containing a malaria parasite with visible chromatin. | A stained red blood cell with pale cytoplasm and no visible parasite structures. |

The example descriptors reference visual findings in Giemsa-stained smears. Ring morphology is one possible appearance and pale cytoplasm varies with staining. An indistinct crop can obscure a parasite, even when the annotation is positive. [CDC DPDx morphology](https://www.cdc.gov/dpdx/malaria/) · [Basic Malaria Microscopy](https://stacks.cdc.gov/view/cdc/11559/cdc_11559_DS1.pdf)

## Measurements

The Windows research run used a Ryzen 7 PRO 6850U, four PyTorch CPU threads, Python 3.12.10, and PyTorch 2.14.0+cpu. Inspection showed 14.8 GiB total usable RAM, 2.4 GiB available at the start, and about 215.8 GiB free disk. CUDA was unavailable. The cached BiomedCLIP checkpoint is 783,705,670 bytes. Each backbone was benchmarked in a fresh process.

### Validation results

Both supervised candidates fit only on the development sample. The validation set contained 256 crops. Candidate selection used the weaker of the two recalls first.

| Method | Accuracy | Parasitized recall | Uninfected recall | Macro F1 |
| --- | ---: | ---: | ---: | ---: |
| CLIP class names | 50.00% | 100.00% | 0.00% | 33.33% |
| CLIP original knowledge-guided | 50.00% | 4.69% | 95.31% | 37.08% |
| CLIP morphology ensemble | 51.17% | 87.50% | 14.84% | 43.75% |
| **CLIP supervised ridge** | 89.45% | 89.06% | 89.84% | 89.45% |
| BiomedCLIP class names | 49.61% | 0.00% | 99.22% | 33.16% |
| BiomedCLIP morphology ensemble | 50.78% | 1.56% | 100.00% | 35.05% |
| BiomedCLIP supervised ridge | 90.63% | 87.50% | 93.75% | 90.62% |

The frozen CLIP ridge head was selected. Its weaker-class recall was 89.06%, compared with 87.50% for the BiomedCLIP ridge head. The biomedical head had higher validation accuracy. The selection rule prioritized class balance and the CLIP head also had lower CPU latency.

### Locked test results

Each method scored the same 384 crops from 32 reserved groups. P denotes parasitized and U denotes uninfected. Each class column lists precision, recall, and F1 in that order. Actual labels are rows of the confusion matrices, and predictions are columns. Both use P, U order. Precision and F1 are set to zero when the corresponding denominator is zero.

| Method | Accuracy | Balanced accuracy | Macro F1 | P precision / recall / F1 | U precision / recall / F1 | Confusion matrix | Predictions P / U |
| --- | ---: | ---: | ---: | --- | --- | --- | --- |
| CLIP class names | 50.00% | 50.00% | 33.33% | 50.00% / 100.00% / 66.67% | 0.00% / 0.00% / 0.00% | `[[192,0],[192,0]]` | 384 / 0 |
| CLIP original knowledge-guided | 50.26% | 50.26% | 35.64% | 55.56% / 2.60% / 4.98% | 50.13% / 97.92% / 66.31% | `[[5,187],[4,188]]` | 9 / 375 |
| CLIP morphology ensemble | 56.77% | 56.77% | 52.26% | 54.19% / 87.50% / 66.93% | 67.57% / 26.04% / 37.59% | `[[168,24],[142,50]]` | 310 / 74 |
| **CLIP supervised ridge** | 95.05% | 95.05% | 95.05% | 95.77% / 94.27% / 95.01% | 94.36% / 95.83% / 95.09% | `[[181,11],[8,184]]` | 189 / 195 |
| BiomedCLIP class names | 50.00% | 50.00% | 33.33% | 0.00% / 0.00% / 0.00% | 50.00% / 100.00% / 66.67% | `[[0,192],[0,192]]` | 0 / 384 |
| BiomedCLIP morphology ensemble | 50.26% | 50.26% | 33.91% | 100.00% / 0.52% / 1.04% | 50.13% / 100.00% / 66.78% | `[[1,191],[0,192]]` | 1 / 383 |
| BiomedCLIP supervised ridge | 96.61% | 96.61% | 96.61% | 96.86% / 96.35% / 96.61% | 96.37% / 96.88% / 96.62% | `[[185,7],[6,186]]` | 191 / 193 |

The selected method recorded 11 false negatives and 8 false positives on this balanced test. The validation-selected CLIP head reached 95.05% accuracy. The BiomedCLIP ridge head reached 96.61% on this test sample. The demo continues to use the CLIP head selected before test access. Neither backbone produced balanced recall with its raw class-name prompts. The remaining 3,114 crops from these reserved groups were outside the preregistered 384-crop benchmark.

### CPU runtime

Each latency distribution uses 24 single-image inferences on validation crops. It includes decode, preprocessing, encoding and scoring, and excludes network, archive reads, and startup.

| Method | Median | P95 |
| --- | ---: | ---: |
| CLIP class names | 137.1 ms | 147.2 ms |
| CLIP original knowledge-guided | 143.3 ms | 154.9 ms |
| CLIP morphology ensemble | 141.8 ms | 154.4 ms |
| **CLIP supervised ridge** | 139.6 ms | 153.3 ms |
| BiomedCLIP class names | 400.8 ms | 733.7 ms |
| BiomedCLIP morphology ensemble | 400.8 ms | 649.9 ms |
| BiomedCLIP supervised ridge | 419.7 ms | 457.3 ms |

| Backbone | Initialization and prompt encoding | Warmed process RSS | Peak process working set | Encoder parameters |
| --- | ---: | ---: | ---: | ---: |
| CLIP ViT-B/32 | 15.3 s | 856.4 MiB | 886.1 MiB | 151,277,313 |
| BiomedCLIP ViT-B/16 | 23.2 s | 1086.3 MiB | 1143.3 MiB | 195,902,721 |

Peak working set is process-level memory measured during each validation run. Each ridge head adds 1,026 fitted coefficients. The [machine-readable report](step-3-results.json) includes both checkpoint hashes, package versions, and all measured metrics.

### Offline demo verification

The local FastAPI process was ready in 15.14 seconds with Hugging Face and Transformers offline mode enabled. Twelve sequential loopback requests on a development crop had 146.5 ms median round-trip latency. The frontend displayed the validation-selected CLIP ridge method, checkpoint revision, and uncalibrated ridge scores on actual development images. It transmitted no image during preview and disabled Analyze after service interruption.

All 16 Python tests passed. The suite covered real outputs on both classes, repeated scores, score order, restricted origins, validation, busy errors, and image non-persistence. Pytest emitted one upstream Starlette TestClient deprecation warning. Frontend lint, typecheck, and production build passed. Chrome checked all five routes at widths of 375, 768, and 1440 pixels and verified real output, invalid input handling, and loss of readiness.
### Representative locked-test errors

- False negative `a00290d80c16` scored 0.243 for parasitized and 0.757 for uninfected.
- False positive `5cd051c2bcc0` scored 0.786 for parasitized and 0.214 for uninfected.

On visual review, the false negative had an irregular crop boundary and little internal contrast. The false positive contained several darker pink flecks. These observations describe the crops. Which features drove the errors remains unknown.

## Hackathon presentation and limits

The original contribution is the local MediLens AI workflow, audit of the collapsed baseline, reproducible grouped comparison, and integration of the validation-selected method. The pretrained encoders, public data, and microscopy references are third party. The result does not represent the full KPL methodology or a thesis experiment. OpenAI Codex assisted with implementation, verification, and documentation.

The dataset is a single public crop collection. Images within a group are correlated, the balanced sample does not reflect prevalence, and group independence is bounded by the quality of the published mappings. Pretraining overlap with public microscopy figures and near-duplicate image similarity were not established. Scores are uncalibrated and the interface always returns a binary research label. Use de-identified research or test images only.

For the on-site demo, pre-stage the selected weights, configuration, tokenizer, and validation lock on the laptop. Start one CPU backend process and wait for health readiness before opening the workspace. This route works offline and processes the request image in memory. For Step 4, a private VM or container with a persistent model cache can keep one worker warm. Confirm that the chosen checkpoint covers the intended hosted use before deploying it. Start capacity testing at 4 vCPUs and 4 GiB of RAM for one worker, then adjust using measured peak working set and request latency. Keep the web frontend separate. A publicly reachable backend needs a checkpoint whose terms and intended-use guidance cover public deployment, a separately evaluated release, and appropriate privacy controls.
