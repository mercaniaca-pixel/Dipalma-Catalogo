const TONES = ["mar", "cremas", "bases", "comp"];

/** Si el admin no configuró tarjetas propias, se generan solas a partir de
 * las categorías más frecuentes en el catálogo actual — así una empresa
 * nueva ve algo útil desde el día uno sin tener que tocar código. */
function autoCategories(products) {
  const counts = new Map();
  for (const p of products) {
    if (!p.categoria) continue;
    counts.set(p.categoria, (counts.get(p.categoria) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([categoria]) => ({ name: categoria, match: [categoria] }));
}

export function Hero({ products, settings, onPickCat }) {
  const cats = settings?.hero_categories?.length ? settings.hero_categories : autoCategories(products);
  const countFor = (matches) => products.filter((p) => (matches || []).includes(p.categoria)).length;
  const marcasCount = new Set(products.map((p) => p.marca).filter(Boolean)).size;
  const categoriasCount = new Set(products.map((p) => p.categoria).filter(Boolean)).size;
  const title = settings?.hero_title || "Portafolio Comercial";

  return (
    <section className="hero" data-screen-label="Hero">
      <div className="hero-inner">
        <div>
          <h1 style={{ marginTop: 0 }}>{title}</h1>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">{products.length}</div>
              <div className="hero-stat-label">Productos activos</div>
            </div>
            <div>
              <div className="hero-stat-num">{marcasCount}</div>
              <div className="hero-stat-label">Marcas representadas</div>
            </div>
            <div>
              <div className="hero-stat-num">{categoriasCount}</div>
              <div className="hero-stat-label">Categorías comerciales</div>
            </div>
          </div>
        </div>

        <div className="hero-cats">
          {cats.map((c, i) => (
            <button key={c.name} className="hero-cat" data-tone={TONES[i % TONES.length]} onClick={() => onPickCat((c.match && c.match[0]) || c.name)}>
              <span className="hero-cat-count">{countFor(c.match)} productos</span>
              <span className="hero-cat-name">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
