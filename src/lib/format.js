// Helpers de presentación reutilizados por varios componentes.
export const normMarca = (m) => {
  if (!m) return m;
  const u = m.toUpperCase();
  if (u === "LA ARGENTINA") return "La Argentina";
  if (u === "AGROLAGO") return "Agrolago";
  if (u === "CASTELL") return "Castell";
  return m;
};

export const categoryTone = (cat = "") => {
  if (cat.includes("Camarones") || cat.includes("Otros productos del mar")) return "mar";
  if (cat.includes("Helados")) return "cremas";
  if (cat.includes("Bases")) return "bases";
  if (cat.includes("Complementos")) return "comp";
  return "mar";
};
export const categoryLabel = (cat = "") => {
  if (cat.includes("Camarones")) return "MARISCOS";
  if (cat.includes("Otros productos del mar")) return "MARISCOS";
  if (cat.includes("Helados")) return "HELADO";
  if (cat.includes("Bases")) return "BASE SOFT";
  if (cat.includes("Complementos")) return "SIROP";
  return "PRODUCTO";
};
export const tagClass = (cat) => "tag " + categoryTone(cat);

export function formatPrice(precio) {
  if (precio === null || precio === undefined || precio === "") return null;
  const n = Number(precio);
  if (Number.isNaN(n)) return null;
  return "US$ " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Precio del producto para una sede dada (clave dinámica, ej. "Dipalma").
 * Lee del campo genérico "precios"; si no está, cae en las columnas viejas
 * precio/precio_dipal (datos de antes de que las sedes fueran configurables). */
export function priceForSede(p, sede) {
  if (p.precios && Object.prototype.hasOwnProperty.call(p.precios, sede)) return p.precios[sede];
  if (sede === "Dipal") return p.precio_dipal;
  if (sede === "Dipalma") return p.precio;
  return null;
}

/** Convierte un precio en US$ a bolívares formateados, dada la tasa BCV del día. */
export function formatPriceVES(precioUsd, bcvRate) {
  if (precioUsd === null || precioUsd === undefined || precioUsd === "" || !bcvRate) return null;
  const n = Number(precioUsd);
  if (Number.isNaN(n)) return null;
  return "Bs. " + (n * bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================
// Precios por volumen de camarón (Bulto/Estuche/Kg × Precio 1/2/3)
// ============================================================
export const CAMARON_TIERS = ["1", "2", "3"];
export const CAMARON_UNITS = [
  { key: "bulto", label: "Bulto (20 Kg)" },
  { key: "estuche", label: "Estuche (2 Kg)" },
  { key: "kg", label: "Kg" },
];

/** Tabla de precios por volumen del producto para una sede, o null si no aplica. */
export function camaronTiers(p, sede) {
  return p?.precio_camaron?.[sede] || null;
}

/** El precio por Kg más bajo disponible (mayor volumen) — usado como "Desde US$ X/Kg". */
export function cheapestKg(tiers) {
  if (!tiers) return null;
  const values = CAMARON_TIERS.map((t) => tiers[t]?.kg).filter((v) => v !== null && v !== undefined && v !== "");
  if (!values.length) return null;
  return Math.min(...values.map(Number));
}

export function prettyTitle(s) {
  if (!s) return s;
  const letters = s.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  if (!letters) return s;
  const upperRatio = (letters.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length / letters.length;
  if (upperRatio < 0.7) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => {
      if (/^[0-9]/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export function toneBar(tone) {
  return ({
    mar:    "linear-gradient(90deg, #0b3a5b, #2b7aa8)",
    cremas: "linear-gradient(90deg, #9c4a2a, #d97a55)",
    bases:  "linear-gradient(90deg, #14463d, #2f7a6c)",
    comp:   "linear-gradient(90deg, #6c5a3c, #d8c9ab)",
  })[tone] || "#ccc";
}
