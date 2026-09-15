import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // No reventamos la app — mostramos un aviso útil.
  console.warn(
    "[Supabase] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
      "Copia .env.example a .env y rellena las credenciales."
  );
}

export const supabase = createClient(url || "https://invalid.local", anon || "invalid", {
  auth: { persistSession: false },
});

export const PHOTO_BUCKET = "product-photos";

/** URL pública de una foto a partir de su path en el bucket. */
export function photoUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}
