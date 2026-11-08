# Cadence — releases, updates, and two forecasts

A responsive static dashboard for GitHub Pages. **The bundled release dates are unverified demo data from the original reference**, not an authoritative release history.

## Files

- `index.html`: page layout
- `styles.css`: mobile-first dark styling
- `app.js`: loader, charts, and forecast calculations
- `data/releases.json`: all release and update records

GitHub Pages uses `main` and `/ (root)`. No backend, build step, secret keys, or dependencies are needed. Use the hosted site rather than a local HTML file viewer, because the dashboard fetches adjacent JSON.

## Update the data, not the website

Edit `data/releases.json` and commit. Each object in `releases` has:

- `name`: model name
- `date`: actual event date in `YYYY-MM-DD`
- `series`: `core`, `coding`, or `variant`
- `event`: `release` or `update` (optional; defaults to `release`)

To record an update, add another record with the same model name, its actual update date, its series, and `event: "update"`. The same name can appear on different dates. Exact duplicate series/name/date records are rejected. Do not add hypothetical future dates as actual events.

Update `updatedAt` when maintaining the file. Keep `demo: true` until the sample data has been verified or replaced. After GitHub publishes the commit, reload the site or select **Refresh data**. Year filters, charts, cadence and forecasts recalculate automatically. CDN publication delays may apply.

## Selected streams

**Include updates** is ON by default:

- **All models:** one chronological stream of every core, coding, variant and update event.
- **Core:** core events plus variants and their updates.
- **Coding:** coding releases and updates.

Disable Include updates to exclude `event: "update"` and variant-series records. It affects charts, log, average, EMA, forecasts and CSV export.

## Two forecasts

Both predictions start at the latest selected event, not the latest core generation:

1. Average gap = sum of consecutive selected-range gaps / number of gaps.
2. Average prediction = latest selected event date + rounded average gap in days.
3. EMA seeds from the first gap; later EMA = 0.20 × newest gap + 0.80 × previous EMA.
4. EMA prediction = latest selected event date + rounded latest EMA in days.

EMA retains earlier history in the same selected stream when narrowing the date range; the average uses only in-range gaps. One-event ranges can have a historical EMA but no in-range average prediction. Same-day events count separately and produce zero-day gaps.

Yellow shows EMA; cyan shows the average; open markers show forecast dates. Search filters the log/export, not the summary. Early/late compares the latest gap to the prior EMA with a 10% tolerance. The first release and interval are baseline/seed.

These estimate timing of the next selected event, not its model identity. With updates included, the next event can be an update or variant. Past estimates stay labeled past rather than being artificially moved forward.

## Not an automatic announcement feed

A maintainer or separate automation must update the external JSON using an authoritative source. No scheduled GitHub Actions data updater is configured. Simulated test updates are not included in the dataset.
