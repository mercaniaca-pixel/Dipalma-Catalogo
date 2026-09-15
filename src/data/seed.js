// Datos iniciales del catálogo Dipalma — origen: Lista_productos_Dipal_orden_comercial.
// Se usa solo para el seed inicial de Supabase (scripts/seed.mjs).
export const SEED_PRODUCTS = [
  { sort_n: 1,  codigo: "CPD-3135",     producto: "CAMARON PELADO Y DES/V TALLA 31/35", marca: "Distribuidora Lago", categoria: "Camarones congelados",     presentacion: "TALLA 31/35", uso: "Restaurantes, hoteles y cocinas con consumo recurrente" },
  { sort_n: 2,  codigo: "CPD-4150",     producto: "CAMARON PELADO Y DES/V TALLA 41/50", marca: "Castell",            categoria: "Camarones congelados",     presentacion: "TALLA 41/50", uso: "Restaurantes, hoteles y cocinas con consumo recurrente" },
  { sort_n: 3,  codigo: "CPD-5160",     producto: "CAMARON PELADO Y DES/V TALLA 51/60", marca: "Castell",            categoria: "Camarones congelados",     presentacion: "TALLA 51/60", uso: "Restaurantes, hoteles y cocinas con consumo recurrente" },
  { sort_n: 4,  codigo: "CPD-M-400",    producto: "CAMARON TALLA M 400 GR",              marca: "Agrolago",           categoria: "Camarones congelados",     presentacion: "400 gr",      uso: "Restaurantes, hoteles y cocinas con consumo recurrente" },
  { sort_n: 5,  codigo: "CPUD-5160",    producto: "CAMARON PUD TALLA 51/60 CASTELL",     marca: "Castell",            categoria: "Camarones congelados",     presentacion: "TALLA 51/60", uso: "Restaurantes, hoteles y cocinas con consumo recurrente" },
  { sort_n: 7,  codigo: "OCT-L-10-T6",  producto: "PULPO BULTO 10 KG TALLA T6",          marca: "Castell",            categoria: "Otros productos del mar",  presentacion: "10 Kg",       uso: "Restaurantes y hoteles con menú de mar" },
  { sort_n: 8,  codigo: "280004",       producto: "Chantilly Fresa 4.4 l",               marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "4.4 L",       uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 9,  codigo: "280008",       producto: "Chocolate 4.4 l",                     marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "4.4 L",       uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 10, codigo: "280017",       producto: "Cookies & Cream 4.4 l",               marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "4.4 L",       uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 11, codigo: "280018",       producto: "Crema Fantasia 4.4 l",                marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "4.4 L",       uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 12, codigo: "280034",       producto: "Fresa 4.4 l",                         marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "4.4 L",       uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 13, codigo: "280053",       producto: "Marmoleado 4.4 l",                    marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "4.4 L",       uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 14, codigo: "280060",       producto: "Pistacho 4.4 l",                      marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "4.4 L",       uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 15, codigo: "280068",       producto: "Tramontana 4.4 l",                    marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "4.4 L",       uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 16, codigo: "280447",       producto: "Mantecado Tradicional 700 cc",        marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700 cc",      uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 17, codigo: "280448",       producto: "Fresa Tradicional 700 cc",            marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700 cc",      uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 18, codigo: "280451",       producto: "Chocolate Tradicional 700 cc",        marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700 cc",      uso: "Hoteles, restaurantes y cafés" },
  { sort_n: 20, codigo: "280463",       producto: "Fantoche Fresa 700 cc",               marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700 cc",      uso: "supermercados" },
  { sort_n: 21, codigo: "280464",       producto: "Fantoche Mantecado 700 cc",           marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700 cc",      uso: "supermercados" },
  { sort_n: 22, codigo: "280465",       producto: "Fantoche Chocolate 700 cc",           marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700 cc",      uso: "supermercados" },
  { sort_n: 23, codigo: "280483",       producto: "Tramotana 700cc",                     marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700cc",       uso: "supermercados" },
  { sort_n: 24, codigo: "280485",       producto: "Pistacho 700cc",                      marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700cc",       uso: "supermercados" },
  { sort_n: 25, codigo: "280487",       producto: "Ron Pasas 700cc",                     marca: "La Argentina",       categoria: "Helados Argentina",        presentacion: "700cc",       uso: "supermercados" },
  { sort_n: 26, codigo: "20000096",     producto: "CHOCOLATE SOFT 4 KG",                 marca: "Masal",              categoria: "Bases / soft heladería",   presentacion: "4 Kg",        uso: "Clientes con máquina soft, heladería o postres" },
  { sort_n: 27, codigo: "280157",       producto: "Base Vainilla Soft 4 kg",             marca: "La Argentina",       categoria: "Bases / soft heladería",   presentacion: "4 Kg",        uso: "Clientes con máquina soft, heladería o postres" },
  { sort_n: 28, codigo: "280158",       producto: "Base Chocolate Soft 4 kg",            marca: "La Argentina",       categoria: "Bases / soft heladería",   presentacion: "4 Kg",        uso: "Clientes con máquina soft, heladería o postres" },
  { sort_n: 29, codigo: "280335",       producto: "Base Dulce de Leche Soft 4 kg",       marca: "La Argentina",       categoria: "Bases / soft heladería",   presentacion: "4 Kg",        uso: "Clientes con máquina soft, heladería o postres" },
  { sort_n: 30, codigo: "280134",       producto: "Sirop de Chocolate 4.5 kg",           marca: "La Argentina",       categoria: "Complementos de heladería",presentacion: "4.5 Kg",      uso: "Heladería, postres, cafés y venta cruzada con helados" },
  { sort_n: 31, codigo: "280135",       producto: "Sirop de Fresa 4.5 kg",               marca: "La Argentina",       categoria: "Complementos de heladería",presentacion: "4.5 Kg",      uso: "Heladería, postres, cafés y venta cruzada con helados" },
];

export const MARCAS = ["La Argentina", "Castell", "Agrolago"];
export const CATEGORIAS = [
  "Camarones congelados",
  "Otros productos del mar",
  "Helados Argentina",
  "Bases / soft heladería",
  "Complementos de heladería",
];
