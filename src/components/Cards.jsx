import { ProductImage } from "./ProductImage.jsx";
import {
  normMarca, prettyTitle, tagClass, categoryTone, toneBar,
  formatPrice, formatPriceVES, priceForSede, camaronTiers, cheapestKg,
  CAMARON_TIERS, CAMARON_UNITS,
} from "../lib/format.js";

const TIER_LABEL_SHORT = { 1: "Precio 1", 2: "Precio 2", 3: "Precio 3" };

/** Selectores de nivel/unidad para camarón, visibles al elegir el producto para exportar. */
function CamaronChoiceInline({ tiers, choice, onChange }) {
  if (!choice) return null;
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 6, marginTop: 6 }}>
      <select
        value={choice.tier}
        onChange={(e) => onChange({ tier: e.target.value })}
        style={{ fontSize: 11, padding: "2px 4px", flex: 1 }}
      >
        {CAMARON_TIERS.filter((t) => tiers[t]).map((t) => (
          <option key={t} value={t}>{TIER_LABEL_SHORT[t]}</option>
        ))}
      </select>
      <select
        value={choice.unit}
        onChange={(e) => onChange({ unit: e.target.value })}
        style={{ fontSize: 11, padding: "2px 4px", flex: 1 }}
      >
        {CAMARON_UNITS.map((u) => (
          <option key={u.key} value={u.key}>{u.label}</option>
        ))}
      </select>
    </div>
  );
}

function PriceLine({ usd, bcvRate }) {
  const usdLabel = formatPrice(usd);
  if (!usdLabel) return null;
  const vesLabel = formatPriceVES(usd, bcvRate);
  return <>{usdLabel}{vesLabel && <span style={{ opacity: 0.65, fontWeight: 400 }}> · {vesLabel}</span>}</>;
}

/** Ficha simple: precio fijo, o "Desde US$X/Kg" si el producto tiene tabla de camarón por volumen. */
function PriceOrTiers({ p, sede, bcvRate }) {
  const usd = priceForSede(p, sede);
  if (formatPrice(usd) !== null) return <PriceLine usd={usd} bcvRate={bcvRate} />;
  const tiers = camaronTiers(p, sede);
  const kg = cheapestKg(tiers);
  if (kg === null) return null;
  return (
    <>
      Desde <PriceLine usd={kg} bcvRate={bcvRate} />/Kg
      <span style={{ opacity: 0.6, fontWeight: 400 }}> · según volumen</span>
    </>
  );
}

/** Precio a mostrar: admin ve las dos sedes (si el producto se vende ahí); ventas solo la suya. Incluye Bs. si hay tasa BCV. */
function PriceBlock({ p, sede, isAdmin, bcvRate, className }) {
  if (!isAdmin) {
    const hasSimple = formatPrice(priceForSede(p, sede)) !== null;
    const hasTiers = cheapestKg(camaronTiers(p, sede)) !== null;
    if (!hasSimple && !hasTiers) return null;
    return <div className={className}><PriceOrTiers p={p} sede={sede} bcvRate={bcvRate} /></div>;
  }
  const rows = (p.sedes || [])
    .filter((s) => s === "Dipalma" || s === "Dipal")
    .filter((s) => formatPrice(priceForSede(p, s)) !== null || cheapestKg(camaronTiers(p, s)) !== null)
    .map((s) => ({ sede: s }));
  if (!rows.length) return null;
  return (
    <div className={className}>
      {rows.map((r) => (
        <div key={r.sede} style={{ fontSize: "0.82em" }}>{r.sede}: <PriceOrTiers p={p} sede={r.sede} bcvRate={bcvRate} /></div>
      ))}
    </div>
  );
}

function AvailabilityBadge({ unavailable, compact = false }) {
  if (!unavailable) return null;
  return (
    <span className={"avail-badge" + (compact ? " compact" : "")}>
      <span className="avail-dot" />
      No disponible
    </span>
  );
}

function PickCheckbox({ picked, onToggle }) {
  return (
    <label
      className="pick-checkbox"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", top: 8, left: 8, zIndex: 2,
        width: 24, height: 24, borderRadius: 6,
        background: picked ? "var(--mar-700, #1252a8)" : "rgba(255,255,255,0.9)",
        border: "1.5px solid " + (picked ? "var(--mar-700, #1252a8)" : "rgba(0,0,0,0.2)"),
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
      }}
    >
      <input type="checkbox" checked={picked} onChange={onToggle} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      {picked && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </label>
  );
}

