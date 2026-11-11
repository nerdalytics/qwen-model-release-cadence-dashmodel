# Release data source audit

Checked on **Nov 8, 2026** with web searches followed by full-page fetches of official announcement blogs and dated news in official repositories. The original audit contains 38 curated, source-checked entries replacing the 16-record demo. A targeted official-source check on **Nov 11, 2026** adds Qwen4-Max Preview, bringing the dataset to 39 entries; older entries retain their original check dates. Two further targeted checks on the same day add the Qwen3.5 and Qwen3.6 Max previews, bringing the current total to 41 entries.

## Terms

- **Entry.** One dated record in the dataset. Every entry is either a release or a model update.
- **Release.** A new model becomes public.
- **Model update.** An existing model changes, for example with a new checkpoint or a longer context.
- **Gap.** The number of days between 2 consecutive dates of the same model type.

## Scope and limitations

The dataset covers curated core and general-purpose language and coding milestones, public API releases, open-weight releases and announced capability updates. It is not an exhaustive model catalogue or an automatic live feed.

Dates come from first-party announcements or from dated news in an official repository. An API release and a later open-weight release are separate entries. Models released together in 1 dated family or size announcement count as 1 entry. Publicly usable API or hosted previews count as releases and are explicitly labelled as previews. Coming-soon announcements without public access do not count. The dataset leaves out quantizations, silent file commits, and specialized image, audio, Omni, VL-only, robotics, embedding and safety families. Announcements after the latest entry may exist.

## Qwen4 public preview

The [official Qwen announcement on X](https://x.com/Alibaba_Qwen/status/2120335993643684315), published **Nov 11, 2026 at 02:01 UTC**, states that Qwen4-Max is now in preview on Alibaba’s Token Plan, with early access through QwenWork, Qoder, Qwen APP and QwenStudio. Both the visible post timestamp and its `article:published_time` metadata confirm the date. The supplied Model Studio screenshot lists `qwen4-max-preview` as a new model; it corroborates the API name but supplies no release date.

**Qwen4-Max Preview** counts as a release in **Generation** and **Max**, because public access is available, not merely promised. Its generation is 4 and its availability remains explicitly preview-only. The evidence does not establish general availability, open weights or a parameter size; none is inferred. The scope now includes publicly usable previews rather than excluding every preview by name. A later distribution milestone must not count as another generation. Historical preview coverage has only been backfilled for the 2 announcements documented next; it has not been exhaustively re-audited.

## Earlier Max previews added on Nov 11, 2026

- **Qwen3.5-Max Preview**, **Mar 19, 2026**: the [official blog](https://qwen.ai/blog?id=qwen3.5-max-preview) announces deployment on Arena and invites public evaluation. The promised final release within the next 2 weeks is not a confirmed release date. Availability is Arena preview; no API name or parameter size is inferred.
- **Qwen3.6-Max Preview**, **Apr 18, 2026**: the [official blog](https://qwen.ai/blog?id=qwen3.6-max-preview) announces the hosted preview and interactive use through Qwen Studio. It explicitly identifies `qwen3.6-max-preview`, but mixes coming-soon API wording with a section stating API availability. The entry therefore dates the hosted-preview announcement and does not claim an independently verified initial API availability date.

Both are new-model releases in **Max**, not model updates. Neither adds another **Generation** entry: Qwen3.5 was already public on Feb 16, 2026, and Qwen3.6-Plus on Apr 2, 2026. Both entries remain explicitly preview-only; neither asserts open weights. Entries are kept in chronological order.

## Corrections to the original sample

- CodeQwen1.5 moves from Apr 2, 2024 to **Apr 16, 2024**, the official blog date.
- Qwen2.5-Coder keeps **Sep 19, 2024** as its initial release. The **Nov 12, 2024** family-size expansion is a separate entry.
- Qwen3-Coder-Next moves from Feb 2, 2026 to **Feb 3, 2026**, the official blog date.
- Qwen3.6 has 3 non-preview entries: the **Apr 2, 2026 API release of Plus**, the **Apr 15, 2026 open-model announcement of 35B-A3B** and the **Apr 22, 2026 release of 27B**. Repository news dates 35B-A3B availability to Apr 16, 2026, while the blog dates its announcement Apr 15, 2026. The entry uses the dated public announcement and keeps this discrepancy on record.
- Qwen3.7 uses **Qwen3.7-Max** and adds **Qwen3.7-Plus on Jun 1, 2026**.
- Qwen3.8 uses the **Qwen3.8-Max API release on Aug 3, 2026** and adds the **2.4T-A95B open-weight release on Aug 12, 2026** and **27B on Aug 14, 2026**.
- Qwen3.8-Flash-Next moves from Oct 3, 2026 to **Aug 26, 2026**, the date of the official announcement.
- The standalone **Qwen3.8-Flash entry on Aug 24, 2026** is gone. The reviewed sources do not support that entry or date, and an API alias or the original graphic is not evidence of an announcement.

## Classification fixes on Nov 9, 2026

These fixes follow the dataset's own rule. New models are releases, and only changes to existing models are model updates. Dates and sources stay the same.

- The Sep 25, 2023 entry **Qwen-14B + Qwen-7B checkpoint update** is now 2 entries: **Qwen-14B**, a release, and **Qwen-7B checkpoint update**, a model update. Both cite the same announcement, so the count rises from 37 to 38 entries.
- **Qwen2.5-Coder family expansion** on Nov 12, 2024 changes from model update to release, because it adds 4 new sizes.
- **Qwen2.5-1M** on Jan 27, 2025 changes from model update to release, because it adds 2 new checkpoints, Qwen2.5-7B-Instruct-1M and Qwen2.5-14B-Instruct-1M.
- **Qwen3.8-2.4T-A95B open weights** is now named **Qwen3.8-2.4T-A95B**, like the other entries. Its availability stays "open weights".
- **Qwen3.6-35B-A3B** now records its API name, `qwen3.6-flash`, and cites the [Alibaba Cloud announcement](https://www.alibabacloud.com/blog/603043) that gives it. That API name is why the entry also counts toward the Flash model type.

## Enrichment

The dataset adds early size expansions, the Sep 2023 checkpoint update, Qwen1.5 MoE, the Turbo and 1M context updates, Max API milestones, the Qwen3-2507 checkpoint and long-context updates, the Qwen3.5 size expansions, and the 3.6, 3.7 and 3.8 announcements. The Qwen3-2507 entry on Aug 8, 2025 is a documented context-support update. It does not claim that new trained weights appeared.

## Evidence and official sources

[data/releases.json](data/releases.json) holds the complete entry-level audit. Each of the 41 entries has `sourceIds`, dated `evidence`, `verification`, `verifiedAt`, `availability`, and notes where needed. The `sources` dictionary maps each reference to its official URL and title. The page shows these sources and the evidence when a reader selects an entry.

Primary sources include the [original Qwen repository](https://github.com/QwenLM/Qwen), the [Qwen3 repository](https://github.com/qwenLM/qwen3), the [Qwen3.8 repository](https://github.com/QwenLM/Qwen3.8), and official announcement blogs at qwen.ai, qwenlm.github.io and alibabacloud.com. The JSON links each announcement.

## Verification and forecasts

Every entry stores `verification: primary-source-checked` and the date of the check. The page does not re-fetch sources when it loads, so source review stays a manual maintenance step.

The page recalculates the historical mean and EMA from the dated history of each model type. With model updates included, the next forecast for a model type may be a model update, not a new release. Forecasts come from past gaps, not from announced release dates. The page labels a forecast date that has passed "Date passed".
