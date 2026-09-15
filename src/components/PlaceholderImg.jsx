import { categoryTone, categoryLabel } from "../lib/format.js";

export function PlaceholderImg({ cat, codigo }) {
  const tone = categoryTone(cat);
  const label = categoryLabel(cat);
  return (
    <div className="ph-img" data-tone={tone}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <CategoryGlyph tone={tone} />
        <span className="ph-label">{label} · {codigo}</span>
      </div>
    </div>
  );
}

function CategoryGlyph({ tone }) {
  const stroke = { mar: "#0b3a5b", cremas: "#9c4a2a", bases: "#14463d", comp: "#6c5a3c" }[tone];
  if (tone === "mar") {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="14" stroke={stroke} strokeWidth="1.5" fill="none" />
        <circle cx="22" cy="22" r="6" stroke={stroke} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  if (tone === "cremas") {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect x="8" y="8" width="28" height="28" transform="rotate(45 22 22)" stroke={stroke} strokeWidth="1.5" fill="none" />
        <circle cx="22" cy="22" r="4" fill={stroke} opacity="0.6" />
      </svg>
    );
  }
  if (tone === "bases") {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect x="10" y="10" width="24" height="24" stroke={stroke} strokeWidth="1.5" fill="none" />
        <rect x="16" y="16" width="12" height="12" stroke={stroke} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="14" r="3" fill={stroke} />
      <circle cx="14" cy="26" r="3" fill={stroke} />
      <circle cx="30" cy="26" r="3" fill={stroke} />
    </svg>
  );
}
