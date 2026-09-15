import { useState } from "react";
import { upsertSede, deleteSede } from "../lib/sedes.js";

const emptyNew = { key: "", label: "", rif: "", applies_iva: false };

export function SedesModal({ sedes, currentSede, onClose, onChanged }) {
  const [drafts, setDrafts] = useState(() => Object.fromEntries(sedes.map((s) => [s.key, { ...s }])));
  const [busyKey, setBusyKey] = useState(null);
  const [newSede, setNewSede] = useState(emptyNew);
  const [addingBusy, setAddingBusy] = useState(false);
  const [error, setError] = useState("");

  const setDraft = (key, patch) => setDrafts((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  const saveSede = async (key) => {
    setBusyKey(key);
    setError("");
    try {
      await upsertSede(drafts[key]);
      onChanged && onChanged();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusyKey(null);
    }
  };

  const removeSede = async (key, label) => {
    if (key === currentSede) {
      alert(`No puedes eliminar "${label}" mientras la tienes abierta. Cierra sesión y entra con otra sede primero.`);
      return;
    }
    if (sedes.length <= 1) {
      alert("Debe quedar al menos una sede.");
      return;
    }
    if (!confirm(`¿Eliminar la sede "${label}"? Se quitará de todos los productos que la tengan asignada (sus precios ahí se pierden). Esta acción no se puede deshacer.`)) return;
    setBusyKey(key);
    setError("");
    try {
      const { affectedCount } = await deleteSede(key);
      onChanged && onChanged();
      if (affectedCount > 0) alert(`Sede eliminada. Se actualizaron ${affectedCount} producto(s) que la tenían asignada.`);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusyKey(null);
    }
  };

  const addSede = async () => {
    if (!newSede.key.trim()) {
      setError("La sede necesita una clave corta (ej. \"Norte\", sin espacios ni tildes).");
      return;
    }
    if (sedes.some((s) => s.key.toLowerCase() === newSede.key.trim().toLowerCase())) {
      setError("Ya existe una sede con esa clave.");
      return;
    }
    setAddingBusy(true);
    setError("");
    try {
      await upsertSede({ ...newSede, sort_n: sedes.length + 1 });
      setNewSede(emptyNew);
      onChanged && onChanged();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setAddingBusy(false);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal-edit" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <button className="modal-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <div className="modal-body modal-edit-body">
          <h2>Sedes</h2>
          <p style={{ marginTop: -8, marginBottom: 8, fontSize: 13, color: "#64748b" }}>
            Cada sede genera sus propios perfiles "Ventas" y "Admin" en la pantalla de inicio de sesión, y puede tener precios y reglas de IVA distintas. Eliminar una sede no se puede deshacer.
          </p>

          {sedes.map((sd) => {
            const d = drafts[sd.key] || sd;
            return (
              <div key={sd.key} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div className="field-row">
                  <label className="field">
                    <span>Nombre visible</span>
                    <input value={d.label} onChange={(e) => setDraft(sd.key, { label: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>RIF (opcional)</span>
                    <input value={d.rif || ""} onChange={(e) => setDraft(sd.key, { rif: e.target.value })} />
                  </label>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, margin: "8px 0" }}>
                  <input type="checkbox" checked={!!d.applies_iva} onChange={(e) => setDraft(sd.key, { applies_iva: e.target.checked })} />
                  Esta sede factura con 16% de IVA
                </label>
                <div className="field-row">
                  <button className="btn btn-secondary btn-sm" disabled={busyKey === sd.key} onClick={() => saveSede(sd.key)}>
                    {busyKey === sd.key ? "Guardando…" : "Guardar cambios"}
                  </button>
                  <button className="btn btn-secondary btn-sm" disabled={busyKey === sd.key} onClick={() => removeSede(sd.key, sd.label)} style={{ color: "#a23" }}>
                    Eliminar sede
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Agregar nueva sede</div>
            <div className="field-row">
              <label className="field">
                <span>Clave (sin espacios, ej. "Norte")</span>
                <input value={newSede.key} onChange={(e) => setNewSede((s) => ({ ...s, key: e.target.value }))} />
              </label>
              <label className="field">
                <span>Nombre visible</span>
                <input value={newSede.label} onChange={(e) => setNewSede((s) => ({ ...s, label: e.target.value }))} placeholder="Igual a la clave si lo dejas vacío" />
              </label>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, margin: "8px 0" }}>
              <input type="checkbox" checked={newSede.applies_iva} onChange={(e) => setNewSede((s) => ({ ...s, applies_iva: e.target.checked }))} />
              Factura con 16% de IVA
            </label>
            <button className="btn btn-add btn-sm" disabled={addingBusy} onClick={addSede}>
              {addingBusy ? "Agregando…" : "+ Agregar sede"}
            </button>
          </div>

          {error && <p style={{ color: "#a23", fontSize: 13, marginTop: 12 }}>{error}</p>}

          <div className="field-row" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
