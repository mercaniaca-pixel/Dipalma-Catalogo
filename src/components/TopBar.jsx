import React, { useRef, useState } from "react";
import { getLogoUrl, uploadLogo } from "../lib/api.js";
import { downloadImportTemplate, parseProductsFile, importProducts } from "../lib/bulkImport.js";

export function TopBar({
  query, setQuery, view, setView, total, onAddProduct, isAdmin, onLogout, sede,
  pdfBusy, onDownloadPdfCatalog, onDownloadPdfInternalUSD, onDownloadPdfInternalVES, onDownloadOrderSheet,
  pickMode, onTogglePickMode, selectedCount,
  bcvRate, bcvDate, bcvBusy, onRefreshBcv,
  settings, onOpenSettings, sedes, onOpenSedes, onProductsImported,
}) {
  const [logoUrl, setLogoUrl] = useState(getLogoUrl());
  const [busy, setBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const inputRef = useRef(null);
  const importInputRef = useRef(null);
  const sedeRif = (sedes || []).find((s) => s.key === sede)?.rif;

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImportBusy(true);
    try {
      const { rows, errors } = await parseProductsFile(file, sedes || []);
      if (!rows.length) {
        alert(errors.length ? `No se importó nada. ${errors.length} fila(s) con error (falta código o nombre).` : "El archivo no tiene filas para importar.");
        return;
      }
      const warn = errors.length ? `\n\n${errors.length} fila(s) se omitirán por error (falta código o nombre).` : "";
      if (!confirm(`Se van a crear o actualizar ${rows.length} producto(s) (se identifican por código).${warn}\n\n¿Continuar?`)) return;
      const { okCount, failed } = await importProducts(rows);
      onProductsImported && onProductsImported();
      let msg = `Importación terminada: ${okCount} de ${rows.length} producto(s) guardados.`;
      if (failed.length) msg += `\n\nFallaron ${failed.length}:\n` + failed.slice(0, 10).map((f) => `- ${f.codigo}: ${f.message}`).join("\n");
      alert(msg);
    } catch (err) {
      alert("Error al leer el archivo: " + (err.message || err));
    } finally {
      setImportBusy(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadLogo(file);
      setLogoUrl(getLogoUrl() + "?t=" + Date.now()); // cache bust
    } catch (err) {
      alert("Error al subir el logo: " + (err.message || err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="brand-mark">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 8 }}
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                title="Cambiar logo"
              />
            ) : (
              (settings?.company_name || "D")[0]
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleLogoChange}
              disabled={busy}
            />
          </div>
          <div>
            <div className="brand-name">{settings?.company_name || "Dipalma"}</div>
            <div className="brand-sub">
              {settings?.tagline || "Portafolio Comercial"}
              {sede && <span className="sede-pill" style={{ marginLeft: 8, padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.12)" }}>{sede}</span>}
            </div>
            {sede && sedeRif && (
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>RIF {sedeRif}</div>
            )}
            {isAdmin && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 2, fontSize: 12, padding: "2px 8px" }}
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                {busy ? "Subiendo…" : "Cambiar logo"}
              </button>
            )}
          </div>
        </div>
        <div className="search">
          <span className="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input
            type="text"
            placeholder={settings?.search_placeholder || "Buscar por nombre, código o presentación…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <button
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, padding: "6px 10px" }}
            onClick={onRefreshBcv}
            disabled={bcvBusy}
            title="Actualizar la tasa oficial BCV del día"
          >
            {bcvBusy ? "Actualizando…" : bcvRate ? `BCV Bs. ${bcvRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Actualizar BCV"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, padding: "6px 10px" }}
            onClick={onDownloadPdfCatalog}
            disabled={!!pdfBusy}
            title="Descargar catálogo para clientes en PDF (sin precios)"
          >
            {pdfBusy === "catalog" ? "Generando…" : "Catálogo PDF"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, padding: "6px 10px" }}
            onClick={onDownloadPdfInternalUSD}
            disabled={!!pdfBusy}
            title="Descargar lista de precios de uso interno en PDF (US$)"
          >
            {pdfBusy === "USD" ? "Generando…" : "Interno US$"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, padding: "6px 10px" }}
            onClick={onDownloadPdfInternalVES}
            disabled={!!pdfBusy}
            title="Descargar lista de precios de uso interno en PDF (Bs., tasa BCV del día)"
          >
            {pdfBusy === "VES" ? "Generando…" : "Interno Bs."}
          </button>
          <button
            className={"btn btn-secondary btn-sm" + (pickMode ? " active" : "")}
            style={{ fontSize: 12, padding: "6px 10px" }}
            onClick={onTogglePickMode}
            title="Elegir productos en el catálogo antes de descargar la hoja de pedido, en vez de traer todos"
          >
            {pickMode ? "Elegir productos ✓" : "Elegir productos"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, padding: "6px 10px" }}
            onClick={onDownloadOrderSheet}
            disabled={!!pdfBusy}
            title="Descargar hoja de pedido en Excel (.xlsx) con US$ y Bs. (tasa BCV del día): los productos elegidos, o todos si no elegiste ninguno"
          >
            {pdfBusy === "xlsx" ? "Generando…" : pickMode && selectedCount > 0 ? `Hoja de pedido (${selectedCount})` : "Hoja de pedido"}
          </button>
          {isAdmin && (
            <button className="btn btn-add" onClick={onAddProduct} title="Añadir producto nuevo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
              Añadir producto
            </button>
          )}
          {isAdmin && (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleImportFile}
                disabled={importBusy}
              />
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, padding: "6px 10px" }}
                onClick={() => importInputRef.current?.click()}
                disabled={importBusy}
                title="Crear o actualizar muchos productos a la vez desde un archivo Excel/CSV"
              >
                {importBusy ? "Importando…" : "📥 Importar productos"}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, padding: "6px 10px" }}
                onClick={() => downloadImportTemplate(sedes || [])}
                title="Descargar plantilla Excel con las columnas correctas para importar"
              >
                Plantilla
              </button>
            </>
          )}
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={onOpenSedes} title="Agregar, renombrar o eliminar sedes" style={{ fontSize: 12, padding: "6px 10px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 21v-4h6v4"/></svg>
              Sedes
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={onOpenSettings} title="Editar nombre de la empresa y otros textos de la app" style={{ fontSize: 12, padding: "6px 10px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Configuración
            </button>
          )}
          <span className="count-pill">{total} productos</span>
          <div className="viewtoggle" role="tablist" aria-label="Vista">
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>Grid</button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>Lista</button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Cerrar sesión" style={{ fontSize: 12, padding: "6px 10px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
