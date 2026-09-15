import { useState, useEffect } from "react";
import { MARCAS, CATEGORIAS } from "../data/seed.js";
import { upsertProduct } from "../lib/api.js";
import { CAMARON_TIERS, CAMARON_UNITS } from "../lib/format.js";

const SECTORES = ["Horeca", "Retail"];
const SEDES = ["Dipalma", "Dipal"];
const TIER_LABEL = { 1: "Precio 1", 2: "Precio 2", 3: "Precio 3" };

const empty = {
  codigo: "", producto: "", marca: MARCAS[0], categoria: CATEGORIAS[0],
  presentacion: "", uso: "", is_custom: true, sector: [], precio: "", precio_dipal: "",
  sedes: ["Dipalma"], precio_camaron: {},
};

function sanitizeCamaronTiers(precioCamaron) {
  if (!precioCamaron) return null;
  const clean = {};
  for (const [sedeKey, tiers] of Object.entries(precioCamaron)) {
    const cleanTiers = {};
    for (const t of CAMARON_TIERS) {
      const row = tiers?.[t];
      if (!row) continue;
      const cleanRow = {};
      for (const u of CAMARON_UNITS) {
        if (row[u.key] !== "" && row[u.key] != null) cleanRow[u.key] = Number(row[u.key]);
      }
      if (Object.keys(cleanRow).length) cleanTiers[t] = cleanRow;
    }
    if (Object.keys(cleanTiers).length) clean[sedeKey] = cleanTiers;
  }
  return Object.keys(clean).length ? clean : null;
}

export function EditModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const isNew = !product?.id;

  useEffect(() => {
    setForm(product ? { ...empty, ...product } : empty);
  }, [product]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setTierCell = (sedeKey, tier, unitKey, value) => {
    setForm((f) => ({
      ...f,
      precio_camaron: {
        ...f.precio_camaron,
        [sedeKey]: {
          ...(f.precio_camaron?.[sedeKey] || {}),
          [tier]: { ...(f.precio_camaron?.[sedeKey]?.[tier] || {}), [unitKey]: value },
        },
      },
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.producto.trim()) {
      alert("Código y nombre del producto son obligatorios.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        precio: form.precio === "" ? null : Number(form.precio),
        precio_dipal: form.precio_dipal === "" || form.precio_dipal == null ? null : Number(form.precio_dipal),
        precio_camaron: sanitizeCamaronTiers(form.precio_camaron),
      };
      const saved = await upsertProduct(payload);
      onSaved && onSaved(saved);
      onClose();
    } catch (e) {
      alert("Error al guardar: " + e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal-edit" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <form className="modal-body modal-edit-body" onSubmit={submit}>
          <h2>{isNew ? "Añadir producto" : "Editar producto"}</h2>

          <label className="field">
            <span>Código *</span>
            <input value={form.codigo} onChange={(e) => set("codigo", e.target.value)} required />
          </label>
          <label className="field">
            <span>Producto *</span>
            <input value={form.producto} onChange={(e) => set("producto", e.target.value)} required />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Marca</span>
              <select value={form.marca} onChange={(e) => set("marca", e.target.value)}>
                {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Categoría</span>
              <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="Otros productos del mar">Otros productos del mar</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Presentación</span>
            <input value={form.presentacion || ""} onChange={(e) => set("presentacion", e.target.value)} placeholder="Ej. 4.4 L, 700 cc, TALLA 31/35" />
          </label>
          <div className="field">
            <span>Sede(s) donde se vende</span>
            <div className="sector-checks">
              {SEDES.map((s) => (
                <label key={s} className="sector-check-label">
                  <input
                    type="checkbox"
                    checked={(form.sedes || []).includes(s)}
                    onChange={(e) => {
                      const curr = form.sedes || [];
                      set("sedes", e.target.checked ? [...curr, s] : curr.filter((x) => x !== s));
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          {form.categoria === "Camarones congelados" ? (
            (form.sedes || []).map((sedeKey) => (
              <div className="field" key={sedeKey}>
                <span>Precios por volumen — {sedeKey} (US$)</span>
                <div className="tablewrap">
                  <table className="camaron-tiers-edit" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th></th>
                        {CAMARON_UNITS.map((u) => (
                          <th key={u.key} style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>{u.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CAMARON_TIERS.map((t) => (
                        <tr key={t}>
                          <td style={{ padding: "2px 4px", whiteSpace: "nowrap" }}>{TIER_LABEL[t]}</td>
                          {CAMARON_UNITS.map((u) => (
                            <td key={u.key} style={{ padding: "2px 4px" }}>
                              <input
                                type="number" step="0.01" min="0"
                                value={form.precio_camaron?.[sedeKey]?.[t]?.[u.key] ?? ""}
                                onChange={(e) => setTierCell(sedeKey, t, u.key, e.target.value)}
                                style={{ width: "100%" }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <>
              {(form.sedes || []).includes("Dipalma") && (
                <label className="field">
                  <span>Precio de venta — Dipalma (US$)</span>
                  <input type="number" step="0.01" min="0" value={form.precio ?? ""} onChange={(e) => set("precio", e.target.value)} placeholder="Ej. 33.35" />
                </label>
              )}
              {(form.sedes || []).includes("Dipal") && (
                <label className="field">
                  <span>Precio de venta — Dipal (US$)</span>
                  <input type="number" step="0.01" min="0" value={form.precio_dipal ?? ""} onChange={(e) => set("precio_dipal", e.target.value)} placeholder="Ej. 33.35" />
                </label>
              )}
            </>
          )}
          <label className="field">
            <span>Uso comercial sugerido</span>
            <textarea rows={2} value={form.uso || ""} onChange={(e) => set("uso", e.target.value)} />
          </label>

          <div className="field">
            <span>Sector</span>
            <div className="sector-checks">
              {SECTORES.map((s) => (
                <label key={s} className="sector-check-label">
                  <input
                    type="checkbox"
                    checked={(form.sector || []).includes(s)}
                    onChange={(e) => {
                      const curr = form.sector || [];
                      set("sector", e.target.checked ? [...curr, s] : curr.filter((x) => x !== s));
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Guardando…" : (isNew ? "Crear producto" : "Guardar cambios")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
