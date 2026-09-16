import { useEffect, useMemo, useState, useCallback } from "react";
import { TopBar } from "./components/TopBar.jsx";
import { Hero } from "./components/Hero.jsx";
import { FilterBar } from "./components/FilterBar.jsx";
import { GridCard, ListView } from "./components/Cards.jsx";
import { DetailModal } from "./components/DetailModal.jsx";
import { EditModal } from "./components/EditModal.jsx";
import { LoginModal } from "./components/LoginModal.jsx";
import { SettingsModal } from "./components/SettingsModal.jsx";
import { SedesModal } from "./components/SedesModal.jsx";
import { InvoiceModal } from "./components/InvoiceModal.jsx";
import { listProducts } from "./lib/api.js";
import { normMarca, camaronTiers } from "./lib/format.js";
import { generateCatalogPdf } from "./lib/pdfCatalog.js";
import { getBcvRate } from "./lib/exchangeRate.js";
import { downloadOrderSheet } from "./lib/exportOrderSheet.js";
import { getSettings, DEFAULT_SETTINGS } from "./lib/settings.js";
import { listSedes } from "./lib/sedes.js";

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem("dipalma_role") || null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [sedes, setSedes] = useState([]);
  const [showSedes, setShowSedes] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => { getSettings().then(setSettings); }, []);
  const reloadSedes = useCallback(() => { listSedes().then(setSedes); }, []);
  useEffect(() => { reloadSedes(); }, [reloadSedes]);

  const handleLogin = (r) => {
    localStorage.setItem("dipalma_role", r);
    setRole(r);
  };
  const handleLogout = () => {
    localStorage.removeItem("dipalma_role");
    setRole(null);
  };

  const [kind, sedeVal] = (role || "").split(":");
  const isAdmin = kind === "admin";
  const sede = sedeVal || "Dipalma";
  const sedeInfo = sedes.find((s) => s.key === sede) || null;

  const [query, setQuery] = useState("");
  const [marca, setMarca] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [view, setView] = useState("grid");
  const [openProd, setOpenProd] = useState(null);
  const [editProd, setEditProd] = useState(null); // null=closed, {}=new, {...}=edit
  const [pdfBusy, setPdfBusy] = useState(null); // null | "catalog" | "USD" | "VES"
  const [bcvRate, setBcvRate] = useState(null);
  const [bcvDate, setBcvDate] = useState(null);
  const [bcvBusy, setBcvBusy] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [camaronChoice, setCamaronChoiceState] = useState({}); // { [codigo]: { tier, unit } }

  const toggleSelected = (codigo, product) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo); else next.add(codigo);
      return next;
    });
    // Al elegir un camarón, arranca con un nivel/unidad por defecto que se puede cambiar.
    if (product && camaronTiers(product, sede) && !camaronChoice[codigo]) {
      setCamaronChoiceState((prev) => ({ ...prev, [codigo]: { tier: "3", unit: "kg" } }));
    }
  };

  const setCamaronChoice = (codigo, patch) => {
    setCamaronChoiceState((prev) => ({ ...prev, [codigo]: { ...prev[codigo], ...patch } }));
  };

  const refreshBcv = useCallback(async (force) => {
    setBcvBusy(true);
    try {
      const { rate, date } = await getBcvRate(force);
      setBcvRate(rate);
      setBcvDate(date);
    } catch (e) {
      if (force) alert("No se pudo actualizar la tasa BCV: " + (e.message || e));
    } finally {
      setBcvBusy(false);
    }
  }, []);

  useEffect(() => { refreshBcv(false); }, [refreshBcv]);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const list = await listProducts();
      setProducts(list);
      // refresh modal product reference
      setOpenProd((curr) => curr ? list.find((p) => p.id === curr.id) || null : null);
    } catch (e) {
      setError(e.message || String(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Solo los productos que se venden en la sede de la sesión actual.
  const sedeProducts = useMemo(
    () => products.filter((p) => (p.sedes || ["Dipalma"]).includes(sede)),
    [products, sede]
  );

  const results = useMemo(() => {
    let r = sedeProducts;
    if (marca) r = r.filter((p) => normMarca(p.marca) === marca);
    if (categoria) {
      if (categoria === "Camarones congelados") {
        r = r.filter((p) => p.categoria === "Camarones congelados" || p.categoria === "Otros productos del mar");
      } else {
        r = r.filter((p) => p.categoria === categoria);
      }
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      r = r.filter((p) =>
        p.producto.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.presentacion || "").toLowerCase().includes(q) ||
        normMarca(p.marca).toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
      );
    }
    return r;
  }, [query, marca, categoria, sedeProducts]);

  // Catálogo para clientes: nunca lleva precio.
  const handleDownloadPdfCatalog = async () => {
    if (pdfBusy) return;
    setPdfBusy("catalog");
    try {
      await generateCatalogPdf(sedeProducts, { withPrice: false, sede, sedeRif: sedeInfo?.rif, footerText: settings.pdf_footer_text });
    } catch (e) {
      alert("No se pudo generar el PDF: " + (e.message || e));
    } finally {
      setPdfBusy(null);
    }
  };

  // Lista de precios de uso interno (equipo de ventas/admin), con precio.
  const handleDownloadPdfInternalUSD = async () => {
    if (pdfBusy) return;
    setPdfBusy("USD");
    try {
      await generateCatalogPdf(sedeProducts, { withPrice: true, currency: "USD", sede, sedeRif: sedeInfo?.rif, footerText: settings.pdf_footer_text });
    } catch (e) {
      alert("No se pudo generar el PDF: " + (e.message || e));
    } finally {
      setPdfBusy(null);
    }
  };

  const handleDownloadPdfInternalVES = async () => {
    if (pdfBusy) return;
    setPdfBusy("VES");
    try {
      const { rate, date, isFresh } = await getBcvRate();
      await generateCatalogPdf(sedeProducts, { withPrice: true, currency: "VES", rate, rateDate: date, sede, sedeRif: sedeInfo?.rif, footerText: settings.pdf_footer_text });
      if (!isFresh) {
        const d = new Date(date).toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" });
        alert(
          `No se pudo conectar con la tasa BCV de hoy, así que el PDF se generó con la última tasa disponible: Bs. ${rate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / US$ (${d}).`
        );
      }
    } catch (e) {
      alert("No se pudo generar el PDF: " + (e.message || e));
    } finally {
      setPdfBusy(null);
    }
  };

  const handleDownloadOrderSheet = async () => {
    if (pdfBusy) return;
    const list = pickMode && selected.size > 0
      ? sedeProducts.filter((p) => selected.has(p.codigo))
      : sedeProducts;
    setPdfBusy("xlsx");
    try {
      await downloadOrderSheet(list, sede, bcvRate, bcvDate, pickMode ? camaronChoice : {}, sedeInfo?.applies_iva);
    } catch (e) {
      alert("No se pudo generar la hoja de pedido: " + (e.message || e));
    } finally {
      setPdfBusy(null);
    }
  };

  const openInvoice = () => {
    if (!(pickMode && selected.size > 0)) {
      alert('Primero activa "Elegir productos" y marca los productos a facturar.');
      return;
    }
    setShowInvoice(true);
  };

  const togglePickMode = () => {
    setPickMode((v) => !v);
    setSelected(new Set());
    setCamaronChoiceState({});
  };

  const onPickCat = (id) => {
    setCategoria(id);
    setTimeout(() => {
      const el = document.getElementById("results");
      if (el) window.scrollTo({ top: el.offsetTop - 130, behavior: "smooth" });
    }, 80);
  };

  if (!role) return <LoginModal onLogin={handleLogin} settings={settings} />;

  if (loading) return <div className="app-loading">Cargando catálogo…</div>;
  if (error) return (
    <div className="app-loading">
      <h2>Error al conectar con Supabase</h2>
      <p style={{ color: "#a23" }}>{error}</p>
      <p>Verifica tu archivo <code>.env</code> y que el schema SQL haya corrido.</p>
    </div>
  );

  return (
    <div className="app">
      <TopBar
        query={query} setQuery={setQuery}
        view={view} setView={setView}
        total={sedeProducts.length}
        sede={sede}
        settings={settings}
        onOpenSettings={() => setShowSettings(true)}
        sedes={sedes}
        onOpenSedes={() => setShowSedes(true)}
        onProductsImported={reload}
        onAddProduct={() => setEditProd({ sedes: [sede] })}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        pdfBusy={pdfBusy}
        onDownloadPdfCatalog={handleDownloadPdfCatalog}
        onDownloadPdfInternalUSD={handleDownloadPdfInternalUSD}
        onDownloadPdfInternalVES={handleDownloadPdfInternalVES}
        onDownloadOrderSheet={handleDownloadOrderSheet}
        onOpenInvoice={openInvoice}
        pickMode={pickMode}
        onTogglePickMode={togglePickMode}
        selectedCount={selected.size}
        bcvRate={bcvRate}
        bcvDate={bcvDate}
        bcvBusy={bcvBusy}
        onRefreshBcv={() => refreshBcv(true)}
      />
      <Hero products={sedeProducts} settings={settings} onPickCat={onPickCat} />
      <FilterBar
        products={sedeProducts}
        marca={marca} setMarca={setMarca}
        categoria={categoria} setCategoria={setCategoria}
      />

      <main className="main" id="results">
        <div className="results-bar">
          <div className="results-count">
            <em>{results.length}</em> {results.length === 1 ? "producto" : "productos"}
            {(marca || categoria) && " · filtrado"}
          </div>
          <div className="results-meta">
            {marca && <span>Marca: <strong>{marca}</strong></span>}
            {marca && categoria && " · "}
            {categoria && <span>Categoría: <strong>{categoria}</strong></span>}
            {!marca && !categoria && <span>Mostrando todo el catálogo</span>}
          </div>
          {pickMode && (
            <div className="results-meta" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <strong>{selected.size}</strong> seleccionado{selected.size === 1 ? "" : "s"}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelected(new Set(results.map((p) => p.codigo)));
                  setCamaronChoiceState((prev) => {
                    const next = { ...prev };
                    results.forEach((p) => {
                      if (camaronTiers(p, sede) && !next[p.codigo]) next[p.codigo] = { tier: "3", unit: "kg" };
                    });
                    return next;
                  });
                }}
              >
                Seleccionar visibles
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(new Set()); setCamaronChoiceState({}); }}>
                Limpiar
              </button>
            </div>
          )}
        </div>

        {results.length === 0 ? (
          <div className="empty">
            <h3>Sin resultados</h3>
            <p>Intenta otro término o limpia los filtros.</p>
            <button className="btn btn-secondary" onClick={() => { setQuery(""); setMarca(null); setCategoria(null); }}>Limpiar filtros</button>
          </div>
        ) : view === "grid" ? (
          <div className="grid">
            {results.map((p) => (
              <GridCard
                key={p.codigo} p={p} variant="foto" sede={sede} isAdmin={isAdmin} bcvRate={bcvRate}
                onOpen={setOpenProd} onPhotoUpdated={reload}
                pickMode={pickMode} picked={selected.has(p.codigo)} onTogglePick={toggleSelected}
                camaronChoice={camaronChoice[p.codigo]} onSetCamaronChoice={setCamaronChoice}
              />
            ))}
          </div>
        ) : (
          <ListView
            products={results} sede={sede} isAdmin={isAdmin} bcvRate={bcvRate} onOpen={setOpenProd}
            pickMode={pickMode} selected={selected} onTogglePick={toggleSelected}
            camaronChoice={camaronChoice} onSetCamaronChoice={setCamaronChoice}
          />
        )}
      </main>

      <footer className="footer">
        {settings.footer_text || (
          <><span className="footer-brand">{settings.company_name}</span> · {settings.tagline} {sede} · {sedeProducts.length} productos</>
        )}
      </footer>

      {openProd && (
        <DetailModal
          product={openProd}
          onClose={() => setOpenProd(null)}
          onEdit={(p) => { setOpenProd(null); setEditProd(p); }}
          onChanged={reload}
          isAdmin={isAdmin}
          sede={sede}
          bcvRate={bcvRate}
          settings={settings}
        />
      )}
      {editProd !== null && (
        <EditModal
          product={editProd}
          onClose={() => setEditProd(null)}
          onSaved={() => reload()}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSaved={(updated) => setSettings(updated)}
        />
      )}
      {showSedes && (
        <SedesModal
          sedes={sedes}
          currentSede={sede}
          onClose={() => setShowSedes(false)}
          onChanged={reloadSedes}
        />
      )}
      {showInvoice && (
        <InvoiceModal
          products={pickMode && selected.size > 0 ? sedeProducts.filter((p) => selected.has(p.codigo)) : []}
          sede={sede}
          bcvRate={bcvRate}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}
