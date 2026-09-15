import { useRef, useState } from "react";
import { PlaceholderImg } from "./PlaceholderImg.jsx";
import { uploadPhoto, removePhoto } from "../lib/api.js";

/**
 * Drop-zone de foto del producto. Comprime + sube a Supabase Storage.
 * Props:
 *   producto: { codigo, categoria, photo_path, photo_url, ... }
 *   editable: si false, solo muestra (modo card).
 *   large:    estilo modal (botón "Quitar").
 *   onUpdated(newPhotoPath | null): callback tras subir/quitar para que el padre refresque.
 */
export function ProductImage({ producto, editable = true, large = false, onUpdated }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files) => {
    const file = files && files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const path = await uploadPhoto(file, producto.codigo, producto.photo_path);
      onUpdated && onUpdated(path);
    } catch (e) {
      alert("No se pudo subir la foto: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    if (!confirm("¿Quitar la foto de " + producto.codigo + "?")) return;
    setBusy(true);
    try {
      await removePhoto(producto.photo_path);
      onUpdated && onUpdated(null);
    } catch (e) {
      alert("Error: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  const photoUrl = producto.photo_url;

  return (
    <div
      className={"prod-img" + (drag ? " dragover" : "") + (photoUrl ? " has-photo" : "")}
      onDragOver={editable ? (e) => { e.preventDefault(); setDrag(true); } : undefined}
      onDragLeave={editable ? () => setDrag(false) : undefined}
      onDrop={editable ? onDrop : undefined}
      onClick={editable ? (e) => { e.stopPropagation(); inputRef.current?.click(); } : undefined}
      title={editable ? (photoUrl ? "Click para cambiar la foto" : "Click o arrastra una imagen") : ""}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={producto.producto} />
      ) : (
        <PlaceholderImg cat={producto.categoria} codigo={producto.codigo} />
      )}
      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
          {photoUrl && large && (
            <button className="prod-img-remove" onClick={handleRemove} title="Quitar foto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Quitar
            </button>
          )}
          {!photoUrl && (
            <div className="prod-img-hint">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5L9 20"/></svg>
              <span>{drag ? "Suelta la imagen" : "Añadir foto"}</span>
            </div>
          )}
          {busy && <div className="prod-img-busy">Procesando…</div>}
        </>
      )}
    </div>
  );
}
