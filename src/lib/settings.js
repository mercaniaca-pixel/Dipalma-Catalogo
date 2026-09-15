import { supabase } from "./supabase.js";

export const DEFAULT_SETTINGS = {
  company_name: "Dipalma",
  tagline: "Portafolio Comercial",
  login_subtitle: "Portafolio Comercial",
  search_placeholder: "Buscar por nombre, código o presentación…",
  footer_text: "",
  whatsapp_signature: "Catálogo Dipalma",
  pdf_footer_text: "Portafolio Comercial",
  admin_password: "",
  hero_title: "Portafolio Comercial",
  hero_categories: null, // null = generado automáticamente desde los productos
};

let cache = null;

/** Trae la configuración de marca/textos de la app. Cae en los valores por
 * defecto (los de Dipalma) si la tabla no existe todavía o falla la carga,
 * para que la app nunca se rompa por esto. */
export async function getSettings() {
  if (cache) return cache;
  try {
    const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
    if (error || !data) return { ...DEFAULT_SETTINGS };
    cache = { ...DEFAULT_SETTINGS, ...data };
    return cache;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function updateSettings(patch) {
  const { data, error } = await supabase
    .from("app_settings")
    .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  cache = { ...DEFAULT_SETTINGS, ...data };
  return cache;
}
