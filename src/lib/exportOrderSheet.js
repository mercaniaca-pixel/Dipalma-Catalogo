import { normMarca, prettyTitle, priceForSede, camaronTiers, CAMARON_TIERS, CAMARON_UNITS } from "./format.js";

function num(n) {
  if (n === null || n === undefined || n === "") return "";
  const v = Number(n);
  return Number.isNaN(v) ? "" : Math.round(v * 100) / 100;
}

function ves(n, bcvRate) {
  if (n === null || n === undefined || n === "" || !bcvRate) return "";
  return num(Number(n) * bcvRate);
}

const TIER_LABEL = { 1: "Precio 1", 2: "Precio 2", 3: "Precio 3" };
const UNIT_LABEL = Object.fromEntries(CAMARON_UNITS.map((u) => [u.key, u.label]));

const MONEY_FMT = '#,##0.00';

// Dipal (Puerto La Cruz) factura con IVA; Dipalma (Puerto Libre de Margarita) está exenta.
const IVA_RATE = 0.16;
const IVA_LABEL = "IVA (16%)";

const BASE_HEADERS = [
  "Código", "Producto", "Marca", "Categoría", "Presentación", "Nivel / Unidad",
  "Precio US$", "Precio Bs.", "Cantidad", "Subtotal US$", "Subtotal Bs.",
];
const IVA_HEADERS = [`${IVA_LABEL} US$`, `${IVA_LABEL} Bs.`, "Total c/IVA US$", "Total c/IVA Bs."];

/**
 * Una fila por producto (o por combinación nivel×unidad de camarón, cuando el
 * vendedor no eligió un nivel/unidad puntual): mantiene la hoja "tidy" — una
 * sola magnitud de precio por fila — en vez de columnas Precio1-3 × unidad
 * repetidas en cada fila, que era lo que la volvía ilegible.
 */
function buildRows(products, sede, camaronChoices) {
  const rows = [];
  for (const p of products) {
    const tiers = camaronTiers(p, sede);
    if (!tiers) {
      rows.push({ p, nivel: "", precio: priceForSede(p, sede) });
      continue;
    }
    const choice = camaronChoices?.[p.codigo];
    if (choice) {
      rows.push({ p, nivel: `${TIER_LABEL[choice.tier]} · ${UNIT_LABEL[choice.unit]}`, precio: tiers?.[choice.tier]?.[choice.unit] });
      continue;
    }
    for (const t of CAMARON_TIERS) {
      for (const u of CAMARON_UNITS) {
        const precio = tiers?.[t]?.[u.key];
        if (precio === null || precio === undefined || precio === "") continue;
        rows.push({ p, nivel: `${TIER_LABEL[t]} · ${u.label}`, precio });
      }
    }
  }
  return rows;
}

/**
 * Genera y descarga una hoja de pedido en Excel (.xlsx): una fila por producto
 * (o por nivel/unidad de camarón) con su precio en US$ y Bs. (tasa BCV del día),
 * columna "Cantidad" en blanco, y "Subtotal US$"/"Subtotal Bs." calculados con
 * fórmula (Cantidad × Precio) que se actualizan solos al llenar cantidades —
 * con una fila TOTAL al final que suma todo. Dipal factura desde Puerto La Cruz
 * y suma 16% de IVA (columnas extra "IVA" y "Total c/IVA"); Dipalma opera como
 * Puerto Libre de Margarita y está exenta, así que esas columnas no aplican.
 */
