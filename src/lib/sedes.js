import { supabase } from "./supabase.js";

export async function listSedes() {
  const { data, error } = await supabase.from("sedes").select("*").order("sort_n", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data && data.length ? data : [{ key: "Dipalma", label: "Dipalma", rif: null, applies_iva: false, sort_n: 1 }];
}

export async function upsertSede(sede) {
  const payload = {
    key: sede.key.trim(),
    label: sede.label?.trim() || sede.key.trim(),
    rif: sede.rif || null,
    applies_iva: !!sede.applies_iva,
    sort_n: sede.sort_n ?? null,
  };
  const { data, error } = await supabase.from("sedes").upsert(payload, { onConflict: "key" }).select().single();
  if (error) throw error;
  return data;
}

/**
 * Elimina una sede y la limpia de todos los productos que la referencian
 * (su lista de "sedes", su precio plano en "precios" y su tabla de
 * volumen en "precio_camaron"), para que no queden productos apuntando
 * a una sede que ya no existe.
 */
export async function deleteSede(key) {
  const { data: affected, error: fetchError } = await supabase
    .from("products")
    .select("id, sedes, precios, precio_camaron")
    .contains("sedes", [key]);
  if (fetchError) throw fetchError;

  for (const p of affected || []) {
    const nextSedes = (p.sedes || []).filter((s) => s !== key);
    const nextPrecios = { ...(p.precios || {}) };
    delete nextPrecios[key];
    const nextCamaron = { ...(p.precio_camaron || {}) };
    delete nextCamaron[key];
    const { error } = await supabase
      .from("products")
      .update({
        sedes: nextSedes,
        precios: Object.keys(nextPrecios).length ? nextPrecios : null,
        precio_camaron: Object.keys(nextCamaron).length ? nextCamaron : null,
      })
      .eq("id", p.id);
    if (error) throw error;
  }

  const { error } = await supabase.from("sedes").delete().eq("key", key);
  if (error) throw error;
  return { affectedCount: (affected || []).length };
}
