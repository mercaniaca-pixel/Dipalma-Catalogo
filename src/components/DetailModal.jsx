import { useState, useEffect } from "react";
import { ProductImage } from "./ProductImage.jsx";
import {
  normMarca, prettyTitle, tagClass, formatPrice, formatPriceVES, priceForSede,
  camaronTiers, CAMARON_TIERS, CAMARON_UNITS,
} from "../lib/format.js";
import { setUnavailable, deleteProduct, upsertProduct } from "../lib/api.js";

const TIER_LABEL = { 1: "Precio 1 (mayor a 1 bulto)", 2: "Precio 2 (4 a 9 estuches)", 3: "Precio 3 (2 a 3 estuches)" };

function CamaronTable({ tiers, bcvRate }) {
  return (
    <table className="camaron-tiers" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, margin: "6px 0" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "3px 6px" }}></th>
          {CAMARON_UNITS.map((u) => (
            <th key={u.key} style={{ textAlign: "right", padding: "3px 6px", fontWeight: 600 }}>{u.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CAMARON_TIERS.map((t) => {
          const row = tiers[t];
          if (!row) return null;
          return (
            <tr key={t} style={{ borderTop: "1px solid var(--ink-100)" }}>
              <td style={{ padding: "3px 6px", opacity: 0.7 }}>{TIER_LABEL[t] || `Precio ${t}`}</td>
              {CAMARON_UNITS.map((u) => (
                <td key={u.key} style={{ textAlign: "right", padding: "3px 6px" }}>
                  {formatPrice(row[u.key]) || "—"}
                  {formatPriceVES(row[u.key], bcvRate) && (
                    <div style={{ fontSize: "0.8em", opacity: 0.6 }}>{formatPriceVES(row[u.key], bcvRate)}</div>
                  )}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function DetailModal({ product, onClose, onEdit, onChanged, isAdmin, sede, bcvRate, settings }) {
  const [copied, setCopied] = useState(false);
  const [unavail, setUnavail] = useState(!!product?.unavailable);
  const [editingPriceSede, setEditingPriceSede] = useState(null); // null | "Dipalma" | "Dipal"
  const [priceDraft, setPriceDraft] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [editingCodigo, setEditingCodigo] = useState(false);
  const [codigoDraft, setCodigoDraft] = useState("");
  const [savingCodigo, setSavingCodigo] = useState(false);

  useEffect(() => { setUnavail(!!product?.unavailable); }, [product]);
  useEffect(() => { setEditingPriceSede(null); setEditingCodigo(false); }, [product]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!product) return null;
  const p = product;

  const toggleAvail = async () => {
    const next = !unavail;
    setUnavail(next);
    try {
      await setUnavailable(p.id, next);
      onChanged && onChanged();
    } catch (e) { alert("Error: " + e.message); setUnavail(!next); }
  };

  const startEditPrice = (priceSede) => {
    setPriceDraft(priceForSede(p, priceSede) ?? "");
    setEditingPriceSede(priceSede);
  };

  const savePrice = async () => {
    const value = priceDraft === "" ? null : Number(priceDraft);
    if (value !== null && Number.isNaN(value)) {
      alert("Precio inválido.");
      return;
    }
    setSavingPrice(true);
    try {
      const nextPrecios = { ...(p.precios || {}), [editingPriceSede]: value };
      if (value === null) delete nextPrecios[editingPriceSede];
      await upsertProduct({ ...p, precios: nextPrecios });
      onChanged && onChanged();
      setEditingPriceSede(null);
    } catch (e) { alert("Error al guardar precio: " + e.message); }
    finally { setSavingPrice(false); }
  };

  const startEditCodigo = () => {
    setCodigoDraft(p.codigo);
    setEditingCodigo(true);
  };

  const saveCodigo = async () => {
    const value = codigoDraft.trim();
    if (!value) {
      alert("El código no puede quedar vacío.");
      return;
    }
    setSavingCodigo(true);
    try {
      await upsertProduct({ ...p, codigo: value });
      onChanged && onChanged();
      setEditingCodigo(false);
    } catch (e) { alert("Error al guardar código: " + e.message); }
    finally { setSavingCodigo(false); }
  };

  const handleSectorToggle = async (s) => {
    const curr = p.sector || [];
    const next = curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s];
    try {
      await upsertProduct({ ...p, sector: next });
      onChanged && onChanged();
    } catch (e) { alert("Error: " + e.message); }
  };

  const handlePhotoUpdated = async (newPath) => {
    try {
      await upsertProduct({ ...p, photo_path: newPath });
      onChanged && onChanged();
    } catch (e) { alert("Error al guardar foto: " + e.message); }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar definitivamente "${prettyTitle(p.producto)}"?`)) return;
    try {
      await deleteProduct(p.id, p.photo_path);
      onChanged && onChanged();
      onClose();
    } catch (e) { alert("Error: " + e.message); }
  };

  const shareWhatsApp = () => {
    const txt =
      `*${prettyTitle(p.producto)}*\n` +
      `Código: ${p.codigo}\n` +
      `Marca: ${normMarca(p.marca)}\n` +
      `Categoría: ${p.categoria}\n` +
      `Presentación: ${p.presentacion}\n` +
      (formatPrice(priceForSede(p, sede)) ? `Precio: ${formatPrice(priceForSede(p, sede))}\n` : "") +
      `Uso sugerido: ${p.uso}\n\n— ${settings?.whatsapp_signature || "Catálogo Dipalma"}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank", "noopener,noreferrer");
  };
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(p.codigo);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <div className="modal-img">
          <ProductImage producto={p} large={true} editable={isAdmin} onUpdated={handlePhotoUpdated} />
        </div>
        <div className="modal-body">
          <div className="modal-marca">{normMarca(p.marca)}</div>
          <h2>{prettyTitle(p.producto)}</h2>
          {isAdmin ? (
            editingCodigo ? (
              <div className="modal-codigo-edit">
                <input
                  type="text" autoFocus
                  className="modal-codigo-input"
                  value={codigoDraft}
                  onChange={(e) => setCodigoDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCodigo();
                    if (e.key === "Escape") setEditingCodigo(false);
                  }}
                />
                <button className="btn btn-primary btn-sm" onClick={saveCodigo} disabled={savingCodigo}>
                  {savingCodigo ? "…" : "Guardar"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingCodigo(false)}>Cancelar</button>
              </div>
            ) : (
              <div className="modal-codigo modal-codigo-editable" onClick={startEditCodigo} title="Clic para editar el código">
                Código {p.codigo}
                <svg className="modal-precio-pencil" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
            )
          ) : (
            <div className="modal-codigo">Código {p.codigo}</div>
          )}
          {isAdmin ? (
            (p.sedes || ["Dipalma"]).map((s) => {
              const tiers = camaronTiers(p, s);
              if (tiers) {
                return (
                  <div key={s} style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>{s}</span>
                    <CamaronTable tiers={tiers} bcvRate={bcvRate} />
                    <div style={{ fontSize: 11, opacity: 0.55 }}>Editar tabla desde "Editar" abajo.</div>
                  </div>
                );
              }
              return (
                <div key={s} style={{ marginBottom: 4 }}>
                  {editingPriceSede === s ? (
                    <div className="modal-precio-edit">
                      <input
                        type="number" step="0.01" min="0" autoFocus
                        className="modal-precio-input"
                        value={priceDraft}
                        placeholder="Sin precio"
                        onChange={(e) => setPriceDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePrice();
                          if (e.key === "Escape") setEditingPriceSede(null);
                        }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={savePrice} disabled={savingPrice}>
                        {savingPrice ? "…" : "Guardar"}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingPriceSede(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <div className="modal-precio modal-precio-editable" onClick={() => startEditPrice(s)} title={`Clic para editar el precio en ${s}`}>
                      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, marginRight: 6 }}>{s}</span>
                      {formatPrice(priceForSede(p, s)) || "Añadir precio"}
                      {formatPriceVES(priceForSede(p, s), bcvRate) && (
                        <span style={{ fontSize: "0.75em", fontWeight: 400, opacity: 0.65, marginLeft: 6 }}>
                          · {formatPriceVES(priceForSede(p, s), bcvRate)}
                        </span>
                      )}
                      <svg className="modal-precio-pencil" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </div>
                  )}
                </div>
              );
            })
          ) : camaronTiers(p, sede) ? (
            <CamaronTable tiers={camaronTiers(p, sede)} bcvRate={bcvRate} />
          ) : (
            formatPrice(priceForSede(p, sede)) && (
              <div className="modal-precio">
                {formatPrice(priceForSede(p, sede))}
                {formatPriceVES(priceForSede(p, sede), bcvRate) && (
                  <span style={{ fontSize: "0.7em", fontWeight: 400, opacity: 0.65, marginLeft: 8 }}>
                    · {formatPriceVES(priceForSede(p, sede), bcvRate)}
                  </span>
                )}
              </div>
            )
          )}
          <dl className="modal-fields">
            <div className="modal-field"><dt>Categoría</dt><dd><span className={tagClass(p.categoria)}>{p.categoria}</span></dd></div>
            <div className="modal-field"><dt>Presentación</dt><dd className="mono">{p.presentacion}</dd></div>
            <div className="modal-field"><dt>Marca</dt><dd>{normMarca(p.marca)}</dd></div>
            <div className="modal-field"><dt>Uso sugerido</dt><dd>{p.uso}</dd></div>
            <div className="modal-field">
              <dt>Sector</dt>
              <dd>
                <div className="sector-btns">
                  {["Horeca", "Retail"].map((s) => (
                    <button
                      key={s}
                      className={"sector-btn" + ((p.sector || []).includes(s) ? " active" : "")}
                      onClick={isAdmin ? () => handleSectorToggle(s) : undefined}
                      style={{ cursor: isAdmin ? "pointer" : "default" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </dd>
            </div>
          </dl>
          <div className="modal-actions">
            {isAdmin && (
              <button
                className={"btn " + (unavail ? "btn-avail-off" : "btn-avail-on")}
                onClick={toggleAvail}
              >
                <span className="avail-dot" />
                {unavail ? "No disponible — marcar disponible" : "Disponible — marcar no disponible"}
              </button>
            )}
            <button className="btn btn-primary" onClick={shareWhatsApp}>
              Compartir por WhatsApp
            </button>
            <button className={"btn btn-secondary" + (copied ? " copied" : "")} onClick={copyCode}>
              {copied ? "✓ Copiado" : "Copiar código"}
            </button>
            {isAdmin && <button className="btn btn-secondary" onClick={() => onEdit(p)}>Editar</button>}
            {isAdmin && <button className="btn btn-secondary" onClick={handleDelete} style={{ color: "#a23" }}>Eliminar</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
