# Release data source audit

Checked on **2026-11-08** using web search followed by full-page fetches of official announcement blogs and dated official repository news. Replaces the original 16-record demo with **37 curated, source-checked events**.

## Scope and limitations

Curated core/general-purpose language and coding milestones, public API launches, open-weight releases, and announced capability updates. Not an exhaustive model catalogue or an automatic live feed.

Dates use first-party announcements, or official repository dated News. API launches and later open-weight publication are separate distribution milestones. Models released together in one dated family/size announcement count as one event. Quantizations, silent file commits, previews, and specialized image/audio/Omni/VL-only/robotics/embedding/safety families are excluded. Announcements after the latest covered event may exist.

## Corrections to the original sample

- CodeQwen1.5: April 2, 2024 → **April 16, 2024**, the official blog date.
- Qwen2.5-Coder: **September 19, 2024** initial release; **November 12, 2024** is a separate family-size expansion.
- Qwen3-Coder-Next: February 2, 2026 → **February 3, 2026**, the official blog date.
- Qwen3.6: distinguish **April 2, 2026 API launch (Plus)** from **April 15 open-model announcement (35B-A3B)** and **April 22 release (27B)**. Official repository News dates 35B availability April 16, while the blog dates its announcement April 15. We use the dated public announcement and retain this discrepancy in the record.
- Qwen3.7: use **Qwen3.7-Max**; add **Qwen3.7-Plus on June 1, 2026**.
- Qwen3.8: use **Qwen3.8-Max API launch August 3, 2026**; add **2.4T-A95B open weights August 12** and **27B August 14**.
- Qwen3.8-Flash-Next: October 3, 2026 → **August 26, 2026**, the dated official announcement.
- Remove the standalone **Qwen3.8-Flash August 24, 2026** sample: reviewed sources do not support that event/date. Do not infer an announcement from an API alias or the original graphic.

## Enrichment

Added early size expansions and the September 2023 checkpoint update, Qwen1.5 MoE, Turbo/1M context updates, Max API milestones, Qwen3-2507 checkpoint and long-context updates, Qwen3.5 size expansions, and subsequent 3.6/3.7/3.8 announcements. Qwen3-2507 August 8 is a documented context-support capability update, not a claim that new trained weights appeared.

## Evidence and official sources

The complete event-level audit is maintained in [data/releases.json](data/releases.json). Each of the 37 events includes `sourceIds`, dated `evidence`, `verification`, `verifiedAt`, `availability`, and notes where needed. The `sources` dictionary resolves each reference to its official URL and title. The dashboard shows these sources and evidence when a release is selected.

Primary sources include the [original Qwen repository](https://github.com/QwenLM/Qwen), [Qwen3 repository](https://github.com/qwenLM/qwen3), [Qwen3.8 repository](https://github.com/QwenLM/Qwen3.8), and official announcement blogs at qwen.ai and qwenlm.github.io. See the JSON for individual announcement links.

## Qualification and forecasts

The Updated dataset badge requires `demo: false`, primary-source-check status, and verification evidence plus a permitted official source for every event. This validates the stored provenance; it does not re-fetch sources at page load. Source review remains a manual maintenance step.

Average and EMA are recalculated from the selected chronological event stream. With updates included, the next predicted event may be a variant or update, not a new generation. Predictions are historical interval estimates, not announced release dates. Past forecasts remain labeled past.
