// Tasa oficial BCV vía DolarApi (replica la tasa publicada por el Banco Central de
// Venezuela sin depender de scrapear su HTML, que cambia de estructura seguido).
const BCV_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";
const CACHE_KEY = "dipalma_bcv_rate_cache";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

/**
 * Devuelve { rate, date, isFresh } con la tasa oficial BCV (Bs. por US$).
 * Se cachea una vez al día en localStorage; si la API falla se reutiliza la
 * última tasa guardada (isFresh: false) para no romper la descarga del PDF.
 * @param {boolean} [force] - ignora la caché del día y fuerza una consulta nueva.
 */
export async function getBcvRate(force = false) {
  const cached = readCache();
  if (!force && cached && cached.fetchedOn === todayStr()) {
    return { rate: cached.rate, date: cached.date, isFresh: true };
  }

  try {
    const res = await fetch(BCV_API_URL);
    if (!res.ok) throw new Error("Respuesta no válida de la API de tasa (" + res.status + ")");
    const data = await res.json();
    const rate = Number(data?.promedio ?? data?.precio ?? data?.venta);
    if (!rate || Number.isNaN(rate)) throw new Error("La API no devolvió una tasa válida");
    const entry = {
      rate,
      date: data?.fechaActualizacion || new Date().toISOString(),
      fetchedOn: todayStr(),
    };
    writeCache(entry);
    return { rate: entry.rate, date: entry.date, isFresh: true };
  } catch (e) {
    if (cached) {
      return { rate: cached.rate, date: cached.date, isFresh: false };
    }
    throw new Error(
      "No se pudo obtener la tasa BCV y no hay ninguna tasa guardada previamente. " + (e.message || e)
    );
  }
}
