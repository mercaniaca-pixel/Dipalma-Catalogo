import { useState } from "react";
import { prettyTitle, priceForSede, camaronTiers, cheapestKg } from "../lib/format.js";
import { generateInvoicePdf } from "../lib/generateInvoice.js";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toDMY(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function startingPrecioBs(p, sede, bcvRate) {
  const usd = priceForSede(p, sede);
  if (usd !== null && usd !== undefined && usd !== "") return Math.round(Number(usd) * (bcvRate || 0) * 100) / 100;
  const kg = cheapestKg(camaronTiers(p, sede));
  if (kg !== null) return Math.round(kg * (bcvRate || 0) * 100) / 100;
  return 0;
}

export function InvoiceModal({ products, sede, bcvRate, onClose }) {
  const [cliente, setCliente] = useState({ razonSocial: "", rif: "", direccion1: "", direccion2: "", contacto: "", telefonos: "" });
  const [numero, setNumero] = useState("");
  const [clienteNo, setClienteNo] = useState("");
  const [fecha, setFecha] = useState(todayStr());
  const [vencimiento, setVencimiento] = useState("");
  const [credito, setCredito] = useState("");
  const [asesor, setAsesor] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [items, setItems] = useState(() =>
    products.map((p) => ({
      codigo: p.codigo,
      descripcion: prettyTitle(p.producto) + (p.presentacion ? ` ${p.presentacion}` : ""),
      cantidad: 1,
      precioBs: startingPrecioBs(p, sede, bcvRate),
      isVolumePriced: !!camaronTiers(p, sede) && (priceForSede(p, sede) === null || priceForSede(p, sede) === undefined),
    }))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setCli = (k, v) => setCliente((c) => ({ ...c, [k]: v }));
  const setItem = (i, patch) => setItems((its) => its.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i) => setItems((its) => its.filter((_, idx) => idx !== i));

  const totalItems = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precioBs) || 0), 0);
  const totalFactura = totalItems - (Number(descuento) || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!cliente.razonSocial.trim()) { setError("Falta la razón social del cliente."); return; }
    if (!numero.trim()) { setError("Falta el número de factura."); return; }
    if (!items.length) { setError("No hay productos en la factura."); return; }
    setBusy(true);
    setError("");
    try {
      const result = await generateInvoicePdf({
        cliente,
        factura: { numero, clienteNo, fecha: toDMY(fecha), vencimiento: toDMY(vencimiento), credito, asesor },
        items,
        descuento: Number(descuento) || 0,
        bcvRate,
      });
      if (!result.ok) { setError(result.reason); return; }
      onClose();
    } catch (e2) {
      setError(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal-edit modal-single-col" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
        <button className="modal-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <form className="modal-body modal-edit-body" onSubmit={submit}>
          <h2>Facturar</h2>
          <p style={{ marginTop: -8, marginBottom: 8, fontSize: 13, color: "#64748b" }}>
            Genera un PDF con solo el texto de la factura (sin logo ni membrete) para imprimir encima de la hoja "Forma Libre" de Dipalma ya membretada.
          </p>

          <div className="field-row">
            <label className="field">
              <span>Razón social del cliente</span>
              <input value={cliente.razonSocial} onChange={(e) => setCli("razonSocial", e.target.value)} />
            </label>
            <label className="field">
              <span>RIF</span>
              <input value={cliente.rif} onChange={(e) => setCli("rif", e.target.value)} placeholder="J-000000000" />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Dirección (línea 1)</span>
              <input value={cliente.direccion1} onChange={(e) => setCli("direccion1", e.target.value)} />
            </label>
            <label className="field">
              <span>Dirección (línea 2)</span>
              <input value={cliente.direccion2} onChange={(e) => setCli("direccion2", e.target.value)} />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Contacto</span>
              <input value={cliente.contacto} onChange={(e) => setCli("contacto", e.target.value)} />
            </label>
            <label className="field">
              <span>Teléfonos</span>
              <input value={cliente.telefonos} onChange={(e) => setCli("telefonos", e.target.value)} />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Factura N°</span>
              <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="007161" />
            </label>
            <label className="field">
              <span>Cliente No.</span>
              <input value={clienteNo} onChange={(e) => setClienteNo(e.target.value)} />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Fecha</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
            <label className="field">
              <span>Vencimiento</span>
              <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Crédito</span>
              <input value={credito} onChange={(e) => setCredito(e.target.value)} placeholder="Contado / 30 días…" />
            </label>
            <label className="field">
              <span>Asesor</span>
              <input value={asesor} onChange={(e) => setAsesor(e.target.value)} />
            </label>
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 8, marginBottom: 4 }}>Productos ({items.length})</div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            {items.map((it, i) => (
              <div key={it.codigo + i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 12.5 }}>
                <div style={{ width: 70, color: "#64748b" }}>{it.codigo}</div>
                <div style={{ flex: 1 }}>
                  {it.descripcion}
                  {it.isVolumePriced && <div style={{ fontSize: 11, color: "#a23" }}>Precio por volumen — revisa/edita el precio Bs.</div>}
                </div>
                <input
                  type="number" min="0" step="1" value={it.cantidad}
                  onChange={(e) => setItem(i, { cantidad: e.target.value })}
                  style={{ width: 55 }} title="Cantidad"
                />
                <input
                  type="number" min="0" step="0.01" value={it.precioBs}
                  onChange={(e) => setItem(i, { precioBs: e.target.value })}
                  style={{ width: 90 }} title="Precio Bs."
                />
                <div style={{ width: 90, textAlign: "right" }}>
                  Bs. {((Number(it.cantidad) || 0) * (Number(it.precioBs) || 0)).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeItem(i)} style={{ color: "#a23" }}>×</button>
              </div>
            ))}
            {!items.length && <div style={{ padding: 12, fontSize: 13, color: "#64748b" }}>No hay productos.</div>}
          </div>

          <div className="field-row" style={{ marginTop: 8 }}>
            <label className="field">
              <span>Descuento (Bs.)</span>
              <input type="number" min="0" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
            </label>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <span>Total Factura Bs.</span>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Bs. {totalFactura.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          {!bcvRate && <p style={{ color: "#a23", fontSize: 13 }}>No hay tasa BCV cargada — actualízala antes de facturar para que salga el "Total REF" en US$.</p>}
          {error && <p style={{ color: "#a23", fontSize: 13 }}>{error}</p>}

          <div className="field-row" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-add" disabled={busy}>{busy ? "Generando…" : "Generar factura PDF"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
