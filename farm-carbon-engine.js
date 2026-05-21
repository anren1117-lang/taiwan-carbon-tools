// farm-carbon-engine.js
// Shared carbon math used by farm-dashboard.html (consulting view)
// and farm-buyer.html (buyer share view).
//
// This is a classic <script>, NOT an ES module. Top-level const /
// function declarations are visible to other classic scripts on
// the same page — both consumer pages reference these symbols
// directly (EF, SINK, PRACTICES, PRODUCT_BENCHMARKS, calcFromInputs,
// stackingMult, fmt, fmt0).
//
// Methodology sources:
//   - Electricity: MOEA Energy Administration 2024 grid factor
//   - Combustion fuels: MOENV emission factor database 7.0.4
//   - N₂O from N fert: IPCC default (1% N2O-N × 44/28 × 273 GWP100)
//   - Rice CH₄: IPCC Tier 1 subtropical single-season
//   - SOC sinks: IPCC 2019 Refinement Tier 1 (subtropical moist)
//   - Per-kg product benchmarks: indicative figures from FAO LCA,
//     Carbon Trust, Taiwan academic LCA; ranges widely by product

const EF = {
  diesel: 2.606,        // per L      (MOENV)
  gasoline: 2.27,       // per L      (MOENV)
  lpg: 2.99,            // per kg     (IPCC)
  heatingOil: 2.68,     // per L      (MOENV)
  nFertDirect: 4.29,    // per kg N   (IPCC: 1% N2O-N × 44/28 × 273 GWP100)
  riceCH4PerHa: 2970,   // per ha-yr  (subtropical Tier 1, single-season)
  cattleHead: 1800,     // per head-yr (beef-equivalent average; legacy field)
  pigHead: 175,         // per head-yr (mixed-class average; legacy field)
  poultryHead: 6,       // per head-yr (mixed layer/broiler average; legacy field)
  // ── Livestock class breakdown (IPCC 2006 Vol 4, Tables 10.10/10.16) ──
  // Used when sub-class fields are provided on the input. Falls back
  // to the legacy single-field factor above if none are set.
  cattleDairy:    4000,  // high-production dairy cow (enteric + manure)
  cattleBeef:     1800,  // beef cattle
  sowHead:         280,  // breeding sow (gestation + lactation)
  growerPigHead:   150,  // grower-finisher pig
  poultryLayer:      4,  // layer hen
  poultryBroiler:    1,  // broiler chicken
  electricity: 0.474,   // per kWh    (MOEA 2024)
  nFertUpstream: 4.0,   // per kg N   (urea avg production)
  chemicals: 7.0,       // per kg     (compound fert + pesticides upstream)
  feed: 0.5,            // per kg     (rough avg upstream feed)
  transport: 0.65,      // per truck-km
  commute: 0.13,        // per pkm    (gasoline car average)
  packaging: 1.8,       // per kg     (mixed cardboard / plastic avg)
  waste: 0.6            // per kg     (mixed organic / inorganic avg)
};

const MANURE_MULT = { none: 1.0, composted: 1.0, daily: 1.1, lagoon: 1.3 };

// Rice water management scaling factor for paddy CH₄
// (IPCC 2019 Refinement Tier 1, applied to the continuous-flood EF):
//   continuous_flood — baseline, no drainage
//   single_drainage — one mid-season drainage event
//   awd             — alternate wetting & drying / multiple drainage
//   upland          — continuously rainfed / no standing water
const RICE_MGMT_SCALE = {
  continuous_flood: 1.00,
  single_drainage:  0.71,
  awd:              0.55,
  upland:           0.27
};

const SINK = {
  coverCrop: 1100,      // per ha-yr  (IPCC Tier 1, subtropical moist)
  noTill: 500,
  compost: 800,         // ≥ 5 t/ha
  residue: 400,
  biochar: 3.0,         // per kg biochar applied
  treePerYear: 22       // per mature tree-yr (mixed-species mean)
};

