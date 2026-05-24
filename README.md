# Taiwan Carbon Tools · 台灣永續經營儀表板

> Free, browser-based **business + carbon** tools for Taiwan sustainable farmers — built with official emission factors and a "heart → business mindset" mission.
> 為台灣永續農戶打造的免費、純瀏覽器、經營決策 + 碳追蹤工具。

[Live · 線上版本](https://anren1117-lang.github.io/taiwan-carbon-tools/) · MIT License

---

## What this is

Sustainable farmers in Taiwan often have the heart (passion, ecological care) but get crushed on the business side. This project is a free toolkit that gives them a **business brain on top of their heart**: pricing, cash flow, margin, subsidies, negotiation prep, peer comparison, and yes — carbon tracking too, but carbon is just one input into business decisions, not the goal.

Everything runs in the browser. Zero backend. Zero data collection. URL fragment encoding (`#data=<base64>`) acts as a free, no-account "save" mechanism.

---

## The toolkit

### Public calculators (everyone)

| File | What it does |
|---|---|
| [`index.html`](index.html) | Landing page |
| [`household.html`](household.html) | Household carbon footprint — bills, fuel, flights, diet |
| [`business.html`](business.html) | SME inventory — Scope 1/2/3 + 2026 carbon fee simulator |
| [`farm.html`](farm.html) | Farm carbon inventory — Scope 1/2/3 + soil organic carbon sinks |

### Farm Sustainability + Operations Dashboard

The flagship. Run `farm-dashboard.html` with a farm config (URL fragment, `?id=<sample>`, or local edits in the drawer) and you get:

#### 🎯 At the top
- **Welcome guide** (first-time, dismissible)
- **Money Hero** — cost / income / per-kg intensity
- **Top 3 Actions** — synthesized priorities for this month, with priority cards + CTA links
- **Weekly Check-in** — 4 quick toggles + 1 line of notes per week, with streak counter

#### 📈 Group 01: Business Decisions
- **Sustainable Operations Advisor** — buyer negotiation role-play + carbon priority planner
- **Cash Flow Calendar** — monthly income/expense by crop seasonality, gap-month detection
- **Pricing Studio** — cost-up × 7 channels × 3 tiers + copy-paste outreach openers
- **Goal Tracker** — 4 annual goals with calendar-pace verdict (stored per-farm in localStorage)
- **Peer Comparison** — your numbers vs the 4 sample farms, best/worst highlighted
- **Practice ROI Switchboard** — 8 practices ranked by payback months for your farm size
- **Subsidies & Carbon Income** — 6 Taiwan programs with eligibility check + draft application generator for each eligible one
- **Resource & Market Matching** — channels you can access today
- **Survival Guide** — viability scorecard + cert ladder + supply chain + market routes + concentration risk + diversification opportunities + 7 business mindset cards
- **Reduction Roadmap** — actions with ROI
- **Farm ERP** — daily log + inventory + ledger + contacts (local-only)

#### 🌿 Group 02: Carbon Deep Dive
- KPIs / narrative / electricity chart / per-kg intensity / data sources / scope breakdown / sinks / fuels + scope 3 / renewables / what-if scenarios

### Buyer-facing outputs

| File | What it does |
|---|---|
| [`farm-pitch.html`](farm-pitch.html) | A4 print-ready buyer pitch sheet: story, practices, certs, soil C, suggested prices, QR to live dashboard |
| [`farm-buyer.html`](farm-buyer.html) | Verified carbon footprint share view (with QR + printable) |
| [`farms.html`](farms.html) | Public gallery of sample dashboards |
| [`farm-onboard.html`](farm-onboard.html) | Self-serve 3-step wizard — fill in once, get a URL "account" |

### Shared engine

| File | What it does |
|---|---|
| [`farm-carbon-engine.js`](farm-carbon-engine.js) | Shared math, emission factors, calc — used by every farm page |
| `farms/<id>.json` | One file per sample farm |

---

## Two ways to "register" a farm

### Self-serve (URL as account)

The `farm-onboard.html` wizard outputs a base64-encoded JSON appended to `farm-dashboard.html#data=<...>`. **The URL IS the account.** Bookmark it = saved. Share it = shared. No backend, no signup, no password.

Optional: add a `token` field to the JSON for URL-guess protection (`?t=<token>` required to load).

### File-based (consulting / demo farms)

1. Either fill in [`farm-onboard.html`](farm-onboard.html) and download the JSON, **or** copy an existing `farms/*.json` and edit
2. Save as `farms/<some-id>.json` (lowercase letters / digits / hyphens)
3. Visit `farm-dashboard.html?id=<some-id>` — works without `?t=` if no token set (this is how the 4 sample farms work)

### Sample farms shipped in this repo

- [`farms/demo.json`](farms/demo.json) — Yunlin leafy vegetables, central region
- [`farms/chen-rice-yilan.json`](farms/chen-rice-yilan.json) — Yilan rice with AWD water management (north)
- [`farms/wei-dairy-changhua.json`](farms/wei-dairy-changhua.json) — Changhua dairy + layers (central)
- [`farms/lai-mango-pingtung.json`](farms/lai-mango-pingtung.json) — Pingtung Aiwen mango, carbon-negative (south)

---

## Emission factors

All factors live in `farm-carbon-engine.js`. Provenance:

| Source | Factor | Provenance |
|---|---|---|
| Grid electricity | 0.474 kg CO₂e/kWh | MOEA Energy Administration 2024 |
| Diesel | 2.606 kg/L | MOENV emission factor database v7.0.4 |
| Gasoline | 2.27 kg/L | MOENV v7.0.4 |
| LPG | 2.99 kg/kg | IPCC default |
| Heating oil | 2.68 kg/L | MOENV v7.0.4 |
| N fertilizer (direct N₂O) | 4.29 kg/kg N | IPCC 1% N₂O-N × 44/28 × 273 GWP100 |
| Rice CH₄ | 2,970 kg/ha-yr × mgmt scale | IPCC 2019 Refinement (subtropical, single-season) |
| Rice mgmt scaling | continuous_flood ×1.00 / single_drainage ×0.71 / awd ×0.55 / upland ×0.27 | IPCC 2019 Refinement Table 5.12 |
| Livestock (per head-yr) | dairy 4000 / beef 1800 / sow 280 / grower pig 150 / layer 4 / broiler 1 | IPCC Vol 4 Tables 10.10 / 10.16 |
| SOC sinks (kg CO₂e/ha-yr) | cover crop 1100 / no-till 500 / compost 800 / residue 400 | IPCC 2019 Refinement Tier 1 (subtropical moist) |
| Biochar | 3.0 kg CO₂e/kg applied | typical carbon-fraction × stability |
| Trees | 22 kg CO₂e/tree-yr | mature mixed-species mean |
| Stacking penalty | 2 practices ×0.80 / 3+ ×0.65 | SOC saturation |

---

## Local dev

```bash
git clone https://github.com/anren1117-lang/taiwan-carbon-tools.git
cd taiwan-carbon-tools
python3 -m http.server 8000
# visit http://localhost:8000
```

No build step, no npm, no backend. Edit any `.html`, refresh.

---

## Disclaimer

**This is an educational + decision-support estimator.** It is *not* a substitute for:

- A formal **ISO 14064-1** organisational GHG inventory
- Third-party verification by an accredited body
- Statutory reporting under Taiwan's *氣候變遷因應法* or the Carbon Fee regulations
- Carbon credit issuance under Verra VM0042 / Gold Standard / Taiwan's voluntary mechanism

The subsidy application drafts, pricing recommendations, ROI projections, and per-channel margin estimates are conservative starting points — verify with the relevant agency / buyer / supplier before acting.

---

## License & Author

MIT — see [LICENSE](LICENSE).

Built by **何安仁 An-Ren Ho** (Taiwan). Contact: [anren.carbon@gmail.com](mailto:anren.carbon@gmail.com)

---

## 中文簡介

這是為台灣永續農戶設計的免費網頁工具。除了碳足跡計算，重點是把「永續耕作」變成可營運的「永續事業」：實際毛利、定價地板、議價籌碼、現金流缺口、補助申請草稿、買家對話劇本、年度目標追蹤、同儕比較、副業多元化建議、本月該做的 3 件事。

**不需要註冊**：URL 就是你的帳號。在 `farm-onboard.html` 填一次資料，產出的網址用書籤存下來就好。

**不收集任何資料**：所有運算在你的瀏覽器執行，無後端、無 cookie、無分析。

打開 [`farm-dashboard.html`](farm-dashboard.html) 看完整面板，或 [`farm-pitch.html`](farm-pitch.html) 產出 A4 列印的買家提案單。
