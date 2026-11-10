# Modern web guidance audit

Reviewed against GoogleChrome/modern-web-guidance commit
`4dd968349e54ca45a05dd5c818fb035c9054b022` (skill version
`2026_11_09-5bcc021b`). The audit preserves release data, forecast calculations,
visual design, and the dependency-free static deployment.

## Applied changes

- Native modal dismissal: the details dialog uses `closedby="any"`,
  `showModal()`, a `method="dialog"` close form, and native focus restoration.
  Browsers without `closedBy` receive a bounds-checked pointer fallback requiring
  both press and release outside. Cancellation and closure reset pointer state.
  The retained legacy app also gates its backdrop fallback on feature detection.
- Scroll containment: modal and backdrop use `overscroll-behavior: contain`;
  the backdrop establishes a scroll container with `overflow: hidden`.
  A modal-only root lock (`html:has(dialog:modal)`) also prevents background
  scrolling in Safari. The existing `scrollbar-gutter: stable` reserves the
  scrollbar space so locking does not change content width. The page is not
  fixed or repositioned, and closing the last modal removes the lock naturally.
- Text scaling: `meta name="text-scale" content="scale"` opts in to OS text
  preferences without overriding root font size. Existing relative typography,
  wrapping controls, and adaptive grids remain in place. Flex children can shrink
  and controls wrap at enlarged text sizes. A named inline-size container shows
  intermediate slider labels only when they fit; endpoints always remain visible.
- Search semantics: release filtering uses the native `search` landmark and
  retains its visible input label, result status, and semantic release table.
  Forecast statuses are nested inside their definition-list descriptions rather
  than invalid siblings of terms and descriptions.
- Loading: font stylesheets are discovered in HTML, not chained through CSS
  `@import`; font origins are preconnected and `display=swap` is preserved.
  The color-scheme meta and theme initialization precede stylesheets. Asset
  generation preserves this order. Changed resources have new cache versions.

## Browser support and verification

Baseline Widely available features need no additional fallback. Newer features
follow the retrieved guides: light dismiss has a feature-detected fallback;
OS text-scale opt-in degrades to ordinary browser text sizing and zoom; modal
scroll containment alone is progressive enhancement. Non-overflowing-container
containment cannot be detected with `CSS.supports`.

**Project requirement:** Background page scrolling must be blocked while a modal
is open, including in iOS Safari. This overrides the guide's recommendation to
accept background scrolling as graceful degradation. The previous guide
adoption removed a working root lock and caused a user-reported Safari
regression. Keep the modal-only root lock and stable gutter alongside native
scroll containment. Preserve dialog scrolling, native dismissal, page scroll
position, and normal scrolling after dismissal. Do not replace this lock with
`overscroll-behavior` alone or gate it on `CSS.supports`.

Run every `scripts/test-*.js` with Node. The UI regression suite covers 330
model/layout combinations, native and fallback dismissal, selection drags,
pointer cancellation, markup, font loading, scroll containment, and the Safari
root-lock/gutter requirement. Run asset
generation and repeat tests to verify the deployed HTML, not just source HTML.
The Pages workflow also runs `node scripts/test-dialog-scroll-browser.cjs` with
Playwright 1.65.0 in Chromium and WebKit at desktop and phone viewport sizes.
It exercises wheel gestures over the backdrop and inside short/overflowing
dialogs, both scroll boundaries, close-button/Escape/backdrop dismissal,
position and width preservation, keyboard focus return, and scroll unlocking.
It repeats these checks with native `closedby` disabled to cover the Safari
light-dismiss fallback. Pointer dismissal is checked for focus escaping the
closed dialog rather than an exact active element, which varies across WebKit
platforms. Keyboard dismissal still requires focus to return to the opener.
This engine-level test does not replace physical iPhone touch testing.

The legacy scan checks only its deterministic subset (approximately 20% of the
catalog); zero findings are not a complete accessibility or compatibility audit.
No new transitions, polyfills, or unrelated UI features were introduced.
