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
