import { normMarca, prettyTitle, categoryTone, priceForSede, formatPrice, formatPriceVES, camaronTiers, cheapestKg } from "./format.js";
import { SEDE_RIF } from "./sedeInfo.js";

// ============================================================
// Layout — ficha de producto horizontal (foto cuadrada + info),
// grilla de 2×5 por página A4.
// ============================================================
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const COLS = 2;
const ROWS = 5;
const GAP = 5;
const COL_W = (PAGE_W - MARGIN * 2 - GAP * (COLS - 1)) / COLS;
const HEADER_H_FIRST = 33;
const HEADER_H_CONT = 14;
const FOOTER_H = 9;

const BRAND_DARK = [8, 41, 82]; // #082952
const BRAND_BLUE = [12, 52, 128]; // #0c3480
const INK = [14, 31, 44];
const INK_SOFT = [90, 108, 121];
const LINE = [222, 229, 234];
const IMG_BG = [244, 248, 250];

// Acentos de color por categoría (mismos tonos que usa la app en pantalla).
const TONE_ACCENT = {
  mar: [11, 58, 91], // #0b3a5b
  cremas: [156, 74, 42], // #9c4a2a
  bases: [20, 70, 61], // #14463d
  comp: [108, 90, 60], // #6c5a3c
};

function fitContain(boxW, boxH, imgW, imgH) {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  return { w: imgW * scale, h: imgH * scale };
}

async function loadImageAsJpeg(url, maxDim = 380) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.72), w, h };
  } catch {
    return null;
  }
}

function drawHeader(doc, { title, subtitleLines, isFirst }) {
  const h = isFirst ? HEADER_H_FIRST : HEADER_H_CONT;
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, PAGE_W, h, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(isFirst ? 16 : 11);
  doc.text(title, MARGIN, isFirst ? 14 : 9.5);
  if (isFirst) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    subtitleLines.forEach((line, i) => doc.text(line, MARGIN, 21 + i * 5));
  }
  doc.setTextColor(...INK);
  return h;
}

