import { useState } from "react";
import { updateSettings } from "../lib/settings.js";

const FIELDS = [
  { key: "company_name", label: "Nombre de la empresa", placeholder: "Dipalma" },
  { key: "tagline", label: "Eslogan (junto al nombre)", placeholder: "Portafolio Comercial" },
  { key: "login_subtitle", label: "Subtítulo en la pantalla de inicio de sesión", placeholder: "Portafolio Comercial" },
  { key: "search_placeholder", label: "Texto del buscador", placeholder: "Buscar por nombre, código o presentación…" },
  { key: "footer_text", label: "Texto del pie de página", placeholder: "Se arma automáticamente si lo dejas vacío" },
  { key: "pdf_footer_text", label: "Pie de página en los PDF exportados", placeholder: "Portafolio Comercial" },
  { key: "whatsapp_signature", label: "Firma al compartir un producto por WhatsApp", placeholder: "Catálogo Dipalma" },
];

export function SettingsModal({ settings, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...settings }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateSettings(form);
      onSaved(updated);
      onClose();
    } catch (e2) {
      setError(e2.message || String(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal-edit modal-single-col" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <form className="modal-body modal-edit-body" onSubmit={submit}>
          <h2>Configuración de la app</h2>
          <p style={{ marginTop: -8, marginBottom: 8, fontSize: 13, color: "#64748b" }}>
            Estos textos se muestran en toda la app (pantalla de inicio, encabezado, PDFs). Los cambios se aplican al instante para todos.
          </p>

          {FIELDS.map((f) => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <input value={form[f.key] || ""} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
            </label>
          ))}

          {error && <p style={{ color: "#a23", fontSize: 13 }}>{error}</p>}

          <div className="field-row" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-add" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
