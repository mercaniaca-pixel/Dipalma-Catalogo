import { MARCAS, CATEGORIAS } from "../data/seed.js";
import { normMarca } from "../lib/format.js";

export function FilterBar({ products, marca, setMarca, categoria, setCategoria }) {
  const marcaCount = (m) => products.filter((p) => normMarca(p.marca) === m).length;
  const catCount = (c) => products.filter((p) => p.categoria === c).length;

  return (
    <div className="filterbar">
      <div className="filterbar-inner">
        <span className="filter-label">Marca</span>
        <button className={"chip" + (marca === null ? " active" : "")} onClick={() => setMarca(null)}>
          Todas <span className="chip-count">{products.length}</span>
        </button>
        {MARCAS.map((m) => (
          <button key={m} className={"chip" + (marca === m ? " active" : "")} onClick={() => setMarca(m)}>
            {m} <span className="chip-count">{marcaCount(m)}</span>
          </button>
        ))}
        <div className="filter-divider" />
        <span className="filter-label">Categoría</span>
        <button className={"chip" + (categoria === null ? " active" : "")} onClick={() => setCategoria(null)}>
          Todas
        </button>
        {CATEGORIAS.map((c) => (
          <button key={c} className={"chip" + (categoria === c ? " active" : "")} onClick={() => setCategoria(c)}>
            {c} <span className="chip-count">{catCount(c)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