function drawFooter(doc, pageNum, totalPages, footerText) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);
  doc.text(footerText || "Portafolio Comercial", MARGIN, PAGE_H - 6);
  doc.text(`Página ${pageNum} de ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: "right" });
  doc.setTextColor(...INK);
}

/**
 * Genera y descarga el catálogo en PDF.
 * @param {Array} products - lista completa de productos (sin filtrar).
 * @param {Object} opts
 * @param {boolean} [opts.withPrice] - true = lista de precios interna; false = catálogo para cliente (sin precio).
 * @param {"USD"|"VES"} [opts.currency] - solo aplica si withPrice.
 * @param {"Dipalma"|"Dipal"} [opts.sede] - sede cuyo precio se usa (por defecto "Dipalma").
 * @param {number} [opts.rate] - tasa BCV (Bs. por US$), requerida si withPrice && currency === "VES".
 * @param {string} [opts.rateDate] - fecha ISO de la tasa BCV.
 */
export async function generateCatalogPdf(products, { withPrice = true, currency, sede = "Dipalma", rate, rateDate, footerText } = {}) {
  const isVES = withPrice && currency === "VES";
  if (isVES && !rate) throw new Error("Falta la tasa BCV para generar el PDF en bolívares.");

  const [{ jsPDF }, images] = await Promise.all([
    import("jspdf"),
    Promise.all(products.map((p) => loadImageAsJpeg(p.photo_url))),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const docTitle = withPrice ? `Lista de precios interna ${sede} (${currency})` : `Catálogo ${sede}`;
  doc.setProperties({ title: docTitle });

  const genDate = new Date().toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" });
  const subtitleLines = [];
  if (SEDE_RIF[sede]) subtitleLines.push(`RIF ${SEDE_RIF[sede]}`);
  subtitleLines.push(
    withPrice
      ? `Uso interno · Precios en ${isVES ? "Bolívares" : "Dólares (US$)"} · Generado el ${genDate}`
      : `Generado el ${genDate}`
  );
  if (isVES) {
    const rateDateStr = rateDate
      ? new Date(rateDate).toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" })
      : genDate;
    subtitleLines.push(
      `Tasa oficial BCV: Bs. ${rate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / US$ · Tasa del ${rateDateStr}`
    );
  }

  const pages = []; // se llena con la lista de productos/imagenes por página
  let current = [];
  products.forEach((p, i) => {
    current.push({ p, img: images[i] });
    if (current.length === COLS * ROWS) {
      pages.push(current);
      current = [];
    }
  });
  if (current.length) pages.push(current);
  if (pages.length === 0) pages.push([]);

  const baseTitle = withPrice ? `Lista de precios interna ${sede}` : `Catálogo ${sede}`;

  pages.forEach((pageItems, pageIndex) => {
    if (pageIndex > 0) doc.addPage();
    const isFirst = pageIndex === 0;
    const headerH = drawHeader(doc, {
      title: isFirst ? baseTitle : `${baseTitle} (cont.)`,
      subtitleLines,
      isFirst,
    });
    const gridTop = headerH + 5;
    const rowH = (PAGE_H - gridTop - FOOTER_H - MARGIN) / ROWS;

    pageItems.forEach((item, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = MARGIN + col * (COL_W + GAP);
      const y = gridTop + row * rowH;
      const cellW = COL_W;
      const cellH = rowH - GAP * 0.7;
      drawProductCell(doc, x, y, cellW, cellH, item.p, item.img, { withPrice, isVES, rate, sede });
    });

    drawFooter(doc, pageIndex + 1, pages.length, footerText);
  });

  const fileDate = new Date().toISOString().slice(0, 10);
  if (withPrice) {
    const fileTag = isVES ? "Bolivares" : "Dolares";
    doc.save(`Lista-Interna-${sede}-${fileTag}-${fileDate}.pdf`);
  } else {
    doc.save(`Catalogo-${sede}-${fileDate}.pdf`);
  }
}

function drawProductCell(doc, x, y, cellW, cellH, p, img, { withPrice, isVES, rate, sede }) {
  const pad = 2.6;
  const accentW = 1.8;
  const photoGap = 3;

  // Tarjeta: borde suave + pestaña de color por categoría a la izquierda.
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, cellW, cellH, 1.6, 1.6, "FD");
  const accent = TONE_ACCENT[categoryTone(p.categoria)] || TONE_ACCENT.mar;
  doc.setFillColor(...accent);
  doc.rect(x + 0.4, y + 1.8, accentW, cellH - 3.6, "F"); // franja de color inset, sin pisar el borde redondeado

  // --- Foto cuadrada a la izquierda ---
  const photoSize = cellH - pad * 2;
  const photoX = x + accentW + pad;
  const photoY = y + pad;
  doc.setFillColor(...IMG_BG);
  doc.rect(photoX, photoY, photoSize, photoSize, "F");
  if (img) {
    const { w, h } = fitContain(photoSize - 2, photoSize - 2, img.w, img.h);
    const ix = photoX + (photoSize - w) / 2;
    const iy = photoY + (photoSize - h) / 2;
    try {
      doc.addImage(img.dataUrl, "JPEG", ix, iy, w, h, undefined, "FAST");
    } catch {
      // Si la imagen falla al insertarse, simplemente se deja el placeholder.
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...INK_SOFT);
    doc.text("Sin foto", photoX + photoSize / 2, photoY + photoSize / 2, { align: "center", baseline: "middle" });
    doc.setTextColor(...INK);
  }
  if (p.unavailable) {
    const bw = Math.min(photoSize - 4, 20);
    doc.setFillColor(196, 46, 46);
    doc.roundedRect(photoX + photoSize - bw - 1, photoY + 1, bw, 4.6, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.2);
    doc.setTextColor(255, 255, 255);
    doc.text("NO DISPONIBLE", photoX + photoSize - bw / 2 - 1, photoY + 4, { align: "center" });
    doc.setTextColor(...INK);
  }

  // --- Info a la derecha de la foto ---
  const textX = photoX + photoSize + photoGap;
  const textRight = x + cellW - pad;
  const textW = textRight - textX;
  const textTop = y + pad;
  const textBottom = y + cellH - pad;
  let cy = textTop + 3.1;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(prettyTitle(p.producto) || "", textW).slice(0, 2);
  doc.text(titleLines, textX, cy);
  cy += titleLines.length * 3.4 + 1.8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(...INK_SOFT);
  const metaLine = [normMarca(p.marca), p.presentacion].filter(Boolean).join("  ·  ");
  doc.text(metaLine, textX, cy);
  cy += 3.6;

  // La descripción de uso solo va en la lista interna; el catálogo de clientes
  // se queda solo con foto, nombre y presentación (peso/litros).
  if (withPrice) {
    const priceRowH = 5.5;
    const usoMaxLines = Math.max(0, Math.floor((textBottom - priceRowH - cy) / 2.9));
    if (p.uso && usoMaxLines > 0) {
      doc.setFontSize(6.3);
      const usoText = doc.splitTextToSize(p.uso, textW).slice(0, usoMaxLines);
      doc.text(usoText, textX, cy);
    }
  }
  doc.setTextColor(...INK);

  // --- Precio (solo en la lista interna) + código, anclados abajo ---
  const priceY = textBottom;
  if (withPrice) {
    const raw = priceForSede(p, sede);
    const precioNum = raw === null || raw === undefined || raw === "" ? null : Number(raw);
    if (precioNum !== null && !Number.isNaN(precioNum)) {
      const label = isVES ? formatPriceVES(precioNum, rate) : formatPrice(precioNum);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...BRAND_BLUE);
      doc.text(label, textX, priceY);
      doc.setTextColor(...INK);
    } else {
      const kg = cheapestKg(camaronTiers(p, sede));
      if (kg !== null) {
        const label = "Desde " + (isVES ? formatPriceVES(kg, rate) : formatPrice(kg)) + "/Kg";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...BRAND_BLUE);
        doc.text(label, textX, priceY - 2.6);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6);
        doc.setTextColor(...INK_SOFT);
        doc.text("Según volumen · ver hoja de pedido", textX, priceY);
        doc.setTextColor(...INK);
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(...INK_SOFT);
        doc.text("Precio a consultar", textX, priceY);
        doc.setTextColor(...INK);
      }
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...INK_SOFT);
  doc.text(p.codigo || "", textRight, priceY, { align: "right" });
  doc.setTextColor(...INK);
}
