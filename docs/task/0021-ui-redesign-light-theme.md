# Task 0021: UI Redesign — Light Neutral Theme & UX Polish

## Summary
Replaced the dark navy/indigo look with a modern light UI (white and warm-gray surfaces, near-black text, a single coral→pink accent) and improved the main flows' UX. Requested by the user: "less boring, eye-catching, better UX, not blue, white or gray".

## Status
Completed 2026-11-21.

## Changes
- **Design system** (`frontend/src/styles.css`, rewritten): tokens in `:root`, Geist font, soft shadows, accent focus rings, custom select chevron, skeleton loaders, subtle entrance animation (disabled for reduced motion).
- **Navbar**: frosted white bar, icon nav pills, avatar + role, icon logout.
- **Login**: split screen with dark brand panel (gradient glow, feature points) and clean form; stacks on mobile.
- **Dashboard**: greeting, stat strip (tools / trackers / calculators), filter chips with counts, search with icon, cards with coloured monograms, kind/AI badges, "updated" date, whole-card click target, skeletons while loading, richer empty states.
- **Tool page**: header card with monogram, access badge and currency; segmented tabs with icons; two-column form/results layout with a sticky results card and a highlighted primary result; icon buttons.
- **Entries**: count, right-aligned numbers, category chips, icon delete with inline "Yes, delete / Cancel".
- **Summary**: date presets (All time, 7 days, 30 days, this month, custom), stat strip incl. top category, daily trend column chart, bar lists by member/category/month.
- **Builder & AI copilot**: new headings, accent primary actions, live-preview badge.
- New components: `Icon.tsx`, `ToolIcon.tsx`; `Feedback.tsx` gained icons.

## Verification
- Frontend tsc (app + spec), ESLint, 16 Jest tests, `vite build` pass.
- Checked in the browser at 1280px and ~800px: dashboard, tool page (save → results card), summary (stats, trend chart, bars). Fixed two issues found: results card offset (sticky overridden by `position: relative`) and the tab bar stretching full width; long stat text now truncates.

## Notes
- During the check one test entry (Member 1, Food / Mess, Tk 150, "Daily groceries", dated 2026-11-21) was saved to the local expense tracker.
- Re-run the seed to pick up the "Recorded total" output label from task 0019.
