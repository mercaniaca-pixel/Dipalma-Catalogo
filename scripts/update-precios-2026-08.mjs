// Actualización de precios — lista "NUEVO PRECIO DE VENTA" La Argentina, agosto 2026.
// Requiere que la columna `precio` ya exista en `products` (ver supabase/schema.sql).
//
//   node scripts/update-precios-2026-08.mjs
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = (process.env.VITE_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltan VITE_SUPABASE_URL o las keys en .env");
  process.exit(1);
}

const supabase = createClient(url, key);

// Match directo por código actual (o por código+nombre cuando la foto traía el código en blanco).
const UPDATES = [
  { codigo: "280004", precio: 33.35 }, // Chantilly Fresa 4.4L
  { codigo: "280008", precio: 34.66 }, // Chocolate 4.4L
  { codigo: "280017", precio: 35.88 }, // Cookies & Cream 4.4L
  { codigo: "280018", precio: 34.66 }, // Crema Fantasia 4.4L (código en blanco en la foto)
  { codigo: "280034", precio: 33.35 }, // Fresa 4.4L
  { codigo: "280053", precio: 34.66 }, // Marmoleado 4.4L
  { codigo: "280060", precio: 36.62 }, // Pistacho 4.4L
  { codigo: "280068", precio: 36.39 }, // Tramontana 4.4L
  { codigo: "280134", precio: 31.90 }, // Sirop de Chocolate
  { codigo: "280135", precio: 25.94 }, // Sirop de Fresa
  { codigo: "280447", precio: 6.02 },  // Mantecado Tradicional 700cc
  { codigo: "280448", precio: 6.02 },  // Fresa Tradicional 700cc
  { codigo: "280451", precio: 6.02 },  // Chocolate Tradicional 700cc
  { codigo: "280485", precio: 6.83 },  // Pistacho 700cc
  { codigo: "280483", precio: 6.83 },  // Tramotana 700cc
  { codigo: "280487", precio: 6.83 },  // Ron Pasas 700cc (código en blanco en la foto)
  { codigo: "280464", precio: 7.55 },  // Fantoche Mantecado 700cc
  { codigo: "280463", precio: 7.55 },  // Fantoche Fresa 700cc
  { codigo: "280465", precio: 7.55 },  // Fantoche Chocolate 700cc
];

// Bases soft: el código actual en Supabase no coincide con el de la foto.
// Se confirmó actualizar precio Y corregir el código al de la foto (el más reciente).
const RECODE = [
  { oldCodigo: "280157", newCodigo: "280452", precio: 25.50 }, // Base Vainilla Soft 4kg
  { oldCodigo: "280335", newCodigo: "280455", precio: 24.50 }, // Base Dulce de Leche Soft 4kg
  { oldCodigo: "280158", newCodigo: "280454", precio: 26.33 }, // Base Chocolate Soft 4kg
];

// Productos nuevos que no existían en el catálogo.
const INSERTS = [
  {
    codigo: "280044", producto: "Mantecado 4.4 l", marca: "La Argentina",
    categoria: "Helados Argentina", presentacion: "4.4 L",
    uso: "Hoteles, restaurantes y cafés", precio: 33.35, is_custom: false,
  },
  {
    codigo: "280503", producto: "Cookies and Cream 700 cc", marca: "La Argentina",
    categoria: "Helados Argentina", presentacion: "700 cc",
    uso: "supermercados", precio: 6.83, is_custom: false,
  },
  {
    // Sin código en la foto — se asigna uno provisional (is_custom) hasta tener el SKU real.
    codigo: "CFA-700CC", producto: "Crema Fantasia 700 cc", marca: "La Argentina",
    categoria: "Helados Argentina", presentacion: "700 cc",
    uso: "supermercados", precio: 6.02, is_custom: true,
  },
  {
    codigo: "TRISABOR-2L", producto: "Trisabor 2 L", marca: "La Argentina",
    categoria: "Helados Argentina", presentacion: "2 L",
    uso: "Hoteles, restaurantes y cafés", precio: 11.50, is_custom: true,
  },
];

async function main() {
  console.log(`Actualizando ${UPDATES.length} precios por código existente…`);
  for (const u of UPDATES) {
    const { error, count } = await supabase
      .from("products")
      .update({ precio: u.precio }, { count: "exact" })
      .eq("codigo", u.codigo);
    if (error) console.error(`  ✗ ${u.codigo}: ${error.message}`);
    else if (!count) console.warn(`  ⚠ ${u.codigo}: no se encontró ninguna fila`);
    else console.log(`  ✓ ${u.codigo} → ${u.precio}`);
  }

  console.log(`\nRecodificando ${RECODE.length} bases soft…`);
  for (const r of RECODE) {
    const { error, count } = await supabase
      .from("products")
      .update({ codigo: r.newCodigo, precio: r.precio }, { count: "exact" })
      .eq("codigo", r.oldCodigo);
    if (error) console.error(`  ✗ ${r.oldCodigo}: ${error.message}`);
    else if (!count) console.warn(`  ⚠ ${r.oldCodigo}: no se encontró ninguna fila`);
    else console.log(`  ✓ ${r.oldCodigo} → ${r.newCodigo} (${r.precio})`);
  }

  console.log(`\nCreando ${INSERTS.length} productos nuevos…`);
  const { data, error } = await supabase.from("products").insert(INSERTS).select();
  if (error) console.error(`  ✗ ${error.message}`);
  else console.log(`  ✓ ${data.length} productos creados.`);

  console.log("\nListo.");
}

main();