const PRACTICES = ['coverCrop', 'noTill', 'compost', 'residue'];

const PRODUCT_BENCHMARKS = {
  vegetables_leaf:  { name: { zh: "葉菜類", en: "Leafy vegetables" },     taiwan_avg: 0.35, eu_avg: 0.50, top_quartile: 0.20, premium: 0.10 },
  vegetables_root:  { name: { zh: "根莖類蔬菜", en: "Root vegetables" }, taiwan_avg: 0.30, eu_avg: 0.40, top_quartile: 0.18, premium: 0.09 },
  rice:             { name: { zh: "稻米", en: "Rice" },                    taiwan_avg: 2.50, eu_avg: 2.80, top_quartile: 1.80, premium: 1.20 },
  fruit:            { name: { zh: "果樹", en: "Fruit" },                   taiwan_avg: 0.40, eu_avg: 0.60, top_quartile: 0.25, premium: 0.15 },
  livestock_dairy:  { name: { zh: "乳製品", en: "Dairy" },                 taiwan_avg: 1.20, eu_avg: 1.40, top_quartile: 0.90, premium: 0.70 },
  livestock_meat:   { name: { zh: "肉品", en: "Meat" },                     taiwan_avg: 8.00, eu_avg: 12.0, top_quartile: 6.00, premium: 4.50 },
  mixed:            { name: { zh: "綜合作物", en: "Mixed produce" },        taiwan_avg: 0.40, eu_avg: 0.55, top_quartile: 0.22, premium: 0.12 }
};

// Saturation discount when multiple land practices stack — SOC
// accumulation slows over time when several are applied together.
function stackingMult(count) {
  if (count >= 3) return 0.65;
  if (count === 2) return 0.80;
  return 1.0;
}

