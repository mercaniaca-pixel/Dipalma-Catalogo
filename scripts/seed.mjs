// Seed inicial: corre UNA vez para poblar Supabase con los 30 productos base.
//
//   npm run seed
//
// Requiere SUPABASE_SERVICE_ROLE_KEY en .env (NO la anon — el service role salta RLS).
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { SEED_PRODUCTS } from "../src/data/seed.js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log(`Subiendo ${SEED_PRODUCTS.length} productos…`);
  const rows = SEED_PRODUCTS.map((p) => ({
    ...p,
    is_custom: false,
    unavailable: false,
  }));
  const { data, error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "codigo" })
    .select();
  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  console.log(`✓ ${data.length} productos insertados/actualizados.`);
}

main();
