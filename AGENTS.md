# Browser support and modal behavior

Support iOS Safari as a first-class browser. Background page scrolling must be
blocked while a modal dialog is open; scrolling inside the dialog must remain
possible. Keep the page scroll position and content width unchanged on open/close,
and restore normal page scrolling after every dismissal path.

This is an explicit project override to modern-web-guidance's progressive
enhancement recommendation for modal scroll containment. Keep
`html:has(dialog:modal){overflow:hidden}` with the existing
`scrollbar-gutter:stable`; `overscroll-behavior` alone is insufficient in Safari.
Do not remove this lock based on generic guide advice, a Chromium-only test, or
`CSS.supports`. That feature check cannot detect Safari's missing containment
behavior. Non-modal dialogs must not lock the page.

Run the Node test suites and check browser scrolling over the backdrop, within
the dialog, and at its scroll boundaries. Test both overflowing and short
dialogs, page position/width preservation, and unlocking on close, Escape, and
backdrop dismissal. Include WebKit, not just Chromium.
