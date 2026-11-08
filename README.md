# Cadence — releases, updates, and two forecasts

## GitHub Pages deployment

Upload the package contents to the public repository root, preserving the data folder:

- index.html: page layout
- styles.css and data-quality.css: responsive dashboard and provenance styling
- app.js: loader, charts, and forecast calculations
- data-quality.js: dataset qualification and source details
- data/releases.json: all release and update records, with evidence
- SOURCE_AUDIT.md: verification methodology and corrections

In Settings → Pages choose Deploy from a branch, main, / (root). No backend, build step, credentials, or dependencies are needed. Opening a local HTML attachment is not supported for external JSON loading; use the hosted website. Both source and data in the public repository are public.

## Maintain only the external JSON

Edit data/releases.json and commit. Each object in releases has:

- name: model name
- date: actual event date in YYYY-MM-DD
- series: core, coding, or variant
- event: release or update (optional; defaults to release)
- sourceIds: references to entries in the top-level sources dictionary
- evidence: dated first-party evidence
- verification: primary-source-checked after source review
- verifiedAt: actual source-check date
- availability: API, open weights, or other distribution mode
- notes: grouping, discrepancies, or qualifications where relevant

For an update to an existing model, add another record with the same name, its actual update date, the appropriate series, and event set to update. No website-code edits are required. The same model name is allowed on different dates; exact duplicate series / name / date records are rejected. Do not add hypothetical future dates as actual events.

Update updatedAt and quality.checkedAt when maintaining the file. The current source-checked snapshot uses demo: false. Preserve each record's sourceIds, evidence and verification metadata when updating the dataset. Refresh data loads the external file again after GitHub has published the commit; CDN publication delays may apply. Year options and timeline limits adapt automatically.

## Update inclusion and selected streams

Include updates is ON by default:

- All models: one chronological stream containing every core, coding, variant, and update event.
- Core: core events plus variants and their updates.
- Coding: coding releases and updates.

Turn Include updates OFF to exclude event: update records and variant-series records. This offers the narrower new-model release cadence. This option affects graphs, release log, counts, average, EMA, both forecasts, and exported CSV.

## Forecast definitions

Both predictions are anchored to the latest selected event date, not the last core generation:

1. Average gap = sum of gaps between consecutive selected-range events / number of gaps.
2. Average-based prediction = latest selected event date + rounded average gap in days.
3. EMA seeds from the first gap, then EMA = 0.20 × newest gap + 0.80 × previous EMA.
4. EMA-based prediction = latest selected event date + rounded latest EMA in days.

EMA retains earlier history in the same chosen stream when narrowing the date range. Average uses only gaps between events inside the selected range. A one-event range can retain historical EMA but has no in-range average prediction. Same-day events count separately and produce zero-day gaps.

The graph shows yellow EMA and cyan average; open markers identify their forecast dates. Search filters the log and export only. Early/late status compares the newest gap against the previous EMA with a 10% tolerance; the initial events are baseline / seed.

These estimates predict timing of the next selected event, not which model will release next. When updates are included, that event can be an update or variant rather than a new generation. Past forecasts are labeled past, not artificially moved forward.

## What is not automated

The dashboard does not discover announcements or update the JSON by itself. A maintainer or a separately configured automation must add releases and dated updates from an authoritative source. No scheduled GitHub Actions updater has been configured. The current dataset contains 37 curated events checked against official sources on 2026-11-08. See SOURCE_AUDIT.md for evidence, corrections, exclusions and date discrepancies. Simulated test updates are not included in this package.

## Source verification

The Updated dataset badge requires primary-source-check metadata and a valid official source for every event. data-quality.js exposes source links and dated evidence in release details and a coverage panel. SOURCE_AUDIT.md documents the 16-to-37-event enrichment and corrections. This is a curated core/coding history, not every specialized Qwen family, preview or file-level update. It is a manually checked snapshot, not a live feed. Qualification checks the stored provenance, not the truth of a newly added entry or its remote source at page load; source review remains necessary.
