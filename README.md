# khata — Personal Expense Tracker

![Static Badge](https://img.shields.io/badge/license-MIT-215947?style=flat-square)
![Static Badge](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-f6f4ef?style=flat-square)
![Static Badge](https://img.shields.io/badge/build-none-9a5a8e?style=flat-square)

A clean, focused personal expense tracker. No accounts, no backend, no build step — just a browser, a local ledger, and a clear picture of where your money goes.

> **khata** (খাতা) means "notebook" or "ledger" in Bengali.

---

## Features

- **Full expense management** — add, edit, and delete records with date, category, amount (BDT), and description.
- **Smart filtering** — search by text, filter by category, date range, and amount bounds, with removable filter chips and sortable columns.
- **Useful summary** — total spent, average per transaction, top category, and transaction count, all reactive to your current filters.
- **Visual insights**
  - Category doughnut with a custom legend and center total
  - Spending-over-time bars with 1M / 3M / All ranges
  - Ranked "average spending per category" bars
- **Local-first** — everything is stored in `localStorage`. Your data never leaves your browser.
- **Extras** — CSV export of the current view, live footer clock with seconds, scroll-to-top button, and a polished page preloader.
- **Responsive** — a real mobile layout with bottom navigation, a floating add button, and table-to-card transformation.
- **Accessible** — semantic markup, labeled controls, focus states, keyboard-friendly modals, and reduced-motion support.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Markup | Semantic HTML5 |
| Styling | Custom CSS with design tokens (no framework) |
| Charts | [Chart.js 4](https://www.chartjs.org/) via CDN |
| Fonts | [Fraunces](https://fonts.google.com/specimen/Fraunces) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts |
| Logic | Vanilla JavaScript, single `app.js`, no dependencies to install |
| Persistence | `localStorage` |
| Currency | BDT (৳) via `Intl.NumberFormat("en-BD")` |

There is **no package manager, bundler, or build step**.

---

**Repository:** <https://github.com/mstmanirayasmin/khata.git>

---

## Getting started

### Option 0 — clone the repo

```bash
git clone https://github.com/mstmanirayasmin/khata.git
cd khata
```

Then follow Option 1 or Option 2 below.

### Option 1 — just open it

Double-click `index.html`, or open it in your browser. An internet connection is needed for the Chart.js and Google Fonts CDNs; if they're unavailable, the app still works and shows a graceful offline fallback for charts.

### Option 2 — serve it locally (recommended)

```bash
# Python 3
python -m http.server 8000

# or, with Node.js
npx serve .
```

Then visit <http://localhost:8000>.

### First run

The app seeds about 24 realistic sample expenses so the dashboard isn't empty. Add your own, and the sample data is replaced as you go. To clear everything, run this in your browser console:

```js
localStorage.removeItem("khata.expenses.v1");
location.reload();
```

---

## Project structure

```
khata/
├── index.html              # App shell, views, modals, footer
├── css/
│   ├── tokens.css          # Colors, type, spacing, radii, shadows
│   └── styles.css          # Layout, components, responsive rules
├── js/
│   └── app.js              # State, CRUD, filters, calculations, charts, export
├── LICENSE                 # MIT license
├── CONTRIBUTING.md         # How to contribute
├── PLAN.md                 # Design and implementation plan
└── README.md               # This file
```

---

## Design philosophy

This project deliberately avoids the generic "AI-generated dashboard" look: no purple gradients, glass cards, or emoji icons. Instead it uses a warm paper palette, a single forest-green accent, editorial serif typography, hairline borders, restrained shadows, and consistent inline SVG icons. All visual decisions live in `css/tokens.css`, so the theme can be changed from one place.

---

## Customization

- **Colors, fonts, spacing** — edit the variables in `css/tokens.css`.
- **Categories** — edit the `CATEGORIES` array near the top of `js/app.js` (id, label, color, icon).
- **Currency / locale** — change `"en-BD"` in the `Intl.NumberFormat` calls in `js/app.js` and the `৳` labels in `index.html`.
- **Seed data** — edit the `SEED` array in `js/app.js`.
- **Sample reset** — change the `STORAGE_KEY` value to get a fresh ledger without clearing the old one.

---

## Data & privacy

There are no analytics, no network requests for your data, and no server. Expenses stay in your browser's `localStorage` under the key `khata.expenses.v1`. Clearing browser site data removes them permanently — use **Export CSV** first if you want a backup.

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the short version.

---

## License

Released under the [MIT License](LICENSE). Free to use, modify, and distribute — personal or commercial — with attribution.

---

## Author

**Mst. Manira Yasmin** — designed and developed this project.

- GitHub: [@mstmanirayasmin](https://github.com/mstmanirayasmin)
- Repository: [mstmanirayasmin/khata](https://github.com/mstmanirayasmin/khata)

If you find it useful, a star on the repository is appreciated. Issues and pull requests are welcome at <https://github.com/mstmanirayasmin/khata/issues>.
