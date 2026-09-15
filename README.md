# Catálogo Dipalma — App online (React + Vite + Supabase)

Versión web del catálogo Dipalma con base de datos compartida y almacenamiento de imágenes en la nube. Reemplaza el HTML standalone para uso multi-dispositivo y multi-usuario.

## Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (Postgres + Storage + Auth opcional)
- **Hosting recomendado:** Vercel o Netlify (deploy automático desde GitHub)

## Estructura

```
dipalma-app/
├── index.html
├── package.json
├── vite.config.js
├── .env.example          → copiar a .env
├── supabase/
│   └── schema.sql        → ejecutar UNA vez en Supabase SQL Editor
├── scripts/
│   └── seed.mjs          → npm run seed (carga los 30 productos base)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── data/seed.js      → datos iniciales (Lista Dipal orden comercial)
    ├── lib/
    │   ├── supabase.js   → cliente
    │   ├── api.js        → CRUD productos + upload fotos
    │   ├── image.js      → compresión cliente (1100 px / JPEG 0.78)
    │   └── format.js     → helpers UI
    └── components/
        ├── TopBar.jsx
        ├── Hero.jsx
        ├── FilterBar.jsx
        ├── Cards.jsx
        ├── ProductImage.jsx
        ├── PlaceholderImg.jsx
        ├── DetailModal.jsx
        └── EditModal.jsx
```

## Setup paso a paso

### 1. Clonar e instalar

```bash
git clone <tu-repo>
cd dipalma-app
npm install
```

### 2. Crear proyecto Supabase

1. Entra a https://supabase.com → **New project**.
2. Anota la **URL** y la **anon key** (Settings → API).
3. Anota también la **service_role key** (solo para el seed; no se sube al cliente).

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:

```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 4. Crear el schema en Supabase

En el dashboard de Supabase → **SQL Editor** → **New query** → pega el contenido de `supabase/schema.sql` → **Run**.

Esto crea:
- Tabla `products` con índices
- Bucket público `product-photos` para imágenes
- Políticas RLS (lectura pública, escritura con anon — ver sección "Seguridad")

### 5. Cargar productos iniciales

```bash
npm run seed
```

Sube los 30 productos del catálogo base.

### 6. Desarrollo local

```bash
npm run dev
```

Abre http://localhost:5173.

### 7. Build para producción

```bash
npm run build
```

Genera `dist/` listo para deploy.

## Deploy en Vercel

1. Sube el repo a GitHub.
2. En https://vercel.com → **Import project** → elige el repo.
3. Framework: **Vite** (auto-detectado).
4. Variables de entorno: añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. Deploy.

Cada push a `main` se redeploy a automáticamente.

## Funcionalidades

- ✅ Catálogo compartido entre todos los dispositivos
- ✅ Subir fotos por producto (drag-and-drop o click) — comprimidas y guardadas en Supabase Storage
- ✅ Crear / editar / eliminar productos
- ✅ Marcar como "no disponible" temporalmente
- ✅ Filtrar por marca y categoría
- ✅ Buscar por código, nombre, presentación
- ✅ Compartir producto por WhatsApp
- ✅ Vista grid o lista
- ✅ Panel de **Configuración** (modo Admin) para editar nombre de la empresa y demás textos de marca sin tocar código — ver sección abajo

## Configuración de marca (blanquear para otra empresa)

Todos los textos de marca (nombre de la empresa, eslogan, subtítulo de login, placeholder del buscador, pie de página y firma de WhatsApp) viven en la tabla `app_settings` de Supabase, no en el código. Cualquier usuario con perfil **Admin** puede editarlos desde el botón **⚙️ Configuración** en el encabezado, y el cambio se ve al instante para todos los que usen la app.

Esto es lo que permite reusar esta misma base de código para otra empresa: solo hace falta un proyecto Supabase propio (con su schema y sus productos) y entrar una vez a Configuración para poner el nombre real. Lo que **no** es configurable desde la UI todavía (requiere tocar código):

- El sistema de dos sedes con reglas de IVA distintas (`Dipalma`/`Dipal`, en `src/lib/exportOrderSheet.js` y el modelo de precios `precio`/`precio_dipal`) — pensado específicamente para la operación de Dipalma en Venezuela.
- Las categorías destacadas en el Hero (`src/components/Hero.jsx`), hoy fijas a camarones/helados.
- La contraseña de administrador (`VITE_ADMIN_PASSWORD`, variable de entorno — requiere redeploy para cambiarla).

## Seguridad

El schema actual permite escritura con la **anon key** para simplicidad. Para uso real:

1. Habilita **Supabase Auth** (email/password o magic link).
2. En `schema.sql`, cambia las policies de escritura a:
   ```sql
   create policy "products write authed"
     on public.products for all
     using (auth.role() = 'authenticated')
     with check (auth.role() = 'authenticated');
   ```
3. Añade un `<LoginGate>` en `App.jsx` que llame a `supabase.auth.signInWithPassword`.

## Comprimir más / menos las fotos

Edita `src/lib/image.js`:

```js
compressImage(file, { maxDim: 1100, quality: 0.78 })
//                       ↑ tamaño    ↑ calidad 0–1
```

| Modo | maxDim | quality | Tamaño aprox |
|---|---|---|---|
| Ahorro | 800 | 0.65 | 60–120 KB |
| Balance (actual) | 1100 | 0.78 | 150–250 KB |
| Calidad alta | 1400 | 0.85 | 350–500 KB |

## Migrar fotos del HTML standalone

Si ya tienes fotos guardadas en el catálogo HTML local (IndexedDB), abre la consola del navegador en ese archivo y exporta:

```js
// En la consola del HTML standalone
const dump = {};
const tx = db.transaction("photos").objectStore("photos");
tx.getAll().onsuccess = (e) => {
  e.target.result.forEach(r => dump[r.codigo] = r.dataUrl);
  console.log(JSON.stringify(dump));
};
```

Después un script de migración puede subir cada dataUrl a Supabase Storage. Si quieres, te lo genero cuando llegues a ese paso.

## Troubleshooting

- **"Faltan VITE_SUPABASE_URL"** → revisa `.env`, reinicia `npm run dev`.
- **Error 401 al subir foto** → revisa que las policies de Storage en `schema.sql` corrieron.
- **CORS error** → en Supabase, Settings → API → CORS, añade tu dominio de Vercel.

---

Generado a partir del prototipo HTML `Catalogo Dipalma.html`.
