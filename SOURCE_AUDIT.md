# Release data source audit

Checked on **Nov 8, 2026** using web search followed by full-page fetches of official announcement blogs and dated news in official repositories. Replaces the original 16-record demo with **38 curated, source-checked entries**.

## Terms

- **Entry:** 1 dated record in the dataset. Every entry is either a release or a model update.
- **Release:** a new model becomes public.
- **Model update:** an existing model changes, such as a new checkpoint or longer context.
- **Gap:** the days between 2 consecutive dates of the same model type.

## Scope and limitations

Curated core/general-purpose language and coding milestones, public API releases, open-weight releases, and announced capability updates. Not an exhaustive model catalogue or an automatic live feed.

Dates use first-party announcements, or dated news in an official repository. An API release and a later open-weight release are separate entries. Models released together in 1 dated family or size announcement count as 1 entry. Quantizations, silent file commits, previews, and specialized image/audio/Omni/VL-only/robotics/embedding/safety families are excluded. Announcements after the latest entry may exist.

## Corrections to the original sample

- CodeQwen1.5: Apr 2, 2024 → **Apr 16, 2024**, the official blog date.
- Qwen2.5-Coder: **Sep 19, 2024** initial release; **Nov 12, 2024** is a separate family-size expansion.
- Qwen3-Coder-Next: Feb 2, 2026 → **Feb 3, 2026**, the official blog date.
- Qwen3.6: distinguish the **Apr 2, 2026 API release (Plus)** from the **Apr 15, 2026 open-model announcement (35B-A3B)** and the **Apr 22, 2026 release (27B)**. Repository news dates 35B-A3B availability Apr 16, 2026, while the blog dates its announcement Apr 15, 2026. We use the dated public announcement and keep this discrepancy in the record.
- Qwen3.7: use **Qwen3.7-Max**; add **Qwen3.7-Plus on Jun 1, 2026**.
- Qwen3.8: use the **Qwen3.8-Max API release on Aug 3, 2026**; add the **2.4T-A95B open-weight release on Aug 12, 2026** and **27B on Aug 14, 2026**.
- Qwen3.8-Flash-Next: Oct 3, 2026 → **Aug 26, 2026**, the dated official announcement.
- Remove the standalone **Qwen3.8-Flash Aug 24, 2026** sample: reviewed sources do not support that entry or date. Do not infer an announcement from an API alias or the original graphic.

## Classification fixes (Nov 9, 2026)

These apply the dataset's own rule (new models are releases; only changes to existing models are model updates). Dates and sources are unchanged.

- Sep 25, 2023: split **Qwen-14B + Qwen-7B checkpoint update** into **Qwen-14B** (release) and **Qwen-7B checkpoint update** (model update). Both cite the same announcement. This raises the count from 37 to 38 entries.
- **Qwen2.5-Coder family expansion** (Nov 12, 2024): model update → release, because it adds 4 new sizes.
- **Qwen2.5-1M** (Jan 27, 2025): model update → release, because it adds 2 new checkpoints (Qwen2.5-7B-Instruct-1M and Qwen2.5-14B-Instruct-1M).
- Renamed **Qwen3.8-2.4T-A95B open weights** to **Qwen3.8-2.4T-A95B** to match other entry names. Availability stays "open weights".
- **Qwen3.6-35B-A3B** now records its API name, `qwen3.6-flash`, and cites the [Alibaba Cloud announcement](https://www.alibabacloud.com/blog/603043) that states it. This is why the entry counts toward the Flash model type.

## Enrichment

Added early size expansions and the Sep 2023 checkpoint update, Qwen1.5 MoE, Turbo/1M context updates, Max API milestones, Qwen3-2507 checkpoint and long-context updates, Qwen3.5 size expansions, and later 3.6/3.7/3.8 announcements. The Qwen3-2507 entry on Aug 8, 2025 is a documented context-support capability update, not a claim that new trained weights appeared.

## Evidence and official sources

The complete entry-level audit is in [data/releases.json](data/releases.json). Each of the 38 entries includes `sourceIds`, dated `evidence`, `verification`, `verifiedAt`, `availability`, and notes where needed. The `sources` dictionary resolves each reference to its official URL and title. The page shows these sources and the evidence when an entry is selected.

Primary sources include the [original Qwen repository](https://github.com/QwenLM/Qwen), [Qwen3 repository](https://github.com/qwenLM/qwen3), [Qwen3.8 repository](https://github.com/QwenLM/Qwen3.8), and official announcement blogs at qwen.ai, qwenlm.github.io and alibabacloud.com. See the JSON for individual announcement links.

## Verification and forecasts

Every entry stores `verification: primary-source-checked` and the date it was checked. The page does not re-fetch sources when it loads, so source review stays a manual maintenance step.

The historical mean and EMA are recalculated from each model type's dated history. With model updates included, the next forecast for a model type may be a model update, not a new release. Forecasts are estimates from past gaps, not announced release dates. Forecast dates that have passed are labeled "Date passed".
