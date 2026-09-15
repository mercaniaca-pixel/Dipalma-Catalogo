// Carga masiva de productos desde Excel/CSV, para no tener que crearlos
// uno por uno desde el formulario. Reutiliza upsertProduct: si el código
// ya existe lo actualiza (sirve también para subir precios en lote), si
// no existe lo crea.
import { upsertProduct } from "./api.js";

const BASE_HEADERS = ["codigo", "producto", "marca", "categoria", "presentacion", "uso", "sedes"];

function priceHeader(sedeKey) {
  return `precio_${sedeKey}`;
}

export async function downloadImportTemplate(sedes) {
  const XLSX = await import("xlsx");
  const headers = [...BASE_HEADERS, ...sedes.map((s) => priceHeader(s.key))];
  const example = [
    "EJ-001",
    "Producto de ejemplo",
    "Marca X",
    "Categoría Y",
    "Presentación (ej. 1kg)",
    "Uso o descripción (opcional)",
    sedes.map((s) => s.key).join(","),
    ...sedes.map(() => 10),
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, "plantilla-importar-productos.xlsx");
}

/** Lee un archivo .xlsx/.csv y devuelve { rows, errors }.
 * rows: objetos listos para pasar a upsertProduct.
 * errors: [{ row, message }] para las filas inválidas (se omiten). */
export async function parseProductsFile(file, sedes) {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const validSedeKeys = new Set(sedes.map((s) => s.key));
  const rows = [];
  const errors = [];

  raw.forEach((r, i) => {
    const rowNum = i + 2; // +1 por índice base 0, +1 por la fila de encabezado
    const codigo = String(r.codigo || "").trim();
    const producto = String(r.producto || "").trim();
    if (!codigo || !producto) {
      errors.push({ row: rowNum, message: "Falta código o nombre del producto" });
      return;
    }

    const sedesCell = String(r.sedes || "").trim();
    const rowSedes = sedesCell
      ? sedesCell.split(",").map((s) => s.trim()).filter((k) => validSedeKeys.has(k))
      : sedes.map((s) => s.key);

    const precios = {};
    for (const s of sedes) {
      const v = r[priceHeader(s.key)];
      if (v !== "" && v !== undefined && v !== null && !Number.isNaN(Number(v))) {
        precios[s.key] = Number(v);
      }
    }

    rows.push({
      codigo,
      producto,
      marca: String(r.marca || "").trim(),
      categoria: String(r.categoria || "").trim(),
      presentacion: String(r.presentacion || "").trim() || null,
      uso: String(r.uso || "").trim() || null,
      sedes: rowSedes.length ? rowSedes : sedes.map((s) => s.key),
      precios: Object.keys(precios).length ? precios : null,
      precio: precios[sedes[0]?.key] ?? null,
    });
  });

  return { rows, errors };
}

/** Importa las filas ya parseadas, una por una (upsert por código).
 * Devuelve { okCount, failed: [{ codigo, message }] }. */
export async function importProducts(rows, onProgress) {
  let okCount = 0;
  const failed = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      await upsertProduct(row);
      okCount++;
    } catch (e) {
      failed.push({ codigo: row.codigo, message: e.message || String(e) });
    }
    onProgress && onProgress(i + 1, rows.length);
  }
  return { okCount, failed };
}
