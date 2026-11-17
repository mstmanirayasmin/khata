/* ==========================================================================
   Khata — Personal Expense Tracker
   Single-file application logic. No framework, no build step.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Icons & categories
     ------------------------------------------------------------------------ */
  const svg = (inner) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const ICONS = {
    food: svg('<path d="M6 3v7a2 2 0 0 0 4 0V3M8 3v18"/><path d="M16 3c-2 2-2.5 5-2.5 8H16V3zM16 11v10"/>'),
    transport: svg('<path d="M3 13l2-5h14l2 5"/><rect x="3" y="13" width="18" height="5" rx="1"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>'),
    shopping: svg('<path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    bills: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>'),
    health: svg('<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>'),
    entertainment: svg('<circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16"/>'),
    other: svg('<circle cx="6" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="6" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="18" r="1.3" fill="currentColor" stroke="none"/>'),
  };

  const CATEGORIES = [
    { id: "food", label: "Food & Dining", color: "#c26b3f" },
    { id: "transport", label: "Transport", color: "#4a6fa5" },
    { id: "shopping", label: "Shopping", color: "#9a5a8e" },
    { id: "bills", label: "Bills & Utilities", color: "#3f7d8c" },
    { id: "health", label: "Health", color: "#b3524e" },
    { id: "entertainment", label: "Entertainment", color: "#b58a2b" },
    { id: "other", label: "Other", color: "#6f7167" },
  ];

  const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

  /* ------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const numFmt = new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const formatNum = (n) => numFmt.format(Number(n) || 0);
  const formatMoney = (n) => "৳" + formatNum(n);

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const daysAgoStr = (n) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const dateFromStr = (s) => new Date(s + "T00:00:00");

  const formatDate = (s) =>
    dateFromStr(s).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });

  const uid = () =>
    (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "e-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

  /* ------------------------------------------------------------------------
     Page preloader — waits for real page readiness with a minimum display
     time, so it never flashes on fast loads or traps the page on slow CDNs.
     ------------------------------------------------------------------------ */
  function initPreloader() {
    const el = document.getElementById("preloader");
    const bar = document.getElementById("preloader-bar");
    if (!el) return;

    document.body.classList.add("is-loading");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    const minShow = reduce ? 150 : 700;
    let finished = false;
    let pct = 8;

    const ticker = setInterval(() => {
      pct = Math.min(pct + 6 + Math.random() * 10, 88);
      if (bar) bar.style.width = pct + "%";
    }, 90);

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(ticker);
      const wait = Math.max(0, minShow - (performance.now() - started));
      setTimeout(() => {
        if (bar) bar.style.width = "100%";
        setTimeout(() => {
          el.classList.add("done");
          document.body.classList.remove("is-loading");
          setTimeout(() => el.remove(), reduce ? 60 : 520);
        }, reduce ? 20 : 160);
      }, wait);
    }

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    setTimeout(finish, 4000); // failsafe
  }

  initPreloader();

  /* ------------------------------------------------------------------------
     Theme — system / light / dark, persisted, with chart repainting
     ------------------------------------------------------------------------ */
  const THEME_KEY = "khata.theme";
  const darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const cssToken = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function storedTheme() {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return ["system", "light", "dark"].indexOf(v) !== -1 ? v : "system";
    } catch (e) {
      return "system";
    }
  }

  let themeMode = storedTheme();
  let palette = {};

  function refreshPalette() {
    palette = {};
    CATEGORIES.forEach((c) => { palette[c.id] = cssToken("--c-" + c.id) || c.color; });
  }

  function resolvedTheme(mode) {
    return mode === "system" ? (darkQuery && darkQuery.matches ? "dark" : "light") : mode;
  }

  function chartTokens() {
    return {
      tick: cssToken("--chart-tick"),
      grid: cssToken("--chart-grid"),
      tooltip: cssToken("--chart-tooltip"),
      tooltipInk: cssToken("--chart-tooltip-ink"),
      bar: cssToken("--chart-bar"),
      barHover: cssToken("--chart-bar-hover"),
      empty: cssToken("--chart-empty"),
    };
  }

  function updateChartTheme() {
    if (typeof Chart === "undefined") return;
    const t = chartTokens();
    Chart.defaults.color = t.tick;
    if (donutChart) {
      donutChart.options.plugins.tooltip.backgroundColor = t.tooltip;
      donutChart.options.plugins.tooltip.titleColor = t.tooltipInk;
      donutChart.options.plugins.tooltip.bodyColor = t.tooltipInk;
      if (donutChart.data.labels[0] === "No data") donutChart.data.datasets[0].backgroundColor = [t.empty];
      donutChart.update();
    }
    if (trendChart) {
      trendChart.options.plugins.tooltip.backgroundColor = t.tooltip;
      trendChart.options.plugins.tooltip.titleColor = t.tooltipInk;
      trendChart.options.plugins.tooltip.bodyColor = t.tooltipInk;
      trendChart.options.scales.y.grid.color = t.grid;
      trendChart.data.datasets[0].backgroundColor = t.bar;
      trendChart.data.datasets[0].hoverBackgroundColor = t.barHover;
      trendChart.update();
    }
  }

  function applyTheme(mode, animate) {
    themeMode = ["system", "light", "dark"].indexOf(mode) !== -1 ? mode : "system";
    const resolved = resolvedTheme(themeMode);
    if (animate) document.documentElement.classList.add("theme-switching");
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-mode", themeMode);
    try { localStorage.setItem(THEME_KEY, themeMode); } catch (e) {}
    refreshPalette();
    $$('[data-action="set-theme"]').forEach((btn) => {
      const active = btn.dataset.mode === themeMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    const meta = document.getElementById("meta-theme-color");
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#141815" : "#f6f4ef");
    updateChartTheme();
    if (animate) setTimeout(() => document.documentElement.classList.remove("theme-switching"), 320);
  }

  /* ------------------------------------------------------------------------
     Seed data & persistence
     ------------------------------------------------------------------------ */
  const SEED = [
    [1, "food", 485, "Dinner with friends"],
    [2, "transport", 160, "CNG to office"],
    [3, "shopping", 2390, "Running shoes"],
    [5, "bills", 1200, "Electricity bill"],
    [6, "food", 320, "Groceries"],
    [8, "entertainment", 550, "Cinema tickets"],
    [10, "food", 275, "Breakfast & coffee"],
    [12, "transport", 480, "Bus ticket home"],
    [14, "health", 900, "Pharmacy"],
    [16, "food", 410, "Lunch combo"],
    [19, "shopping", 860, "Kitchen supplies"],
    [22, "bills", 950, "Internet bill"],
    [25, "food", 360, "Groceries"],
    [27, "transport", 220, "Metro card top-up"],
    [31, "entertainment", 640, "Concert ticket"],
    [35, "food", 295, "Street food"],
    [40, "health", 1500, "Dental checkup"],
    [44, "shopping", 1680, "Winter jacket"],
    [50, "food", 430, "Family dinner"],
    [56, "bills", 1100, "Gas bill"],
    [63, "transport", 720, "Train ticket"],
    [70, "food", 380, "Groceries"],
    [78, "entertainment", 420, "Streaming annual plan"],
    [88, "other", 300, "Miscellaneous"],
  ];

  function seedExpenses() {
    return SEED.map(([days, category, amount, description]) => ({
      id: uid(),
      date: daysAgoStr(days),
      category,
      amount,
      description,
    }));
  }

  const STORAGE_KEY = "khata.expenses.v1";

  function loadExpenses() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedExpenses();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : seedExpenses();
    } catch (e) {
      return seedExpenses();
    }
  }

  function saveExpenses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.expenses));
    } catch (e) {
      toast("Could not save to this browser");
    }
  }

  /* ------------------------------------------------------------------------
     State
     ------------------------------------------------------------------------ */
  const state = {
    expenses: loadExpenses(),
    filters: { search: "", category: "all", from: "", to: "", min: "", max: "" },
    sort: { key: "date", dir: "desc" },
    chartRange: "all",
    editingId: null,
    pendingDeleteId: null,
  };

  /* ------------------------------------------------------------------------
     Selection & calculations
     ------------------------------------------------------------------------ */
  function getFiltered() {
    const f = state.filters;
    const q = f.search.trim().toLowerCase();

    const list = state.expenses.filter((e) => {
      if (f.category !== "all" && e.category !== f.category) return false;
      if (f.from && e.date < f.from) return false;
      if (f.to && e.date > f.to) return false;
      if (f.min !== "" && e.amount < Number(f.min)) return false;
      if (f.max !== "" && e.amount > Number(f.max)) return false;
      if (q) {
        const hay = (e.description + " " + catById(e.category).label).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const { key, dir } = state.sort;
    list.sort((a, b) => {
      let r;
      if (key === "amount") r = a.amount - b.amount;
      else if (key === "category") r = catById(a.category).label.localeCompare(catById(b.category).label);
      else r = a.date.localeCompare(b.date);
      if (r === 0) r = a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      return dir === "asc" ? r : -r;
    });
    return list;
  }

  function summarize(list) {
    const total = list.reduce((s, e) => s + e.amount, 0);
    const byCat = {};
    list.forEach((e) => {
      if (!byCat[e.category]) byCat[e.category] = { total: 0, count: 0 };
      byCat[e.category].total += e.amount;
      byCat[e.category].count += 1;
    });
    const top = Object.entries(byCat)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total)[0] || null;
    return {
      total,
      count: list.length,
      avg: list.length ? total / list.length : 0,
      byCat,
      top,
    };
  }

  function getTrend(list, mode) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const buckets = [];
    let bucketOf;

    if (mode === "1M") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        buckets.push(`${d.getMonth() + 1}/${d.getDate()}`);
      }
      bucketOf = (e) => 29 - Math.floor((now - dateFromStr(e.date)) / 86400000);
    } else if (mode === "3M") {
      for (let i = 12; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        buckets.push(`${start.getMonth() + 1}/${start.getDate()}`);
      }
      bucketOf = (e) => 12 - Math.floor(Math.floor((now - dateFromStr(e.date)) / 86400000) / 7);
    } else {
      const keys = new Set();
      list.forEach((e) => {
        const d = dateFromStr(e.date);
        keys.add(d.getFullYear() * 12 + d.getMonth());
      });
      keys.add(now.getFullYear() * 12 + now.getMonth());
      const sorted = Array.from(keys).sort((a, b) => a - b);
      sorted.forEach((k) => buckets.push(new Date(Math.floor(k / 12), k % 12, 1).toLocaleString("en-US", { month: "short" })));
      bucketOf = (e) => {
        const d = dateFromStr(e.date);
        return sorted.indexOf(d.getFullYear() * 12 + d.getMonth());
      };
    }

    const values = buckets.map(() => 0);
    list.forEach((e) => {
      const i = bucketOf(e);
      if (i >= 0 && i < buckets.length) values[i] += e.amount;
    });
    return { labels: buckets, values };
  }

  /* ------------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------------ */
  const dom = {};

  function cacheDom() {
    [
      "search", "clear-top", "context-line", "stat-total", "stat-total-meta",
      "stat-avg", "stat-avg-meta", "stat-top", "stat-top-meta", "stat-count",
      "stat-count-meta", "donut-total", "trend-sub", "cat-bars", "filter-category",
      "filter-from", "filter-to", "filter-min", "filter-max", "chips", "tx-body",
      "result-count", "tx-foot-left", "tx-foot-right", "form-overlay", "form-title",
      "form-sub", "expense-form", "f-date", "f-category", "f-amount", "f-desc", "form-error", "donut-legend",
      "form-submit", "confirm-overlay", "confirm-text", "toasts",
    ].forEach((id) => (dom[id] = document.getElementById(id)));
    dom.donutChart = $("#donutChart");
    dom.trendChart = $("#trendChart");
  }

  function renderSummary(s, list) {
    dom["stat-total"].innerHTML = `<span class="cur">৳</span>${formatNum(s.total)}`;
    dom["stat-total-meta"].textContent = list.length ? `Across ${list.length} expense${list.length === 1 ? "" : "s"}` : "Nothing in this view";

    dom["stat-avg"].innerHTML = `<span class="cur">৳</span>${formatNum(s.avg)}`;
    dom["stat-avg-meta"].textContent = list.length ? "Per recorded expense" : "—";

    if (s.top) {
      const c = catById(s.top.id);
      dom["stat-top"].textContent = c.label;
      dom["stat-top"].style.color = palette[c.id] || c.color;
      dom["stat-top-meta"].innerHTML = `<strong>${formatMoney(s.top.total)}</strong> · ${s.top.count} entr${s.top.count === 1 ? "y" : "ies"}`;
    } else {
      dom["stat-top"].textContent = "—";
      dom["stat-top"].style.color = "";
      dom["stat-top-meta"].textContent = "No spending yet";
    }

    dom["stat-count"].textContent = formatNum(s.count);
    const dates = list.map((e) => e.date).sort();
    dom["stat-count-meta"].textContent = dates.length
      ? `From ${formatDate(dates[0])}`
      : "In this view";

    dom["donut-total"].textContent = formatMoney(s.total);

    const total = state.expenses.length;
    dom["context-line"].textContent = total
      ? `${total} expense${total === 1 ? "" : "s"} recorded. Everything is saved locally.`
      : "Your ledger is ready — add your first expense.";
  }

  let donutChart = null;
  let trendChart = null;

  function initCharts() {
    if (typeof Chart === "undefined") {
      dom.donutChart.parentElement.innerHTML = '<p style="color:var(--muted);font-size:.82rem">Charts unavailable (offline).</p>';
      dom.trendChart.parentElement.innerHTML = '<p style="color:var(--muted);font-size:.82rem">Charts unavailable (offline).</p>';
      return;
    }
    const t = chartTokens();
    Chart.defaults.font.family = "DM Sans, sans-serif";
    Chart.defaults.color = t.tick;

    donutChart = new Chart(dom.donutChart, {
      type: "doughnut",
      data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 6 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: t.tooltip,
            titleColor: t.tooltipInk,
            bodyColor: t.tooltipInk,
            padding: 10,
            cornerRadius: 8,
            callbacks: { label: (ctx) => ` ${ctx.label}: ${formatMoney(ctx.raw)}` },
          },
        },
      },
    });

    trendChart = new Chart(dom.trendChart, {
      type: "bar",
      data: { labels: [], datasets: [{ data: [], backgroundColor: t.bar, hoverBackgroundColor: t.barHover, borderRadius: 5, borderSkipped: false, maxBarThickness: 38 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: t.tooltip,
            titleColor: t.tooltipInk,
            bodyColor: t.tooltipInk,
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: { title: (items) => items[0].label, label: (ctx) => ` ${formatMoney(ctx.raw)}` },
          },
        },
        scales: {
          x: { grid: { display: false, drawBorder: false }, ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
          y: { beginAtZero: true, grid: { color: t.grid, drawBorder: false }, border: { display: false }, ticks: { font: { size: 10 }, callback: (v) => "৳" + formatNum(v) } },
        },
      },
    });
  }

  function renderCharts(s, list) {
    if (donutChart) {
      const entries = CATEGORIES.map((c) => ({ c, d: s.byCat[c.id] })).filter((x) => x.d && x.d.total > 0);
      if (entries.length) {
        donutChart.data.labels = entries.map((x) => x.c.label);
        donutChart.data.datasets[0].data = entries.map((x) => x.d.total);
        donutChart.data.datasets[0].backgroundColor = entries.map((x) => palette[x.c.id] || x.c.color);
        const grand = entries.reduce((sum, x) => sum + x.d.total, 0) || 1;
        dom["donut-legend"].innerHTML = entries.map((x) => `
          <span class="legend-item"><span class="cat-dot" style="background:${palette[x.c.id] || x.c.color}"></span>${esc(x.c.label)}
            <span class="legend-pct">${Math.round((x.d.total / grand) * 100)}%</span></span>
        `).join("");
      } else {
        donutChart.data.labels = ["No data"];
        donutChart.data.datasets[0].data = [1];
        donutChart.data.datasets[0].backgroundColor = [chartTokens().empty];
        dom["donut-legend"].innerHTML = '<span style="color:var(--muted);font-size:.78rem">No spending yet</span>';
      }
      donutChart.update();
    }

    if (trendChart) {
      const t = getTrend(list, state.chartRange);
      trendChart.data.labels = t.labels;
      trendChart.data.datasets[0].data = t.values;
      trendChart.update();
      dom["trend-sub"].textContent =
        state.chartRange === "1M" ? "Daily totals, last 30 days"
        : state.chartRange === "3M" ? "Weekly totals, last 90 days"
        : "Monthly totals, all time";
    }
  }

  function renderCategoryBars(s) {
    const entries = CATEGORIES.map((c) => {
      const d = s.byCat[c.id];
      return d ? { c, avg: d.total / d.count, count: d.count, total: d.total } : null;
    }).filter(Boolean).sort((a, b) => b.avg - a.avg);

    if (!entries.length) {
      dom["cat-bars"].innerHTML = '<p style="color:var(--muted);font-size:.82rem">No spending data to average yet.</p>';
      return;
    }

    const max = Math.max.apply(null, entries.map((e) => e.avg)) || 1;
    dom["cat-bars"].innerHTML = entries.map((e) => `
      <div class="cat-row">
        <div class="cat-name"><span class="cat-dot" style="background:${palette[e.c.id] || e.c.color}"></span>${esc(e.c.label)}</div>
        <div class="cat-track"><div class="cat-fill" style="width:${(e.avg / max) * 100}%;background:${palette[e.c.id] || e.c.color}"></div></div>
        <div class="cat-amount num">${formatMoney(e.avg)}<span style="color:var(--muted);font-weight:400"> /tx</span></div>
      </div>
    `).join("");
  }

  function renderChips() {
    const f = state.filters;
    const chips = [];
    if (f.search.trim()) chips.push(["search", `Search: "${esc(f.search.trim())}"`]);
    if (f.category !== "all") chips.push(["category", catById(f.category).label]);
    if (f.from || f.to) chips.push(["dates", `${f.from ? formatDate(f.from) : "…"} → ${f.to ? formatDate(f.to) : "…"}`]);
    if (f.min !== "" || f.max !== "") chips.push(["amount", `৳${f.min || "0"} – ${f.max ? "৳" + f.max : "any"}`]);

    dom.chips.innerHTML = chips.map(([key, label]) => `
      <span class="chip">${label}<button data-clear-filter="${key}" aria-label="Remove filter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button></span>
    `).join("");
  }

  function renderTransactions(list) {
    const tbody = dom["tx-body"];

    if (!list.length) {
      tbody.innerHTML = `
        <tr><td colspan="5" style="padding:0">
          <div class="empty">
            <div class="empty-glyph">${svg('<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>')}</div>
            <h3>Nothing here yet</h3>
            <p>${state.expenses.length ? "No expenses match your filters. Try clearing a few." : "Add your first expense to start seeing your spending clearly."}</p>
            <button class="btn btn-ghost" data-action="${state.expenses.length ? "clear-filters" : "open-add"}">${state.expenses.length ? "Clear filters" : "Add an expense"}</button>
          </div>
        </td></tr>`;
    } else {
      tbody.innerHTML = list.map((e) => {
        const c = catById(e.category);
        return `<tr>
          <td class="tx-date" data-label="Date">${formatDate(e.date)}</td>
          <td data-label="Category">
            <span class="tx-cat"><span class="cat-icon" style="background:${palette[c.id] || c.color}1a;color:${palette[c.id] || c.color}">${ICONS[c.id]}</span>${esc(c.label)}</span>
          </td>
          <td data-label="Description" class="tx-desc ${e.description ? "" : "muted"}">${e.description ? esc(e.description) : "No description"}</td>
          <td class="tx-amount tx-amount-cell" data-label="Amount">${formatMoney(e.amount)}</td>
          <td class="tx-actions tx-actions-cell" data-label="Actions">
            <div class="action-group">
              <button class="icon-btn" data-action="edit" data-id="${esc(e.id)}" aria-label="Edit ${esc(e.description || "expense")}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
              </button>
              <button class="icon-btn danger" data-action="delete" data-id="${esc(e.id)}" aria-label="Delete ${esc(e.description || "expense")}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      }).join("");
    }

    const filtered = list.length;
    dom["result-count"].textContent = `Showing ${filtered} of ${state.expenses.length}`;
    dom["tx-foot-left"].textContent = filtered ? `${filtered} record${filtered === 1 ? "" : "s"} in view` : "No records";
    dom["tx-foot-right"].innerHTML = filtered ? `Sum: <strong class="num">${formatMoney(list.reduce((s, e) => s + e.amount, 0))}</strong>` : "";
  }

  function renderSortIndicators() {
    $$(".tx-table th.sortable").forEach((th) => {
      const active = th.dataset.sort === state.sort.key;
      th.classList.toggle("sorted", active);
      th.querySelector(".arrow").textContent = active ? (state.sort.dir === "asc" ? "↑" : "↓") : "↕";
    });
  }

  function render() {
    const list = getFiltered();
    const s = summarize(list);
    renderSummary(s, list);
    renderCharts(s, list);
    renderCategoryBars(s);
    renderChips();
    renderTransactions(list);
    renderSortIndicators();
    syncFilterInputs();
  }

  function syncFilterInputs() {
    const f = state.filters;
    const set = (el, val) => { if (el && el.value !== val) el.value = val; };
    set(dom.search, f.search);
    set(dom["filter-category"], f.category);
    set(dom["filter-from"], f.from);
    set(dom["filter-to"], f.to);
    set(dom["filter-min"], f.min);
    set(dom["filter-max"], f.max);
  }

  /* ------------------------------------------------------------------------
     Toasts
     ------------------------------------------------------------------------ */
  function toast(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>${esc(message)}</span>`;
    dom.toasts.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 250);
    }, 2600);
  }

  /* ------------------------------------------------------------------------
     Modal: add / edit
     ------------------------------------------------------------------------ */
  function openForm(id) {
    dom["form-error"].classList.remove("show");
    dom["form-error"].textContent = "";

    if (id) {
      const e = state.expenses.find((x) => x.id === id);
      if (!e) return;
      state.editingId = id;
      dom["form-title"].textContent = "Edit expense";
      dom["form-sub"].textContent = "Update the details below.";
      dom["form-submit"].textContent = "Save changes";
      dom["f-date"].value = e.date;
      dom["f-category"].value = e.category;
      dom["f-amount"].value = e.amount;
      dom["f-desc"].value = e.description || "";
    } else {
      state.editingId = null;
      dom["form-title"].textContent = "New expense";
      dom["form-sub"].textContent = "Add a record to your ledger.";
      dom["form-submit"].textContent = "Save expense";
      dom["expense-form"] && dom["expense-form"].reset();
      dom["f-date"].value = todayStr();
      dom["f-category"].value = CATEGORIES[0].id;
      dom["f-amount"].value = "";
      dom["f-desc"].value = "";
    }
    dom["form-overlay"].classList.add("open");
    setTimeout(() => dom["f-date"].focus(), 60);
  }

  function closeForm() {
    dom["form-overlay"].classList.remove("open");
    state.editingId = null;
  }

  function submitForm(ev) {
    ev.preventDefault();
    const date = dom["f-date"].value;
    const category = dom["f-category"].value;
    const amount = parseFloat(dom["f-amount"].value);
    const description = dom["f-desc"].value.trim();

    let error = "";
    if (!date) error = "Please choose a date.";
    else if (!CATEGORIES.some((c) => c.id === category)) error = "Please choose a valid category.";
    else if (!isFinite(amount) || amount <= 0) error = "Enter an amount greater than zero.";

    if (error) {
      dom["form-error"].textContent = error;
      dom["form-error"].classList.add("show");
      return;
    }

    if (state.editingId) {
      const e = state.expenses.find((x) => x.id === state.editingId);
      if (e) Object.assign(e, { date, category, amount, description });
      toast("Expense updated");
    } else {
      state.expenses.push({ id: uid(), date, category, amount, description });
      toast("Expense added");
    }
    saveExpenses();
    closeForm();
    render();
  }

  /* ------------------------------------------------------------------------
     Modal: confirm delete
     ------------------------------------------------------------------------ */
  function requestDelete(id) {
    const e = state.expenses.find((x) => x.id === id);
    if (!e) return;
    state.pendingDeleteId = id;
    dom["confirm-text"].textContent = `“${e.description || catById(e.category).label}” — ${formatMoney(e.amount)} on ${formatDate(e.date)} will be removed.`;
    dom["confirm-overlay"].classList.add("open");
  }

  function closeConfirm() {
    dom["confirm-overlay"].classList.remove("open");
    state.pendingDeleteId = null;
  }

  function confirmDelete() {
    if (!state.pendingDeleteId) return;
    state.expenses = state.expenses.filter((x) => x.id !== state.pendingDeleteId);
    saveExpenses();
    closeConfirm();
    render();
    toast("Expense deleted");
  }

  /* ------------------------------------------------------------------------
     Filters & export
     ------------------------------------------------------------------------ */
  function clearFilters() {
    state.filters = { search: "", category: "all", from: "", to: "", min: "", max: "" };
    render();
  }

  function exportCsv() {
    const list = getFiltered();
    if (!list.length) {
      toast("Nothing to export");
      return;
    }
    const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const rows = [["Date", "Category", "Amount (BDT)", "Description"]];
    list.forEach((e) => rows.push([e.date, catById(e.category).label, e.amount, e.description || ""]));
    const csv = rows.map((r) => r.map(q).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khata-expenses-${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  }

  /* ------------------------------------------------------------------------
     Events
     ------------------------------------------------------------------------ */
  function bindEvents() {
    document.addEventListener("click", (ev) => {
      const actionEl = ev.target.closest("[data-action]");
      if (actionEl) {
        switch (actionEl.dataset.action) {
          case "open-add": openForm(null); break;
          case "close-modal": closeForm(); break;
          case "cancel-delete": closeConfirm(); break;
          case "confirm-delete": confirmDelete(); break;
          case "clear-filters": clearFilters(); break;
          case "export": exportCsv(); break;
          case "toggle-theme": applyTheme(resolvedTheme(themeMode) === "dark" ? "light" : "dark", true); render(); break;
          case "set-theme": applyTheme(actionEl.dataset.mode, true); render(); break;
          case "edit": openForm(actionEl.dataset.id); break;
          case "delete": requestDelete(actionEl.dataset.id); break;
        }
        return;
      }

      const clearEl = ev.target.closest("[data-clear-filter]");
      if (clearEl) {
        const key = clearEl.dataset.clearFilter;
        if (key === "search") state.filters.search = "";
        if (key === "category") state.filters.category = "all";
        if (key === "dates") { state.filters.from = ""; state.filters.to = ""; }
        if (key === "amount") { state.filters.min = ""; state.filters.max = ""; }
        render();
        return;
      }

      const scrollEl = ev.target.closest("[data-scroll]");
      if (scrollEl) {
        const target = document.getElementById(scrollEl.dataset.scroll);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        $$("[data-scroll]").forEach((b) => b.classList.toggle("active", b.dataset.scroll === scrollEl.dataset.scroll));
        return;
      }

      const sortEl = ev.target.closest("[data-sort]");
      if (sortEl) {
        const key = sortEl.dataset.sort;
        if (state.sort.key === key) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
        else state.sort = { key, dir: "desc" };
        render();
        return;
      }

      const rangeEl = ev.target.closest("[data-range]");
      if (rangeEl) {
        state.chartRange = rangeEl.dataset.range;
        $$("#range-toggle button").forEach((b) => b.classList.toggle("active", b === rangeEl));
        renderCharts(summarize(getFiltered()), getFiltered());
        return;
      }

      if (ev.target.classList.contains("overlay")) {
        if (ev.target.id === "form-overlay") closeForm();
        if (ev.target.id === "confirm-overlay") closeConfirm();
      }
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (dom["confirm-overlay"].classList.contains("open")) closeConfirm();
        else if (dom["form-overlay"].classList.contains("open")) closeForm();
      }
    });

    dom["expense-form"] && dom["expense-form"].addEventListener("submit", submitForm);

    dom.search.addEventListener("input", (e) => { state.filters.search = e.target.value; render(); });
    dom["filter-category"].addEventListener("change", (e) => { state.filters.category = e.target.value; render(); });
    dom["filter-from"].addEventListener("change", (e) => { state.filters.from = e.target.value; render(); });
    dom["filter-to"].addEventListener("change", (e) => { state.filters.to = e.target.value; render(); });
    dom["filter-min"].addEventListener("input", (e) => { state.filters.min = e.target.value; render(); });
    dom["filter-max"].addEventListener("input", (e) => { state.filters.max = e.target.value; render(); });
  }

  function populateSelects() {
    const options = CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join("");
    dom["filter-category"].innerHTML = '<option value="all">All categories</option>' + options;
    dom["f-category"].innerHTML = options;
  }

  /* ------------------------------------------------------------------------
     Init
     ------------------------------------------------------------------------ */
  function init() {
    cacheDom();
    applyTheme(themeMode, false);
    populateSelects();
    initCharts();
    bindEvents();
    render();

    // In "system" mode, follow OS theme changes live.
    if (darkQuery && darkQuery.addEventListener) {
      darkQuery.addEventListener("change", () => {
        if (themeMode === "system") { applyTheme("system", true); render(); }
      });
    }

    // Scroll-to-top control.
    const toTop = document.getElementById("to-top");
    if (toTop) {
      const update = () => toTop.classList.toggle("show", window.scrollY > 400);
      window.addEventListener("scroll", update, { passive: true });
      update();
      toTop.addEventListener("click", () => {
        const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      });
    }

    // Live footer clock, ticking every second.
    const clock = document.getElementById("live-clock");
    if (clock) {
      const tickClock = () => {
        clock.textContent = new Date().toLocaleString("en-BD", {
          weekday: "short", day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        });
      };
      tickClock();
      setInterval(tickClock, 1000);
    }

    // Keep the nav highlight in sync while scrolling.
    if ("IntersectionObserver" in window) {
      const sections = ["overview", "insights", "transactions"].map((id) => document.getElementById(id));
      const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) $$('[data-scroll="' + visible.target.id + '"]').forEach((b) => {
            $$("[data-scroll]").forEach((x) => x.classList.remove("active"));
            b.classList.add("active");
          });
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.2, 0.5] }
      );
      sections.forEach((s) => s && obs.observe(s));
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
