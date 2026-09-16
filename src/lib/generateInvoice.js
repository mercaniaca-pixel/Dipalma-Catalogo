// Genera SOLO el texto negro (y los bordes de tabla/cajas) de una factura,
// para imprimir encima de la hoja "Forma Libre" ya membretada de Dipalma
// (logo, datos de la empresa, "No. de Control" y el pie del impresor YA
// están en el papel — este PDF no los dibuja, para no duplicarlos).
//
// Las coordenadas están calibradas a partir de una factura real de ejemplo
// (foto del papel ya impreso), asumiendo hoja A4. Si al imprimir sobre la
// hoja física algo queda corrido unos milímetros, es normal (la referencia
// era una foto, no un escaneo plano) — ajusta las constantes de abajo.

const PAGE_W = 210;
const PAGE_H = 297;

const G = {
  // Bloque cliente (izquierda)
  leftLabelX: 12,
  leftValueX: 32,
  razonY: 68,
  rifY: 75,
  dir1Y: 80.5,
  dir2Y: 86,
  contactoY: 90,
  telefonosY: 94.5,

  // Bloque factura (derecha)
  rightLabelX: 143,
  rightValueX: 163,
  facturaValueX: 183,
  facturaY: 69,
  clienteNoY: 74,
  fechaY: 79,
  vencimientoY: 84.5,
  creditoY: 89.5,
  asesorY: 94,

  // Tabla de productos
  tableLeft: 12,
  tableRight: 201,
  tableTop: 96.5,
  headerBaselineY: 101,
  headerSepY: 102.3,
  firstRowY: 110,
  rowH: 3.85,
  colCodigoX: 15,
  colDescX: 47,
  colCantRight: 130,
  colPrecioRight: 163,
  colTotalRight: 193,
  maxRows: 30,

  // Cajas del pie (disclaimer legal + totales)
  footerTop: 242,
  footerBottom: 274,
  disclaimerLeft: 13,
  dividerX: 129,
  totalsRight: 205,
};

const DISCLAIMER_LINES_1 = [
  "De conformidad con el Art. 128 de la ley del BCV, los valores expresados en Bolivares",
  "en esta factura, son equivalente en Dolares Americano, según Tasa Establecida por",
  "el BCV a la fecha de la emisión.",
];
const DISCLAIMER_LINES_2 = [
  "El pago de este documento está sujeto a un recargo del 3% del total por IGTF según",
  "GO 42.339 de fecha 07 de marzo del 2022, si es realizado en otra moneda diferente",
  "a la de curso legal.",
];