// Main calculation. Takes the full inputs object (farmSize, cropType,
// diesel, gasoline, lpg, heatingOil, nFert, cattle, pigs, poultry,
// manure, irrigation, coldStorage, otherElec, chemicals, feed,
// transport, commute, packaging, waste, biochar, trees, practices)
// and returns a structured result with:
//   s1, s2, s3, gross, sinkTotal, net  — scope totals (kg CO₂e)
//   stackingMult, activeLandCount      — sink stacking diagnostics
//   sinkByPractice                     — per-practice sink (kg)
//   fuels, scope3, sources             — per-line breakdowns (kg)
function calcFromInputs(inp) {
  // Scope 1 — fuels
  const e_diesel     = inp.diesel * EF.diesel;
  const e_gasoline   = inp.gasoline * EF.gasoline;
  const e_lpg        = inp.lpg * EF.lpg;
  const e_heatingOil = inp.heatingOil * EF.heatingOil;
  const e_fuels = e_diesel + e_gasoline + e_lpg + e_heatingOil;

  // Scope 1 — agronomy
  const e_nFertDir = inp.nFert * EF.nFertDirect;
  const riceMgmtScale = RICE_MGMT_SCALE[inp.riceMgmt] || RICE_MGMT_SCALE.continuous_flood;
  const e_rice = inp.cropType === 'rice' ? inp.farmSize * EF.riceCH4PerHa * riceMgmtScale : 0;
  // Livestock: prefer sub-class fields when any are non-zero; fall back
  // to single-field totals (inp.cattle / inp.pigs / inp.poultry) when
  // the consultant has only basic counts.
  const cattleSub  = (inp.cattleDairy   || 0) * EF.cattleDairy
                   + (inp.cattleBeef    || 0) * EF.cattleBeef;
  const pigsSub    = (inp.sowHead       || 0) * EF.sowHead
                   + (inp.growerPigHead || 0) * EF.growerPigHead;
  const poultrySub = (inp.poultryLayer  || 0) * EF.poultryLayer
                   + (inp.poultryBroiler|| 0) * EF.poultryBroiler;
  const e_cattle   = cattleSub  > 0 ? cattleSub  : (inp.cattle  || 0) * EF.cattleHead;
  const e_pigs     = pigsSub    > 0 ? pigsSub    : (inp.pigs    || 0) * EF.pigHead;
  const e_poultry  = poultrySub > 0 ? poultrySub : (inp.poultry || 0) * EF.poultryHead;
  const livestockBase = e_cattle + e_pigs + e_poultry;
  const e_livestock = livestockBase * (MANURE_MULT[inp.manure] || 1);

  const s1 = e_fuels + e_nFertDir + e_rice + e_livestock;

  // Scope 2 — electricity
  const e_elec = (inp.irrigation + inp.coldStorage + (inp.otherElec || 0)) * EF.electricity;
  const s2 = e_elec;

  // Scope 3 — upstream / downstream
  const e_nFertUp   = inp.nFert * EF.nFertUpstream;
  const e_chem      = inp.chemicals * EF.chemicals;
  const e_feed      = (inp.feed || 0) * EF.feed;
  const e_trans     = inp.transport * EF.transport;
  const e_commute   = (inp.commute || 0) * EF.commute;
  const e_packaging = (inp.packaging || 0) * EF.packaging;
  const e_waste     = (inp.waste || 0) * EF.waste;
  const s3 = e_nFertUp + e_chem + e_feed + e_trans + e_commute + e_packaging + e_waste;

  const gross = s1 + s2 + s3;

  // Sinks (land practices + biomass)
  const activeLand = PRACTICES.filter(p => inp.practices[p]);
  const sm = stackingMult(activeLand.length);
  const sinkByPractice = {
    coverCrop: inp.practices.coverCrop ? inp.farmSize * SINK.coverCrop * sm : 0,
    noTill:    inp.practices.noTill    ? inp.farmSize * SINK.noTill    * sm : 0,
    compost:   inp.practices.compost   ? inp.farmSize * SINK.compost   * sm : 0,
    residue:   inp.practices.residue   ? inp.farmSize * SINK.residue   * sm : 0,
    biochar:   inp.biochar * SINK.biochar,
    trees:     inp.trees * SINK.treePerYear
  };
  const sinkTotal = Object.values(sinkByPractice).reduce((a, b) => a + b, 0);
  const net = gross - sinkTotal;

  return {
    s1, s2, s3, gross, sinkTotal, net,
    stackingMult: sm,
    activeLandCount: activeLand.length,
    sinkByPractice,
    fuels: {
      diesel: e_diesel, gasoline: e_gasoline, lpg: e_lpg, heatingOil: e_heatingOil
    },
    scope3: {
      nFertUp: e_nFertUp, chemicals: e_chem, feed: e_feed,
      transport: e_trans, commute: e_commute,
      packaging: e_packaging, waste: e_waste
    },
    sources: {
      diesel: e_diesel, gasoline: e_gasoline, lpg: e_lpg, heatingOil: e_heatingOil,
      nFert: e_nFertDir + e_nFertUp,
      rice: e_rice,
      livestock: e_livestock,
      electricity: e_elec,
      chemicals: e_chem,
      feed: e_feed,
      transport: e_trans,
      commute: e_commute,
      packaging: e_packaging,
      waste: e_waste
    }
  };
}

// Number formatting helpers shared by both pages
function fmt(n, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt0(n) {
  return Math.round(n).toLocaleString();
}

// Practice timeline helper: given a "YYYY-MM" start date string and
// the reporting period year, return years of operation (rounded to
// 1 decimal). Returns null when the date is missing/invalid.
function yearsSince(dateStr, reportingPeriod) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 1 || !isFinite(parts[0])) return null;
  const startYr = parts[0];
  const startMo = isFinite(parts[1]) ? parts[1] : 6;
  const refYr = parseInt(reportingPeriod) || new Date().getFullYear();
  const startDec = startYr + (startMo - 1) / 12;
  const endDec   = refYr + 0.5;
  const years = endDec - startDec;
  return years > 0 ? Math.round(years * 10) / 10 : null;
}
