export function Hero({ products, onPickCat }) {
  const cats = [
    { id: "Camarones congelados", name: "Camarones & frutos del mar", tone: "mar" },
    { id: "Helados Argentina", name: "Helados La Argentina", tone: "cremas" },
    { id: "Bases / soft heladería", name: "Bases soft", tone: "bases" },
    { id: "Complementos de heladería", name: "Complementos & sirops", tone: "comp" },
  ];
  const catCount = (id) => products.filter((p) => p.categoria === id).length;
  const seafoodCount = catCount("Camarones congelados") + catCount("Otros productos del mar");
  const countFor = (id) => id === "Camarones congelados" ? seafoodCount : catCount(id);

  return (
    <section className="hero" data-screen-label="Hero">
      <div className="hero-inner">
        <div>
          <h1 style={{ marginTop: 0 }}>Portafolio <em>Comercial</em></h1>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">{products.length}</div>
              <div className="hero-stat-label">Productos activos</div>
            </div>
            <div>
              <div className="hero-stat-num">5</div>
              <div className="hero-stat-label">Marcas representadas</div>
            </div>
            <div>
              <div className="hero-stat-num">5</div>
              <div className="hero-stat-label">Categorías comerciales</div>
            </div>
          </div>
        </div>

        <div className="hero-cats">
          {cats.map((c) => (
            <button key={c.id} className="hero-cat" data-tone={c.tone} onClick={() => onPickCat(c.id)}>
              <span className="hero-cat-count">{countFor(c.id)} productos</span>
              <span className="hero-cat-name">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