export async function downloadOrderSheet(products, sede, bcvRate, bcvDate, camaronChoices = {}) {
  const XLSX = await import("xlsx");

  const applyIva = sede === "Dipal";
  const HEADERS = applyIva ? [...BASE_HEADERS, ...IVA_HEADERS] : BASE_HEADERS;
  const COL = Object.fromEntries(HEADERS.map((h, i) => [h, i]));

  const rows = buildRows(products, sede, camaronChoices);
  const aoa = rows.map(({ p, nivel, precio }) => {
    const base = [
      p.codigo,
      prettyTitle(p.producto),
      normMarca(p.marca),
      p.categoria,
      p.presentacion || "",
      nivel,
      num(precio),
      ves(precio, bcvRate),
      "",
      "",
      "",
    ];
    return applyIva ? [...base, "", "", "", ""] : base;
  });

  const infoLine = (bcvRate
    ? `Tasa oficial BCV: Bs. ${bcvRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / US$` +
      (bcvDate ? ` · ${new Date(bcvDate).toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" })}` : "")
    : "Tasa BCV no disponible — columnas en Bs. quedaron en blanco"
  ) + (applyIva
    ? " · Precios sin IVA — Dipal (Puerto La Cruz) aplica 16% de IVA, ver columnas al final"
    : " · Dipalma opera como Puerto Libre de Margarita — exenta de IVA");

  const HEADER_ROW = 2; // fila 0=info, 1=blank, 2=headers (0-indexed)
  const DATA_START = HEADER_ROW + 1;
  const totalRow = DATA_START + aoa.length;

  const sheetAoa = [[infoLine], [], HEADERS, ...aoa, []];
  const ws = XLSX.utils.aoa_to_sheet(sheetAoa);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } }];
  ws["!cols"] = [
    { wch: 14 }, { wch: 32 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 22 },
    { wch: 11 }, { wch: 13 }, { wch: 10 }, { wch: 13 }, { wch: 14 },
    ...(applyIva ? [{ wch: 13 }, { wch: 14 }, { wch: 15 }, { wch: 16 }] : []),
  ];
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: HEADER_ROW, c: 0 }, e: { r: DATA_START + aoa.length - 1, c: HEADERS.length - 1 } }) };

  const addr = (r, c) => XLSX.utils.encode_cell({ r, c });
  for (let i = 0; i < aoa.length; i++) {
    const r = DATA_START + i;
    ws[addr(r, COL["Precio US$"])].z = MONEY_FMT;
    ws[addr(r, COL["Precio Bs."])].z = MONEY_FMT;
    const qty = addr(r, COL["Cantidad"]);
    const usd = addr(r, COL["Precio US$"]);
    const bs = addr(r, COL["Precio Bs."]);
    const subUsd = addr(r, COL["Subtotal US$"]);
    const subBs = addr(r, COL["Subtotal Bs."]);
    // v:0 es solo el valor cacheado inicial (Cantidad vacía); fullCalcOnLoad hace que
    // Excel/Sheets recalcule todo al abrir, y cualquier edición de Cantidad recalcula al vuelo.
    ws[addr(r, COL["Subtotal US$"])] = { t: "n", f: `IF(${qty}="","",${qty}*${usd})`, v: 0, z: MONEY_FMT };
    ws[addr(r, COL["Subtotal Bs."])] = { t: "n", f: `IF(${qty}="","",${qty}*${bs})`, v: 0, z: MONEY_FMT };
    if (applyIva) {
      const ivaUsd = addr(r, COL[`${IVA_LABEL} US$`]);
      const ivaBs = addr(r, COL[`${IVA_LABEL} Bs.`]);
      ws[ivaUsd] = { t: "n", f: `IF(${subUsd}="","",${subUsd}*${IVA_RATE})`, v: 0, z: MONEY_FMT };
      ws[ivaBs] = { t: "n", f: `IF(${subBs}="","",${subBs}*${IVA_RATE})`, v: 0, z: MONEY_FMT };
      ws[addr(r, COL["Total c/IVA US$"])] = { t: "n", f: `IF(${subUsd}="","",${subUsd}+${ivaUsd})`, v: 0, z: MONEY_FMT };
      ws[addr(r, COL["Total c/IVA Bs."])] = { t: "n", f: `IF(${subBs}="","",${subBs}+${ivaBs})`, v: 0, z: MONEY_FMT };
    }
  }

  ws[addr(totalRow, COL["Nivel / Unidad"])] = { t: "s", v: "TOTAL DEL PEDIDO" };
  const sumCols = applyIva
    ? ["Subtotal US$", "Subtotal Bs.", `${IVA_LABEL} US$`, `${IVA_LABEL} Bs.`, "Total c/IVA US$", "Total c/IVA Bs."]
    : ["Subtotal US$", "Subtotal Bs."];
  for (const col of sumCols) {
    const c = COL[col];
    const range = `${addr(DATA_START, c)}:${addr(totalRow - 1, c)}`;
    ws[addr(totalRow, c)] = { t: "n", f: `SUM(${range})`, v: 0, z: MONEY_FMT };
  }
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRow, c: HEADERS.length - 1 } });

  const wb = XLSX.utils.book_new();
  wb.Workbook = { CalcPr: { fullCalcOnLoad: true } };
  XLSX.utils.book_append_sheet(wb, ws, "Pedido");
  XLSX.writeFile(wb, `Pedido-${sede}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
