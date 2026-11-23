# Step 2 research report

## Dataset and reuse

Courtesy of the National Library of Medicine. The source is the [NLM Malaria Cell Images release](https://data.lhncbc.nlm.nih.gov/public/Malaria/index.html), which provides the cell image ZIP and a patient-to-cell mapping for each class. The [NLM datasheet](https://lhncbc.nlm.nih.gov/LHC-research/LHC-projects/image-processing/malaria-datasheet.html) lists this cell-crop release separately from the full-field thin blood smear collection.

Cite Rajaraman et al. (2018), *Pre-trained convolutional neural networks as feature extractors toward improved malaria parasite detection in thin blood smear images*, PeerJ 6:e4568. The [published article](https://lhncbc.nlm.nih.gov/LHC-publications/PDF/pub9752.pdf) carries a Creative Commons Public Domain Dedication. The archive listing provides public access and does not show a separate archive license. We used the files locally for attributed research and keep the archive and mapping files out of the repository. The [NLM data terms](https://www.nlm.nih.gov/databases/download.html) require attribution and prohibit implying endorsement. Any broader redistribution should be checked against the applicable rights for the images.

The labels are `parasitized` and `uninfected` at the **cell-crop** level. A crop labeled uninfected does not establish its source patient's status.

The archive contains **27,558 verified PNGs**, split evenly between the two classes. Both mapping files together cover every image. They contain 201 distinct released identifiers, which become 200 groups after the conservative merge. Every image filename matched the source-field pattern, and the audit found zero exact byte duplicates.

| Partition | Parasitized | Uninfected | Groups |
| --- | ---: | ---: | ---: |
| Development | 10,716 | 11,320 | 165 |
| Held-out | 3,063 | 2,459 | 35 |

## Split and sampling

The audit verifies PNG members directly from the ZIP without extracting the corpus. It maps filenames to the released identifiers using both official CSVs. Each filename encodes a source-field prefix before the cell index. Grouping uses the released mapping IDs, with a conservative merge for shared leading C codes or P numbers across rows. Potential aliases stay in the same partition. The split is grouped by released identifiers and cannot verify that different identifiers always represent different people.

A fixed SHA-256 bucket assigns approximately 20% of groups to held-out and the rest to development using seed `medilens-nlm-split-v1`. The manifest excludes unmapped crops and every copy of repeated exact file bytes from evaluation partitions. The audit rejects any overlap across partitions by canonical group, source-field prefix, or byte digest. Near-duplicate similarity and overlap with the pretrained model's nonpublic training data were not audited.

The initial sample selects up to 128 crops per class from held-out, using the fixed `medilens-held-out-sample-v1` ranking and round-robin selection by available group per class. Both methods receive the same images. The prompts were fixed before inference on the selected images. A development image warms the model outside the benchmark. Code and commands are in the [README](../README.md). The manifest, image data, and per-crop evaluation rows remain in Git-ignored local storage.

## Checkpoint and preprocessing

- Model identifier `openai/clip-vit-base-patch32` at revision `3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268`. The original Hugging Face PyTorch file is 605,247,071 bytes. Its SHA-256 is checked before weights-only loading. [Pinned files](https://huggingface.co/openai/clip-vit-base-patch32/tree/3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268)
- OpenAI's CLIP software repository uses the MIT license. The pinned Hub file listing has no standalone checkpoint license notice. The Hub model card describes the checkpoint as a research output and puts deployed uses out of scope. This experiment is local and uses two English prompts per method. [Software license](https://github.com/openai/CLIP/blob/main/LICENSE) · [Model card](https://huggingface.co/openai/clip-vit-base-patch32)
- Pillow validates and decodes PNG/JPEG, applies EXIF orientation, and converts to RGB. The pinned processor resizes the shorter edge to 224 with bicubic interpolation, center-crops to 224 × 224, rescales by 1/255, and normalizes with RGB mean `[0.48145466, 0.4578275, 0.40821073]` and standard deviation `[0.26862954, 0.26130258, 0.27577711]`. The pinned CLIP tokenizer processes the English prompts. [Processor configuration](https://huggingface.co/openai/clip-vit-base-patch32/blob/3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268/preprocessor_config.json)
- The model runs in evaluation and inference mode using float32. The normalized image embedding is dotted with each normalized text embedding. The larger cosine similarity determines the class. Absolute scores and score differences are uncalibrated. The workspace uses the class-name method.
- The Windows host has an AMD Ryzen 7 PRO 6850U with integrated Radeon graphics, 16 logical processors, and about 14.8 GiB usable physical RAM. About 1.6 GiB was available at the initial inspection. Python 3.12.10 ran PyTorch 2.14.0+cpu and Transformers 4.57.6 with four PyTorch CPU threads. CUDA was unavailable. Python 3.14.5 was also installed, without PyTorch or Transformers. No copy of this model was found in the default Hugging Face cache before the download.

## Frozen prompts

| Method | Parasitized | Uninfected |
| --- | --- | --- |
| Class-name CLIP baseline | A thin blood smear image of a parasitized red blood cell. | A thin blood smear image of an uninfected red blood cell. |
| Knowledge-guided CLIP experiment | A Giemsa-stained red blood cell containing a delicate malaria parasite ring with a small dark chromatin dot. | A Giemsa-stained red blood cell with pale pink cytoplasm and no visible intracellular parasite ring or chromatin dot. |

The baseline uses the NLM class labels. The experimental positive prompt draws on CDC's description of delicate falciparum ring forms and chromatin dots; the background red-cell color draws on the basic microscopy guide. The absence of a visible ring is a text prompt for comparison. It cannot establish the absence of infection. The experiment uses fixed text embeddings and does not implement Knowledge Proxy Learning. [CDC DPDx morphology](https://www.cdc.gov/dpdx/malaria/) · [Basic Malaria Microscopy](https://stacks.cdc.gov/view/cdc/11559/cdc_11559_DS1.pdf) · [KPL paper](https://arxiv.org/abs/2501.11231)

## Evaluation results

Both methods scored the same **256 held-out cell crops**, with 128 of each label. Precision, recall, and F1 use parasitized as the positive class. Confusion matrices list actual classes in rows and predictions in columns, ordered parasitized then uninfected.

| Method | Accuracy | Precision | Recall | F1 | Confusion matrix |
| --- | ---: | ---: | ---: | ---: | --- |
| Class-name baseline | 50.00% | 50.00% | 100.00% | 66.67% | `[[128, 0], [128, 0]]` |
| Knowledge-guided prompts | 50.39% | 53.85% | 5.47% | 9.93% | `[[7, 121], [6, 122]]` |

The baseline labeled every crop parasitized. Its 100% recall came with zero correctly classified uninfected crops. The experiment labeled most crops uninfected and missed 121 parasitized crops. The one additional correct prediction on this balanced subset does not establish a reliable accuracy improvement.

Mean single-image CPU processing time was **108.8 ms** (median 107.6 ms, P95 127.1 ms) for decoding, preprocessing, one shared image encoding, and both score vectors. The timing excludes startup, warmup, ZIP reads, and HTTP. This is a preliminary quantitative benchmark. The class-balanced subset bounded the initial CPU run. The rest of the 5,522-crop held-out partition remains unevaluated.

| Public crop (SHA-256 prefix) | NLM label | Baseline prediction | Baseline cosine scores (parasitized / uninfected) |
| --- | --- | --- | --- |
| `d9d38c402908` | Parasitized | Parasitized | 0.2997 / 0.2928 |
| `1035a72e45bb` | Uninfected | Parasitized | 0.2770 / 0.2694 |

The [machine-readable report](step-2-results.json) includes the full example digests, both methods' scores, split fingerprints, hardware, and aggregate metrics. The detailed per-crop rows are available locally in the ignored dataset cache.

## Limits

This early benchmark is an engineering and research check for segmented cell crops from one public release. Crops from the same held-out group are correlated, and the fixed balanced sample does not represent clinical prevalence. Results cannot establish patient-level, external, or clinical performance. The morphology prompts emphasize one parasite appearance, while slide quality, staining, parasite appearance, and visual artifacts vary. The model forces a binary choice even for out-of-scope images. Use this prototype only for research and education.
