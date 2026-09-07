import type { City } from "./types";
import enUS from "../public/locales/en-US.json";

const CITY_KEYS = new Set([
  "adama", "addisababa", "adigrat", "adwa", "agaro", "alabakulito", "alamata",
  "alemaya", "aletawendo", "albereketie", "amanuel", "ambo", "arbaminch", "areka",
  "arsinegele", "arsienegele", "asella", "asebechiro", "asosa", "axum", "asebote",
  "asendabo", "ataye", "awashtabiaya", "ayera", "babilea", "bahirbar", "balerobe",
  "balegoba", "bako", "bedele", "bishoftu", "boditi", "bonga", "bulehora", "burre",
  "burayu", "butajira", "bichena", "chagni", "chelenko", "chiro", "dangila",
  "deberesina", "debrebirhan", "debremarkos", "debretabor", "degehabur", "deneba",
  "dengego", "dembidolo", "denane", "dessie", "dejene", "dilla", "diredawa",
  "durame", "fiche", "finoteselam", "gambela", "gedo", "gelegelegibea", "gimbi",
  "ginda_woyen", "gibewoneze", "goba", "gode", "gojebe", "gondar", "harar",
  "hawassa", "hawassa2", "hawassa_gebriel", "hayqe", "hirena", "hosaena", "jijiga",
  "jigjiga", "jimma", "jinka", "kebriedehar", "keki", "kemise", "kobo", "kombolcha",
  "kosso_ber", "kulebie", "kulibi_16", "kulibi_17", "kulibi_18", "kumbie",
  "measo", "mekelle", "metehara", "metu", "mizanteferi", "mizanaman", "modjo",
  "mota", "moyale", "natrie", "negeleborana", "nejo", "nekemte", "saja", "sawla",
  "sebeta", "sekoru", "senebtie", "serbo", "shashamane", "shebea", "shewarobit",
  "shireindaselassie", "sodo", "surupa", "tepi", "tilili", "wolaitadimtu",
  "woldiya", "wolenchitie", "woliso", "wolkite", "woreta", "wukro", "yabelo",
  "yirgalem", "zewaye", "ziway", "abeltie", "wodjle",
]);

const labels = enUS as Record<string, string>;

export function cityKey(value?: string | null) {
  return (value || "").toLowerCase().replace(/[\s_-]+/g, "");
}

export function citySearchName(value?: string | null) {
  const raw = (value || "").trim();
  if (!raw) return "";
  const key = cityKey(raw);
  const label = labels[key];
  if (label) return label.toLowerCase();
  return raw.toLowerCase();
}

export function normalizeCity(city: City): City {
  const key = cityKey(city.name) || cityKey(city.sys);
  const label = labels[key];
  if (label) return { name: key, sys: label };
  return {
    name: key || city.name,
    sys: city.sys || city.name,
  };
}

export function cityApiName(city: City) {
  return citySearchName(city.sys) || citySearchName(city.name);
}

export const FALLBACK_CITIES: City[] = [...CITY_KEYS]
  .map((name) => normalizeCity({
    name,
    sys: labels[name] || name.replaceAll("_", " "),
  }))
  .sort((a, b) => a.sys.localeCompare(b.sys));

function asCity(value: unknown): City | null {
  if (typeof value === "string" && value.trim()) {
    const sys = value.trim();
    return normalizeCity({ name: cityKey(sys), sys });
  }
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    const sys = String(row.sys || row.name || row.city || row.cityName || "").trim();
    if (!sys) return null;
    const key = cityKey(String(row.key || row.slug || sys));
    return normalizeCity({ name: key, sys });
  }
  return null;
}

export function citiesFromApi(payload: unknown): City[] {
  if (!payload) return [];
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : Array.isArray((payload as { cities?: unknown }).cities)
        ? (payload as { cities: unknown[] }).cities
        : [];
  return list.map(asCity).filter(Boolean) as City[];
}

export function mergeCities(...groups: City[][]) {
  const byKey = new Map<string, City>();
  groups.flat().forEach((city) => {
    const next = normalizeCity(city);
    const key = cityKey(next.sys) || cityKey(next.name);
    if (!key) return;
    const current = byKey.get(key);
    if (!current || (next.sys.includes(" ") && !current.sys.includes(" "))) {
      byKey.set(key, next);
    }
  });
  return [...byKey.values()].sort((a, b) => a.sys.localeCompare(b.sys));
}
