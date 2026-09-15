-- ============================================================
-- Catálogo Dipalma — Supabase schema
-- Ejecutar en SQL Editor de Supabase (una sola vez).
-- ============================================================

-- Tabla principal
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  codigo       text unique not null,
  producto     text not null,
  marca        text not null,
  categoria    text not null,
  presentacion text,
  uso          text,
  -- imagen: ruta dentro del bucket "product-photos" (NO la URL completa)
  photo_path   text,
  -- precio de venta (opcional)
  precio       numeric(10,2),
  -- estado
  unavailable  boolean not null default false,
  -- meta
  is_custom    boolean not null default false,
  sort_n       int,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_marca_idx on public.products (marca);
create index if not exists products_categoria_idx on public.products (categoria);
create index if not exists products_codigo_idx on public.products (codigo);

-- Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- Storage: bucket público "product-photos"
-- Crearlo desde Storage UI o con esta llamada:
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security
-- Modo simple: lectura pública, escritura solo con anon key.
-- Para producción real, conectar a Supabase Auth y restringir.
-- ============================================================
alter table public.products enable row level security;

drop policy if exists "products read all" on public.products;
create policy "products read all"
  on public.products for select
  using (true);

drop policy if exists "products write anon" on public.products;
create policy "products write anon"
  on public.products for all
  using (true)
  with check (true);

-- Storage: lectura pública, upload con anon
drop policy if exists "photos read all" on storage.objects;
create policy "photos read all"
  on storage.objects for select
  using (bucket_id = 'product-photos');

drop policy if exists "photos write anon" on storage.objects;
create policy "photos write anon"
  on storage.objects for all
  using (bucket_id = 'product-photos')
  with check (bucket_id = 'product-photos');

-- ============================================================
-- Multi-sede (Dipalma / Dipal)
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Un mismo producto puede vender en una o ambas sedes; cada sede
-- tiene su propio precio. "precio" = precio en Dipalma (ya existía);
-- "precio_dipal" = precio en Dipal (nuevo).
-- ============================================================
alter table public.products
  add column if not exists sedes text[] not null default array['Dipalma'],
  add column if not exists precio_dipal numeric(10,2);

comment on column public.products.precio is 'Precio de venta en la sede Dipalma (US$).';
comment on column public.products.precio_dipal is 'Precio de venta en la sede Dipal (US$).';
comment on column public.products.sedes is 'Sedes donde se vende: contiene "Dipalma", "Dipal", o ambas.';

create index if not exists products_sedes_idx on public.products using gin (sedes);

-- ============================================================
-- Precios por volumen para camarón (Bulto/Estuche/Kg × Precio 1/2/3)
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Estructura: { "Dipalma": { "1": {bulto,estuche,kg}, "2": {...}, "3": {...} }, "Dipal": {...} }
-- ============================================================
alter table public.products
  add column if not exists precio_camaron jsonb;

comment on column public.products.precio_camaron is 'Precios por volumen (solo camarón): { "<Sede>": { "1|2|3": { bulto, estuche, kg } } }.';

-- ============================================================
-- Configuración de marca (nombre de empresa y textos de la app)
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Fila única (id = 1) editable desde el panel "Configuración" en modo Admin.
-- Permite reutilizar esta misma app para otra empresa sin tocar código.
-- ============================================================
create table if not exists public.app_settings (
  id                 int primary key default 1,
  company_name       text not null default 'Dipalma',
  tagline            text not null default 'Portafolio Comercial',
  login_subtitle     text not null default 'Portafolio Comercial',
  search_placeholder text not null default 'Buscar por nombre, código o presentación…',
  footer_text        text,
  pdf_footer_text    text not null default 'Portafolio Comercial',
  whatsapp_signature text not null default 'Catálogo Dipalma',
  updated_at         timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "settings read all" on public.app_settings;
create policy "settings read all"
  on public.app_settings for select
  using (true);

drop policy if exists "settings write anon" on public.app_settings;
create policy "settings write anon"
  on public.app_settings for all
  using (true)
  with check (true);

-- ============================================================
-- Sedes configurables (reemplaza el "Dipalma"/"Dipal" fijo en código)
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Un admin puede agregar, renombrar o eliminar sedes desde el panel
-- "Sedes" de la app. Cada sede genera automáticamente dos perfiles de
-- acceso (Ventas / Admin) en la pantalla de login.
-- ============================================================
create table if not exists public.sedes (
  key         text primary key,
  label       text not null,
  rif         text,
  applies_iva boolean not null default false,
  sort_n      int,
  created_at  timestamptz not null default now()
);

insert into public.sedes (key, label, rif, applies_iva, sort_n) values
  ('Dipalma', 'Dipalma', 'J-500755406', false, 1),
  ('Dipal',   'Dipal',   'J-505792440', true,  2)
on conflict (key) do nothing;

alter table public.sedes enable row level security;

drop policy if exists "sedes read all" on public.sedes;
create policy "sedes read all" on public.sedes for select using (true);

drop policy if exists "sedes write anon" on public.sedes;
create policy "sedes write anon" on public.sedes for all using (true) with check (true);

-- ============================================================
-- Precio genérico por sede (reemplaza precio/precio_dipal de a poco)
-- Ejecutar una sola vez. No borra las columnas viejas — el código las
-- sigue leyendo como respaldo mientras se termina de migrar.
-- ============================================================
alter table public.products add column if not exists precios jsonb;

update public.products
set precios = coalesce(precios, '{}'::jsonb)
  || (case when precio is not null then jsonb_build_object('Dipalma', precio) else '{}'::jsonb end)
  || (case when precio_dipal is not null then jsonb_build_object('Dipal', precio_dipal) else '{}'::jsonb end)
where precios is null and (precio is not null or precio_dipal is not null);

comment on column public.products.precios is 'Precio de venta por sede: { "<sedeKey>": number }. Reemplaza a precio/precio_dipal.';

-- ============================================================
-- Configuración avanzada: contraseña de admin editable desde la app
-- (reemplaza a la variable de entorno VITE_ADMIN_PASSWORD, que exigía
-- redeploy) y tarjetas del Hero configurables por categoría.
-- Ejecutar una sola vez.
-- ============================================================
alter table public.app_settings add column if not exists admin_password text;
alter table public.app_settings add column if not exists hero_title text;
alter table public.app_settings add column if not exists hero_categories jsonb;

comment on column public.app_settings.admin_password is 'Clave de administrador compartida por todas las sedes. Si está vacía, la app usa VITE_ADMIN_PASSWORD o "dipalma2026".';
comment on column public.app_settings.hero_categories is 'Tarjetas de categoría destacadas en el Hero: [{ "name": "...", "match": ["categoria1","categoria2"] }]. Si es null, se generan automáticamente desde los productos.';

-- Conserva las 4 tarjetas de portada que Dipalma ya tenía (antes hardcodeadas
-- en Hero.jsx), para que el cambio a "configurable" no altere lo que ve hoy.
-- No pisa nada si ya se personalizó.
update public.app_settings
set hero_categories = '[
  {"name":"Camarones & frutos del mar","match":["Camarones congelados","Otros productos del mar"]},
  {"name":"Helados La Argentina","match":["Helados Argentina"]},
  {"name":"Bases soft","match":["Bases / soft heladería"]},
  {"name":"Complementos & sirops","match":["Complementos de heladería"]}
]'::jsonb
where id = 1 and hero_categories is null;