function bs(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * @param {Object} data
 * @param {Object} data.cliente - { razonSocial, rif, direccion1, direccion2, contacto, telefonos }
 * @param {Object} data.factura - { numero, clienteNo, fecha, vencimiento, credito, asesor }
 * @param {Array}  data.items - [{ codigo, descripcion, cantidad, precioBs }]
 * @param {number} data.descuento - descuento en Bs. (0 si no aplica)
 * @param {number} data.bcvRate - tasa BCV del día (Bs. por US$)
 * @returns {{ ok: boolean, reason?: string }}
 */
export async function generateInvoicePdf(data) {
  const { cliente, factura, items, descuento = 0, bcvRate } = data;
  if (items.length > G.maxRows) {
    return { ok: false, reason: `Esta forma solo tiene espacio para ${G.maxRows} líneas de producto. Reduce la cantidad de productos o genera varias facturas.` };
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setTextColor(0, 0, 0);

  // --- Bloque cliente ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(cliente.razonSocial || "", G.leftValueX, G.razonY);
  doc.text(cliente.rif || "", G.leftValueX, G.rifY);
  doc.text(cliente.direccion1 || "", G.leftValueX, G.dir1Y);
  doc.text(cliente.direccion2 || "", G.leftValueX, G.dir2Y);
  doc.text(cliente.contacto || "", G.leftValueX, G.contactoY);
  doc.text(cliente.telefonos || "", G.leftValueX, G.telefonosY);

  // --- Bloque factura ---
  doc.setFont("helvetica", "bold");
  doc.text(factura.numero || "", G.facturaValueX, G.facturaY);
  doc.setFont("helvetica", "normal");
  doc.text(factura.clienteNo || "", G.rightValueX, G.clienteNoY);
  doc.text(factura.fecha || "", G.rightValueX, G.fechaY);
  doc.text(factura.vencimiento || "", G.rightValueX, G.vencimientoY);
  doc.text(factura.credito || "", G.rightValueX, G.creditoY);
  doc.text(factura.asesor || "", G.rightValueX, G.asesorY);

  // --- Tabla ---
  const rowsBottom = G.firstRowY - G.rowH + items.length * G.rowH;
  doc.setLineWidth(0.25);
  doc.setDrawColor(0, 0, 0);
  doc.rect(G.tableLeft, G.tableTop, G.tableRight - G.tableLeft, Math.max(rowsBottom, G.headerSepY) - G.tableTop + 2);
  doc.line(G.tableLeft, G.headerSepY, G.tableRight, G.headerSepY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Codigo", G.colCodigoX, G.headerBaselineY);
  doc.text("Descripción", G.colDescX, G.headerBaselineY);
  doc.text("Cantidad", G.colCantRight, G.headerBaselineY, { align: "right" });
  doc.text("Precio Bs.", G.colPrecioRight, G.headerBaselineY, { align: "right" });
  doc.text("Total Bs.", G.colTotalRight, G.headerBaselineY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let totalItems = 0;
  items.forEach((it, i) => {
    const y = G.firstRowY + i * G.rowH;
    const total = (Number(it.cantidad) || 0) * (Number(it.precioBs) || 0);
    totalItems += total;
    doc.text(String(it.codigo || ""), G.colCodigoX, y);
    doc.text(doc.splitTextToSize(it.descripcion || "", G.colCantRight - G.colDescX - 4)[0] || "", G.colDescX, y);
    doc.text(String(it.cantidad ?? ""), G.colCantRight, y, { align: "right" });
    doc.text(bs(it.precioBs), G.colPrecioRight, y, { align: "right" });
    doc.text(bs(total), G.colTotalRight, y, { align: "right" });
  });

  // --- Cajas del pie: disclaimer legal + totales ---
  doc.setLineWidth(0.25);
  doc.rect(G.disclaimerLeft, G.footerTop, G.dividerX - G.disclaimerLeft - 2, G.footerBottom - G.footerTop);
  doc.rect(G.dividerX, G.footerTop, G.totalsRight - G.dividerX, G.footerBottom - G.footerTop);

  doc.setFontSize(8.3);
  let ly = G.footerTop + 5;
  DISCLAIMER_LINES_1.forEach((line) => { doc.text(line, G.disclaimerLeft + 2, ly); ly += 4; });
  ly += 2.5;
  DISCLAIMER_LINES_2.forEach((line) => { doc.text(line, G.disclaimerLeft + 2, ly); ly += 4; });

  const totalFactura = totalItems - (Number(descuento) || 0);
  const totalRef = bcvRate ? totalFactura / bcvRate : 0;
  const tRight = G.totalsRight - 3;
  const tLabelX = G.dividerX + 3;
  doc.setFontSize(9);
  let ty = G.footerTop + 6;
  const totalsRow = (label, value, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, tLabelX, ty);
    doc.text(value, tRight, ty, { align: "right" });
    ty += 5.2;
  };
  totalsRow("Total Items", bs(totalItems), false);
  totalsRow("Descuento", bs(descuento), false);
  totalsRow("Total Factura Bs.", bs(totalFactura), true);
  ty += 2;
  totalsRow("Tasa BCV", bcvRate ? bcvRate.toLocaleString("es-VE", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "-", false);
  totalsRow("Total REF", totalRef.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), true);

  doc.save(`Factura-${(factura.numero || "sin-numero").replace(/[^\w-]/g, "_")}.pdf`);
  return { ok: true };
}
