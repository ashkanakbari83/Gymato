# Mobile UX checklist and audit

A short list of the rules the phone UI is held to, where each comes from, and how it is checked. The measuring script lives outside the repo; run the same checks by hand or with Playwright at 360x740 and 390x844.

## Rules

| Rule | Source | In Jimato |
|---|---|---|
| Touch targets at least 44x44 CSS px (24 px is the AA minimum) | Apple HIG / WCAG 2.5.5 (AAA) and 2.5.8 (AA) | Small controls keep their look and get an invisible 44 px hit area (`responsive.css`); text links such as "don't show again" have `min-height: 44px` |
| 3 to 5 bottom navigation destinations, same level | Material 3 navigation bar | The phone dock has 3 tabs; everything else is reached from the home launcher. Desktop keeps the full top bar |
| Frequent actions in the thumb's natural zone, rare ones farther away | Hoober's thumb-zone research | Main actions sit low (dock, "Save set and continue", Back / Pause / Next); close buttons stay top corner but also close with Back |
| Inputs at 16 px or more (iOS zooms below that); never `user-scalable=no` | iOS Safari behaviour | All inputs 16 px; search boxes use `inputMode="search"` and `enterKeyHint="search"` |
| Safe areas respected (`viewport-fit=cover` plus `env(safe-area-inset-*)`) | iOS / Android notches and home bar | Dock, modals, player and auth screens pad for the insets |
| Dynamic height units (`dvh`) instead of `100vh` | Mobile browser toolbars | Full-screen layouts use `100dvh` |
| Scroll inside a sheet must not move the page behind it | `overscroll-behavior` | `.modal-card` and `.modal-body` use `contain`; the player uses `none` so a swipe cannot pull to refresh mid-workout |
| No tap delay or double-tap zoom on controls | `touch-action: manipulation` | Set on buttons, links, inputs, labels |
| Text readable: nothing under 12 px, layouts survive 160% text | WCAG 1.4.4 / 1.4.12 | Dock labels, badges, tile labels are 12 px or more; the home grid reduces columns as text grows |
| Workout screens: key action one tap, rest controls labelled with their amount, skip separate from pause | Workout apps (Hevy, Strong, Zing, Boostcamp, ...) | "+15 s" and "Skip rest" are separate labelled buttons; the "set saved" note shows at the top so it never covers the controls |
| Reduced motion | `prefers-reduced-motion` | Animations collapse to ~0 ms |

## Audit result (390 px and 360 px, both roles, 12 screens)

Fine already: no horizontal scroll, no inputs under 16 px (except native checkboxes inside 44 px rows), keyboard types set on phone, age, height, weight, dark theme and RTL/LTR.

Fixed in this pass:
- Dock labels 11 px to 12 px, badges 10.5 and 11 px to 12 px.
- "Don't show again" link 21 px to a 44 px hit area; search boxes 42 px to 44 px.
- The "set saved" toast covered the Back / Pause / Next buttons during a workout; it now sits at the top.
- Home tile labels broke in the middle of words at large text sizes; they now wrap on word boundaries and the grid uses fewer columns.
- Added `touch-action: manipulation`, `overscroll-behavior` on sheets and the player, and `inputMode` / `enterKeyHint` on search inputs.

Not done (ideas): swipe-down to close sheets everywhere, haptic taps on set completion, a one-hand mode that moves the top-corner close buttons to the bottom.
