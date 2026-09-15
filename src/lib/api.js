// ============================================================
// Logo
// ============================================================

const LOGO_PATH = "logo.jpg";

/**
 * Sube el logo de la empresa al bucket de fotos.
 * Devuelve el path del logo.
 */
export async function uploadLogo(file) {
  const blob = await compressImage(file, { maxDim: 600, quality: 0.85 });
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(LOGO_PATH, blob, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "3600",
    });
  if (error) throw error;
  return LOGO_PATH;
}

/**
 * Obtiene la URL pública del logo.
 */
export function getLogoUrl() {
  return photoUrl(LOGO_PATH);
}
import { supabase, PHOTO_BUCKET, photoUrl } from "./supabase.js";
import { compressImage } from "./image.js";

// ============================================================
// Productos
// ============================================================

export async function listProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_n", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(decorate);
}

export async function upsertProduct(p) {
  // p: { id?, codigo, producto, marca, categoria, presentacion, uso,
  //      unavailable?, is_custom?, sort_n?, photo_path? }
  const payload = {
    codigo: p.codigo,
    producto: p.producto,
    marca: p.marca,
    categoria: p.categoria,
    presentacion: p.presentacion ?? null,
    uso: p.uso ?? null,
    unavailable: p.unavailable ?? false,
    is_custom: p.is_custom ?? false,
    sort_n: p.sort_n ?? null,
    photo_path: p.photo_path ?? null,
    sector: p.sector ?? [],
    precio: p.precio ?? null,
    precio_dipal: p.precio_dipal ?? null,
    precios: p.precios ?? null,
    precio_camaron: p.precio_camaron ?? null,
    sedes: p.sedes && p.sedes.length ? p.sedes : ["Dipalma"],
  };
  let q;
  if (p.id) {
    q = supabase.from("products").update(payload).eq("id", p.id).select().single();
  } else {
    // Upsert por código (único)
    q = supabase
      .from("products")
      .upsert(payload, { onConflict: "codigo" })
      .select()
      .single();
  }
  const { data, error } = await q;
  if (error) throw error;
  return decorate(data);
}

export async function deleteProduct(id, photoPath) {
  if (photoPath) {
    await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]).catch(() => {});
  }
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function setUnavailable(id, value) {
  const { error } = await supabase
    .from("products")
    .update({ unavailable: !!value })
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Fotos
// ============================================================

/**
 * Sube una foto comprimida y devuelve el path dentro del bucket.
 * Sobrescribe si ya existe.
 */
export async function uploadPhoto(file, codigo, oldPath = null) {
  const blob = await compressImage(file, { maxDim: 1100, quality: 0.78 });
  // Timestamp en el nombre → path único por subida, evita conflictos y caché del navegador.
  const path = `${slug(codigo)}_${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, {
      contentType: "image/jpeg",
      upsert: false,
      cacheControl: "3600",
    });
  if (error) throw error;
  // Eliminar el archivo anterior (si existía) tras subir exitosamente.
  if (oldPath && oldPath !== path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([oldPath]).catch(() => {});
  }
  return path;
}

export async function removePhoto(path) {
  if (!path) return;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

// ============================================================
// Helpers
// ============================================================

function slug(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function decorate(row) {
  return {
    ...row,
    // fallback por si la migración de sedes aún no corrió en la base
    sedes: row.sedes && row.sedes.length ? row.sedes : ["Dipalma"],
    // url cacheada para que los componentes la usen sin pensar
    photo_url: row.photo_path ? photoUrl(row.photo_path) : null,
  };
}
