# Taiwan Carbon Tools · 台灣碳排工具

> Free, open-source carbon footprint tools for Taiwan — built with official emission factors.
> 採用台灣官方排放係數的免費開源碳足跡工具。

[Live demo / 線上版本](https://anren1117-lang.github.io/taiwan-carbon-tools/) · MIT License

---

## English

A pair of zero-dependency, browser-based carbon calculators for Taiwan:

- **`household.html`** — Household carbon footprint calculator. Enter monthly bills (electricity, gas), fuel costs, flights, and diet to estimate annual emissions. Compares against Taiwan and global averages.
- **`business.html`** — SME carbon inventory estimator covering Scopes 1, 2, and 3, with Taiwan's 2026 carbon fee simulator (manufacturing) and per-industry intensity benchmarks.
- **`index.html`** — Landing page linking to both tools.

### Why this exists

Most carbon calculators are designed for Western users, in English, with kilowatt-hours and gallons. This project was built so people in Taiwan can see the carbon cost of their lives and businesses **in Traditional Chinese, using the units on their actual bills** (NT$, 度, 公升).

### Data sources

All emission factors are taken from Taiwanese government publications:

- **Grid electricity**: 0.474 kg CO₂e / kWh — *Ministry of Economic Affairs, Bureau of Energy, 113 年度（2024）電力排碳係數*
- **Fuels (natural gas, diesel, gasoline)**: *Ministry of Environment 溫室氣體排放係數管理表 v7.0.4*
- **Refrigerant R-410A**: GWP 2088 (IPCC AR5)
- **Procurement (EEIO)**: 0.4 kg CO₂e per NT$ — directional indicator only
- **Flight**: 1,500 kg CO₂e per long-haul round trip (rough)
- **Commute**: 0.36 kg CO₂e / km × 250 working days × 2 (round trip)

### Use locally

No build step, no npm, no backend. Open the HTML file directly:

```bash
git clone https://github.com/anren1117-lang/taiwan-carbon-tools.git
cd taiwan-carbon-tools
open index.html      # macOS
xdg-open index.html  # Linux
start index.html     # Windows
```

Or serve with any static HTTP server:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

### Disclaimer

**This is an educational estimator.** It is *not* a substitute for:

- A formal **ISO 14064-1** organisational GHG inventory
- Third-party verification by an accredited body
- Statutory reporting under Taiwan's *氣候變遷因應法* or the Carbon Fee regulations

For regulatory purposes, engage a qualified verification body.

### License

MIT — see [LICENSE](LICENSE).

### Author

Built by **何安仁 An-Ren Ho** (18, Taiwan). Contact: anren.carbon@gmail.com

---

## 中文

兩個零相依、純瀏覽器執行的台灣碳足跡計算工具：

- **`household.html`** — 家庭碳足跡計算機。輸入每月電費、瓦斯費、油費、飛行次數與飲食習慣，估算年度排放量，並與台灣及全球平均比較。
- **`business.html`** — 中小企業碳盤查估算工具，涵蓋範疇一、二、三，內建 2026 台灣碳費試算（製造業）與產業別碳強度比較。
- **`index.html`** — 首頁，連結兩個工具。

### 為什麼做這個

多數碳排計算器是為歐美使用者設計，用英文、kWh、加侖。這個專案是為了讓台灣的個人與企業，能用**繁體中文、用實際帳單上的單位**（NT$、度、公升），看見自己生活與營運的碳成本。

### 資料來源

所有排放係數均採用台灣官方公開資料：

- **電力排放係數**：0.474 kg CO₂e / kWh — 經濟部能源署 113 年度電力排碳係數
- **燃料係數（天然氣、柴油、汽油）**：環境部溫室氣體排放係數管理表 v7.0.4
- **冷媒 R-410A**：GWP 2088（IPCC AR5）
- **採購（EEIO 法）**：0.4 kg CO₂e / NT$，僅作方向性指引
- **航班**：每趟長程往返約 1,500 kg CO₂e（粗略估計）
- **通勤**：0.36 kg CO₂e/km × 250 工作日 × 2（來回）

### 本機使用

無需 build、無需 npm、無需後端。直接開啟 HTML 檔案：

```bash
git clone https://github.com/anren1117-lang/taiwan-carbon-tools.git
cd taiwan-carbon-tools
open index.html      # macOS
xdg-open index.html  # Linux
start index.html     # Windows
```

或以任何靜態伺服器執行：

```bash
python3 -m http.server 8000
# 瀏覽 http://localhost:8000
```

### 重要聲明

**本工具僅供教育用途與初步估算**，不能取代：

- 依 **ISO 14064-1** 進行的正式組織型溫室氣體盤查
- 經認證機構之第三方查證
- 依台灣《氣候變遷因應法》或碳費徵收辦法之法定申報

如需正式申報，請委由合格查驗機構執行。

### 授權條款

MIT 授權 — 詳見 [LICENSE](LICENSE)。

### 作者

由 **何安仁 An-Ren Ho**（18 歲，台灣）獨立開發。聯絡：anren.carbon@gmail.com