export function GridCard({
  p, variant, sede, isAdmin, bcvRate, onOpen, onPhotoUpdated,
  pickMode, picked, onTogglePick, camaronChoice, onSetCamaronChoice,
}) {
  const handleClick = () => {
    if (pickMode) onTogglePick(p.codigo, p);
    else onOpen(p);
  };
  const tiers = camaronTiers(p, sede);
  if (variant === "ficha") {
    return (
      <article className="card ficha" onClick={handleClick} style={{ position: "relative" }}>
        {pickMode && <PickCheckbox picked={picked} onToggle={() => onTogglePick(p.codigo, p)} />}
        <AvailabilityBadge unavailable={p.unavailable} compact />
        <div className="card-img" style={{ background: toneBar(categoryTone(p.categoria)) }} />
        <div className="card-body">
          <div className="card-marca">{normMarca(p.marca)}</div>
          <h3 className="card-title">{prettyTitle(p.producto)}</h3>
          <dl style={{ margin: "8px 0 0", padding: 0 }}>
            <div className="card-row"><dt>Código</dt><dd className="mono">{p.codigo}</dd></div>
            <div className="card-row"><dt>Presentación</dt><dd>{p.presentacion}</dd></div>
            <div className="card-row"><dt>Categoría</dt><dd><span className={tagClass(p.categoria)}>{p.categoria}</span></dd></div>
            <PriceBlock p={p} sede={sede} isAdmin={isAdmin} bcvRate={bcvRate} className="card-row" />
          </dl>
        </div>
      </article>
    );
  }
  return (
    <article className="card" onClick={handleClick} style={{ position: "relative" }}>
      {pickMode && <PickCheckbox picked={picked} onToggle={() => onTogglePick(p.codigo, p)} />}
      <AvailabilityBadge unavailable={p.unavailable} />
      <div className="card-img">
        <ProductImage producto={p} editable={false} />
      </div>
      <div className="card-body">
        <div className="card-marca">{normMarca(p.marca)}</div>
        <h3 className="card-title">{prettyTitle(p.producto)}</h3>
        <div className="card-meta">
          <span className="card-presentacion">{p.presentacion}</span>
          <span className="card-codigo">{p.codigo}</span>
        </div>
        <PriceBlock p={p} sede={sede} isAdmin={isAdmin} bcvRate={bcvRate} className="card-price" />
        {pickMode && picked && tiers && (
          <CamaronChoiceInline
            tiers={tiers}
            choice={camaronChoice}
            onChange={(patch) => onSetCamaronChoice(p.codigo, patch)}
          />
        )}
        {p.sector?.length > 0 && (
          <div className="card-sectors">
            {p.sector.map((s) => <span key={s} className={"sector-pill sector-" + s.toLowerCase()}>{s}</span>)}
          </div>
        )}
      </div>
    </article>
  );
}

export function ListView({
  products, sede, isAdmin, bcvRate, onOpen,
  pickMode, selected, onTogglePick, camaronChoice, onSetCamaronChoice,
}) {
  return (
    <div className="tablewrap">
      <table className="list">
        <thead>
          <tr>
            {pickMode && <th></th>}
            <th>#</th>
            <th>Código</th>
            <th>Producto</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Presentación</th>
            <th>Precio</th>
            <th>Uso comercial sugerido</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const tiers = camaronTiers(p, sede);
            return (
            <tr
              key={p.codigo}
              className={p.unavailable ? "row-unavail" : ""}
              onClick={() => (pickMode ? onTogglePick(p.codigo, p) : onOpen(p))}
            >
              {pickMode && (
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(p.codigo)} onChange={() => onTogglePick(p.codigo, p)} />
                  {selected.has(p.codigo) && tiers && (
                    <CamaronChoiceInline
                      tiers={tiers}
                      choice={camaronChoice?.[p.codigo]}
                      onChange={(patch) => onSetCamaronChoice(p.codigo, patch)}
                    />
                  )}
                </td>
              )}
              <td className="num">{i + 1}</td>
              <td className="mono">{p.codigo}</td>
              <td className="producto">{prettyTitle(p.producto)}</td>
              <td>{normMarca(p.marca)}</td>
              <td><span className={tagClass(p.categoria)}>{p.categoria}</span></td>
              <td className="mono">{p.presentacion}</td>
              <td className="mono">
                {isAdmin ? (
                  ["Dipalma", "Dipal"].filter((s) => p.sedes?.includes(s) && (formatPrice(priceForSede(p, s)) !== null || cheapestKg(camaronTiers(p, s)) !== null)).length ? (
                    ["Dipalma", "Dipal"]
                      .filter((s) => p.sedes?.includes(s) && (formatPrice(priceForSede(p, s)) !== null || cheapestKg(camaronTiers(p, s)) !== null))
                      .map((s) => (
                        <div key={s} style={{ fontSize: "0.85em" }}>{s}: <PriceOrTiers p={p} sede={s} bcvRate={bcvRate} /></div>
                      ))
                  ) : "—"
                ) : (
                  (formatPrice(priceForSede(p, sede)) !== null || cheapestKg(camaronTiers(p, sede)) !== null)
                    ? <PriceOrTiers p={p} sede={sede} bcvRate={bcvRate} />
                    : "—"
                )}
              </td>
              <td className="uso">{p.uso}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
