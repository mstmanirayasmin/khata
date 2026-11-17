# Personal Expense Tracker — Implementation Plan

**Status:** Implemented. See "Implementation status" at the end.

---

## 0. Decisions (confirmed)

| Area | Choice |
| --- | --- |
| Styling | Custom CSS with design tokens (no Tailwind) |
| Charts | Chart.js 4 via CDN |
| JavaScript | Single `app.js` file, no framework / build step |
| Currency | BDT (৳), formatted with `Intl.NumberFormat("en-BD")` |
| Persistence | `localStorage` with seeded sample data on first run |

---

## 1. Guiding principles

The main risk is the generic "AI-generated dashboard" look. The design uses a deliberate editorial aesthetic instead of a template.

**Avoid (AI-slop tells):**
- Purple/blue gradient heroes, gradient text, glassmorphism
- Walls of identical rounded cards with emoji icons
- Inter-everywhere, oversized pills, drop shadows on everything
- Filler copy like "Welcome back, User!"

**Do instead:**
- Warm paper background, single restrained forest-green accent, earthy category colors
- Editorial typography: Fraunces (display/numbers) + DM Sans (UI)
- Hairline borders, generous whitespace, shadow only on elevated elements
- Consistent inline SVG icons (never emoji)
- Real, purposeful copy and helpful empty states

---

## 2. Project structure

```
khata/
├── index.html              # Semantic app shell + all view regions
├── css/
│   ├── tokens.css          # Colors, type scale, spacing, radii, shadows
│   └── styles.css          # Layout, components, utilities, responsive rules
├── js/
│   └── app.js              # State, CRUD, filters, calculations, charts, export
├── PLAN.md                 # This document
└── assets/                 # Reserved for future brand/favicon assets
```

Dependencies loaded from CDN: Google Fonts (Fraunces, DM Sans), Chart.js 4.

---

## 3. Data model & state

**Expense record**
```js
{ id, date: "YYYY-MM-DD", category: "food", amount: 24.50, description: "Lunch" }
```

**Categories** — fixed catalog of 7: Food & Dining, Transport, Shopping, Bills & Utilities, Health, Entertainment, Other. Each has an id, label, muted color, and SVG icon.

**App state (single source of truth)**
```js
state = {
  expenses: [],
  filters: { search, category, from, to, min, max },
  sort: { key: "date", dir: "desc" },
  chartRange: "all",        // "1M" | "3M" | "all"
  editingId: null,
  pendingDeleteId: null,
}
```

All derived views (summary, charts, list) re-render from state through one `render()` pipeline. Mutations follow: update state → persist → `render()` → toast.

---

## 4. UI layout & components

**Desktop**
- Left sidebar: brand, "New expense" CTA, nav (Overview / Insights / Transactions), CSV export footer.
- Main column:
  1. Topbar — title, context line, search, Reset.
  2. Summary row — Total spent, Avg / transaction, Top category, Transactions count.
  3. Insights — category doughnut + spending-over-time bars, then "Average spending per category" ranked bars.
  4. Transactions — filter bar, active-filter chips, sortable table with row actions.

**Mobile**
- Sidebar → sticky header + bottom nav + floating add button.
- Summary becomes a 2×2 grid; charts stack; table transforms into stacked cards.

**Key components**
- Add/edit modal: date, category (select with icon swatches), amount, description, inline validation.
- Filter bar: category, from/to dates, min/max amount, Clear.
- Chips for active filters with individual removal.
- Toasts for create/update/delete/export.
- Custom confirm dialog for deletion.
- Page preloader: brand mark + animated progress bar, waits for real page readiness with a minimum display time and a failsafe timeout.
- Scroll-to-top button: fades in after 400px of scrolling and smooth-scrolls back to the top.
- Narrow footer band: live date/time with seconds plus "Designed & developed by Mst. Manira Yasmin".
- Smart light/dark theme: system-preference default, persisted overrides, pre-paint theme resolution, and chart/category repainting on switch.
- Empty and zero-result states with actionable buttons.

---

## 5. Expense management functionality

- Add, edit, delete records with validation (required date, valid category, amount > 0).
- `crypto.randomUUID()` IDs with a fallback for non-secure contexts.
- Edit reuses the same modal in "edit" mode; delete uses a custom confirm dialog.
- All user text is escaped (`textContent`/`esc()`) to avoid XSS.
- `localStorage` persistence under `khata.expenses.v1`; seed data is generated relative to today.

---

## 6. Filtering & search functionality

Pure `getFiltered(state)` combining filters with AND logic:
- **Search** — case-insensitive across description + category label.
- **Category** — single-select.
- **Date range** — inclusive `from`/`to`.
- **Amount** — min/max bounds.
- **Sorting** — by date or amount, asc/desc, toggled from table headers.

Filters apply to the list **and** the dashboard/charts so the whole view stays consistent. Result counts ("Showing X of Y") keep the user oriented. Chips expose and remove active filters individually.

---

## 7. Dashboard & summary calculations

Pure functions in `app.js` fed by the filtered set:
- **Total spent** — sum of amounts.
- **Average per transaction** — total / count.
- **Average spending per category** — mean transaction amount within each category, ranked.
- **Top category** — highest total.
- **Trend series** — daily buckets (1M), weekly buckets (3M), or monthly buckets (All).
- Formatting via `Intl.NumberFormat` with tabular numerals.

---

## 8. Charts & data visualization

Chart.js 4, styled to match the design system (DM Sans, muted gridlines, custom dark tooltips, no default boxes):

1. **Category doughnut** — arcs in category colors, custom HTML legend with percentages, total in the center.
2. **Spending over time** — bar chart with range toggle (1M / 3M / All), minimal axes, currency-formatted tooltips.
3. **Average per category** — horizontal ranked bars using category colors (this one is bespoke HTML/CSS rather than Chart.js).

All charts read from the same computed data as the summary to prevent drift. Graceful "Charts unavailable (offline)" fallback if the CDN fails.

---

## 9. Responsive design

- Mobile-first CSS with breakpoints at ~600px, ~860px, and ~1080px.
- Sidebar hides on mobile; bottom nav + FAB take over.
- `grid-template-columns: repeat(auto-fit, ...)` patterns for summary and insights.
- Table collapses to cards using `data-label` pseudo-elements.
- Touch-friendly targets, no horizontal page scroll, charts resize via Chart.js responsive mode.
- `prefers-reduced-motion` respected; focus-visible rings; semantic landmarks and ARIA labels.

---

## 10. Implementation phases (build order)

1. Design tokens + semantic HTML shell and static layout.
2. Data layer: categories, seed data, localStorage, state object, `render()` pipeline.
3. CRUD + modal form with validation and toasts.
4. Transactions list rendering, sorting, and all filters/chips.
5. Summary calculations and the summary row + category breakdown.
6. Chart.js doughnut and trend charts + custom category bars.
7. Responsive tuning, empty states, accessibility, micro-interactions.
8. Extras: CSV export, nav scroll-sync, offline chart fallback.

---

## 11. Deferred / nice-to-haves (not in initial scope)

- JSON import/export; budget goals with progress indicators
- User-editable category catalog and colors
- Recurring expenses and notifications
- Light/dark theme toggle built on the token system

---

## 12. Implementation status

All phases above are implemented in `index.html`, `css/tokens.css`, `css/styles.css`, and `js/app.js`.

**Verification:** a JSDOM smoke test confirmed seeded rows render, calculations populate, add → row count increments, search filters rows, clear restores them, chart/legend/bar data populates, and no runtime errors occur.

**To run:** open `index.html` in a browser (internet connection needed for Google Fonts and the Chart.js CDN).
