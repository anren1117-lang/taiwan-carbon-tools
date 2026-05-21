# Taiwan Carbon Tools · 台灣碳排工具

> Free, open-source carbon footprint tools for Taiwan — built with official emission factors.
> 採用台灣官方排放係數的免費開源碳足跡工具。

[Live · 線上版本](https://anren1117-lang.github.io/taiwan-carbon-tools/) · MIT License

---

## English

This repository now hosts two related-but-distinct things:

### A. Free public calculators

Zero-dependency, browser-based, Traditional Chinese + English:

| File | What it does |
|---|---|
| [`index.html`](index.html) | Landing page linking to all tools |
| [`household.html`](household.html) | Household carbon footprint — bills, fuel, flights, diet |
| [`business.html`](business.html) | SME inventory — Scope 1/2/3 + 2026 carbon fee simulator |
| [`farm.html`](farm.html) | Farm inventory — Scope 1/2/3 + soil organic carbon sinks |

All four use only Taiwan-government emission factors and run entirely in the browser. No data is collected.

### B. Per-client consulting dashboards

A multi-tenant carbon dashboard system the advisor (An-Ren Ho) uses with paying consulting clients.

| File | What it does |
|---|---|
| [`consulting.html`](consulting.html) | Public consulting offer + pricing |
| [`farms.html`](farms.html) | Public gallery of sample dashboards |
| [`farm-onboard.html`](farm-onboard.html) | Self-serve 3-step wizard that outputs a farm JSON |
| [`farm-dashboard.html?id=<farm>`](farm-dashboard.html) | Consulting view of one specific farm |
| [`farm-buyer.html?id=<farm>`](farm-buyer.html) | Buyer-facing share view (with QR + printable) |
| [`farm-carbon-engine.js`](farm-carbon-engine.js) | Shared math, factors, calc — used by both pages |
| `farms/<id>.json` | One file per client/farm. Drop a new one, get a working dashboard. |

#### Adding a new farm

1. Either fill in [`farm-onboard.html`](farm-onboard.html) and download the JSON, **or** copy an existing `farms/*.json` and edit
2. Save as `farms/<some-id>.json` (use lowercase letters, digits, hyphens — matches the URL slug)
3. Visit `farm-dashboard.html?id=<some-id>&t=<token>` and `farm-buyer.html?id=<some-id>&t=<token>` — both URLs are listed in the wizard's step 3
4. Send the buyer URL to the client / their buyers

If the JSON has no `token` field, the URLs work without `&t=` — that's the demo / public-showcase pattern used for the four sample farms.

#### Sample farms shipped in this repo

- [`farms/demo.json`](farms/demo.json) — Yunlin leafy vegetables (2.5 ha)
- [`farms/chen-rice-yilan.json`](farms/chen-rice-yilan.json) — Yilan rice with AWD water mgmt (1.8 ha)
- [`farms/wei-dairy-changhua.json`](farms/wei-dairy-changhua.json) — Changhua dairy, 8 cows + 200 layers (1.5 ha)
- [`farms/lai-mango-pingtung.json`](farms/lai-mango-pingtung.json) — Pingtung Aiwen mango orchard, carbon-negative (2.2 ha)

### Emission factors (in `farm-carbon-engine.js`)

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

### Local dev

```bash
git clone https://github.com/anren1117-lang/taiwan-carbon-tools.git
cd taiwan-carbon-tools
python3 -m http.server 8000
# visit http://localhost:8000
```

No build step, no npm, no backend. All HTML/CSS/JS.

### Disclaimer

**This is an educational + consulting estimator.** It is *not* a substitute for:

- A formal **ISO 14064-1** organisational GHG inventory
- Third-party verification by an accredited body
- Statutory reporting under Taiwan's *氣候變遷因應法* or the Carbon Fee regulations
- Carbon credit issuance under Verra VM0042 / Gold Standard / Taiwan's voluntary mechanism

For those purposes, engage a qualified verification body. The dashboard does the data-collection, methodology-transparency, and decision-support layers that *precede* formal verification.

### License

MIT — see [LICENSE](LICENSE).

### Author

Built by **何安仁 An-Ren Ho** (18, Taiwan). Contact: [anren.carbon@gmail.com](mailto:anren.carbon@gmail.com)

---

## 中文

本專案目前含兩個彼此相關但目的不同的部分：

### A. 免費公開計算器

零相依、純瀏覽器、繁中 + 英文：

| 檔案 | 功能 |
|---|---|
| [`index.html`](index.html) | 首頁，連結所有工具 |
| [`household.html`](household.html) | 家庭碳足跡 — 帳單、油費、航班、飲食 |
| [`business.html`](business.html) | 中小企業盤查 — 範疇一二三 + 2026 碳費試算 |
| [`farm.html`](farm.html) | 農場盤查 — 範疇一二三 + 土壤有機碳匯估算 |

四個工具都僅使用台灣官方排放係數，全程在瀏覽器執行，零資料蒐集。

### B. 諮詢端的客戶儀表板系統

由顧問（何安仁）對付費客戶提供的多租戶碳儀表板系統。

| 檔案 | 功能 |
|---|---|
| [`consulting.html`](consulting.html) | 公開的諮詢方案與定價 |
| [`farms.html`](farms.html) | 公開的示範儀表板畫廊 |
| [`farm-onboard.html`](farm-onboard.html) | 自助 3 步驟設定精靈，輸出農場 JSON |
| [`farm-dashboard.html?id=<farm>`](farm-dashboard.html) | 單一農場的顧問端儀表板 |
| [`farm-buyer.html?id=<farm>`](farm-buyer.html) | 對買方的分享頁（含 QR、可列印） |
| [`farm-carbon-engine.js`](farm-carbon-engine.js) | 兩個頁面共用的數學引擎與排放係數 |
| `farms/<id>.json` | 每個客戶一份 JSON。新增即生效。 |

#### 新增一個農場

1. 填寫 [`farm-onboard.html`](farm-onboard.html) 並下載 JSON，**或**複製既有的 `farms/*.json` 編輯
2. 存檔為 `farms/<某代號>.json`（小寫英數字與連字號）
3. 開啟 `farm-dashboard.html?id=<代號>&t=<token>` 與 `farm-buyer.html?id=<代號>&t=<token>` — 精靈的第 3 步會列出兩個完整 URL
4. 把買方分享頁的 URL 傳給客戶或其下游買方

JSON 沒有 `token` 欄位時，URL 不需要 `&t=` 也能載入 — 那是公開示範模式（本專案的四個示範農場即是如此）。

#### 本專案內附的示範農場

- [`farms/demo.json`](farms/demo.json) — 雲林葉菜農場（2.5 公頃）
- [`farms/chen-rice-yilan.json`](farms/chen-rice-yilan.json) — 宜蘭水稻 + AWD 間歇灌溉（1.8 公頃）
- [`farms/wei-dairy-changhua.json`](farms/wei-dairy-changhua.json) — 彰化酪農，8 頭乳牛 + 200 隻蛋雞（1.5 公頃）
- [`farms/lai-mango-pingtung.json`](farms/lai-mango-pingtung.json) — 屏東愛文芒果園，淨碳負（2.2 公頃）

### 排放係數（位於 `farm-carbon-engine.js`）

詳細英文表格如上。主要包括：

- 電力 0.474 kg CO₂e/kWh — 經濟部能源署 2024 年
- 燃料係數 — 環境部排放係數管理表 v7.0.4
- 氮肥 N₂O — IPCC Tier 1 預設值（1% × GWP100 273）
- 水稻 CH₄ — IPCC 2019 Refinement，含水管理係數
- 牲畜 — IPCC Vol 4 表 10.10 / 10.16（依乳牛/肉牛/母豬/育成豬/蛋雞/肉雞分類）
- 土壤碳匯 — IPCC 2019 Refinement Tier 1（亞熱帶濕潤）

### 本機開發

```bash
git clone https://github.com/anren1117-lang/taiwan-carbon-tools.git
cd taiwan-carbon-tools
python3 -m http.server 8000
# 瀏覽 http://localhost:8000
```

無 build、無 npm、無後端。純 HTML / CSS / JS。

### 重要聲明

**本工具僅供教育用途與顧問估算**，不能取代：

- 依 **ISO 14064-1** 進行的正式組織型溫室氣體盤查
- 經認證機構之第三方查證
- 依台灣《氣候變遷因應法》或碳費徵收辦法之法定申報
- Verra VM0042、Gold Standard、台灣自願減量機制等碳權方法學申請

如需上述用途，請委由合格查驗機構執行。本儀表板處理的是這些正式驗證**之前**的資料收集、方法學透明化、決策支援。

### 授權

MIT — 詳見 [LICENSE](LICENSE)。

### 作者

由 **何安仁 An-Ren Ho**（18，台灣）獨立開發。聯絡：[anren.carbon@gmail.com](mailto:anren.carbon@gmail.com)
