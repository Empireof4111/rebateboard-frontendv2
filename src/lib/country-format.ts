const COUNTRY_CODES: Record<string, string> = {
  "antigua and barbuda": "AG",
  argentina: "AR",
  australia: "AU",
  austria: "AT",
  bahamas: "BS",
  "the bahamas": "BS",
  barbados: "BB",
  belarus: "BY",
  belgium: "BE",
  belize: "BZ",
  brazil: "BR",
  "british virgin islands": "VG",
  canada: "CA",
  cayman: "KY",
  "cayman islands": "KY",
  china: "CN",
  cuba: "CU",
  cyprus: "CY",
  czechia: "CZ",
  "czech republic": "CZ",
  dominica: "DM",
  dubai: "AE",
  england: "GB",
  estonia: "EE",
  france: "FR",
  germany: "DE",
  grenada: "GD",
  "hong kong": "HK",
  hongkong: "HK",
  india: "IN",
  iran: "IR",
  "islamic republic of iran": "IR",
  ireland: "IE",
  italy: "IT",
  japan: "JP",
  "north korea": "KP",
  "democratic people's republic of korea": "KP",
  latvia: "LV",
  lithuania: "LT",
  malaysia: "MY",
  malta: "MT",
  mauritius: "MU",
  mexico: "MX",
  netherlands: "NL",
  nigeria: "NG",
  poland: "PL",
  portugal: "PT",
  russia: "RU",
  "saint kitts and nevis": "KN",
  "st kitts and nevis": "KN",
  "saint lucia": "LC",
  "st lucia": "LC",
  "saint vincent and the grenadines": "VC",
  "st vincent and the grenadines": "VC",
  seychelles: "SC",
  singapore: "SG",
  "south africa": "ZA",
  sudan: "SD",
  syria: "SY",
  "syrian arab republic": "SY",
  spain: "ES",
  switzerland: "CH",
  thailand: "TH",
  turkey: "TR",
  uae: "AE",
  uk: "GB",
  "united arab emirates": "AE",
  "united kingdom": "GB",
  "united states of america": "US",
  "united states": "US",
  usa: "US",
  vanuatu: "VU",
  "republic of vanuatu": "VU",
};

const IGNORED_FALLBACK_WORDS = new Set(["of", "the", "and", "republic", "state", "states"]);

function cleanCountryText(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  const normalized = text.toLowerCase();
  if (!text || ["null", "undefined", "n/a", "na", "none", "-", "--"].includes(normalized))
    return "";
  return text;
}

function normalizeCountryLookup(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function flagFromCode(code: string) {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  return normalized
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function fallbackCountryCode(value: string) {
  const words = normalizeCountryLookup(value)
    .split(" ")
    .filter((word) => word && !IGNORED_FALLBACK_WORDS.has(word));
  if (!words.length) return "";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function resolveCountryDisplay(...values: unknown[]) {
  const raw = values.map(cleanCountryText).find(Boolean) || "";
  if (!raw) return { code: "GLB", flag: "", label: "GLB" };

  const fullLookup = normalizeCountryLookup(raw);
  for (const [name, code] of Object.entries(COUNTRY_CODES)) {
    if (fullLookup.includes(normalizeCountryLookup(name))) {
      return { code, flag: flagFromCode(code), label: code };
    }
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const lastPart = parts.at(-1) || raw;
  const directCode = COUNTRY_CODES[normalizeCountryLookup(lastPart)];
  if (directCode) return { code: directCode, flag: flagFromCode(directCode), label: directCode };

  if (/^[a-z]{2}$/i.test(lastPart)) {
    const code = lastPart.toUpperCase();
    return { code, flag: flagFromCode(code), label: code };
  }

  const fallback = fallbackCountryCode(lastPart);
  return { code: fallback, flag: "", label: fallback };
}
