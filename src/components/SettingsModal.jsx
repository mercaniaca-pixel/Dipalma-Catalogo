import { useState } from "react";
import { updateSettings } from "../lib/settings.js";

const FIELDS = [
  { key: "company_name", label: "Nombre de la empresa", placeholder: "Dipalma" },
  { key: "tagline", label: "Eslogan (junto al nombre)", placeholder: "Portafolio Comercial" },
  { key: "login_subtitle", label: "Subtítulo en la pantalla de inicio de sesión", placeholder: "Portafolio Comercial" },
  { key: "hero_title", label: "Título grande de la portada", placeholder: "Portafolio Comercial" },
  { key: "search_placeholder", label: "Texto del buscador", placeholder: "Buscar por nombre, código o presentación…" },
  { key: "footer_text", label: "Texto del pie de página", placeholder: "Se arma automáticamente si lo dejas vacío" },
  { key: "pdf_footer_text", label: "Pie de página en los PDF exportados", placeholder: "Portafolio Comercial" },
  { key: "whatsapp_signature", label: "Firma al compartir un producto por WhatsApp", placeholder: "Catálogo Dipalma" },
];

const emptyCat = { name: "", match: "" };

export function SettingsModal({ settings, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...settings }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [cats, setCats] = useState(() =>
    (settings?.hero_categories || []).map((c) => ({ name: c.name || "", match: (c.match || []).join(", ") }))
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setCat = (i, patch) => setCats((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addCat = () => setCats((cs) => [...cs, { ...emptyCat }]);
  const removeCat = (i) => setCats((cs) => cs.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const cleanCats = cats
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          match: c.match.split(",").map((s) => s.trim()).filter(Boolean),
        }));
      const payload = { ...form, hero_categories: cleanCats.length ? cleanCats : null };
      const updated = await updateSettings(payload);
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

          <label className="field">
            <span>Contraseña de administrador (compartida por todas las sedes)</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={showPass ? "text" : "password"}
                value={form.admin_password || ""}
                placeholder="dipalma2026 (por defecto)"
                onChange={(e) => set("admin_password", e.target.value)}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPass((v) => !v)}>
                {showPass ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>

          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 10, padding: 14, marginTop: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Tarjetas de categoría en la portada</div>
            <p style={{ marginTop: 0, marginBottom: 8, fontSize: 12, color: "#64748b" }}>
              Si no defines ninguna, se muestran solas las 4 categorías con más productos.
            </p>
            {cats.map((c, i) => (
              <div key={i} className="field-row" style={{ marginBottom: 8 }}>
                <label className="field">
                  <span>Nombre visible</span>
                  <input value={c.name} onChange={(e) => setCat(i, { name: e.target.value })} placeholder="Ej. Camarones & frutos del mar" />
                </label>
                <label className="field">
                  <span>Categorías que agrupa (separadas por coma)</span>
                  <input value={c.match} onChange={(e) => setCat(i, { match: e.target.value })} placeholder="Ej. Camarones congelados, Otros productos del mar" />
                </label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeCat(i)} style={{ color: "#a23", alignSelf: "flex-end" }}>
                  Quitar
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-add btn-sm" onClick={addCat}>+ Agregar tarjeta</button>
          </div>

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
