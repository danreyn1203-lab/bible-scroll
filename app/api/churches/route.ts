import { NextResponse } from "next/server";

// Church finder — powered entirely by free OpenStreetMap services (no API key).
//   1. Nominatim geocodes the user's postal code -> lat/lon.
//   2. Overpass returns Christian places of worship near that point.
//   3. We rank them by denomination match (if the user gave one) then distance.
//
// Both services are public; their usage policy asks for a descriptive
// User-Agent, which we send below.

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS = "https://overpass-api.de/api/interpreter";
const UA = "SimplyManna/1.0 (church-finder; https://tastemanna.com)";
const SEARCH_RADIUS_M = 8000; // ~5 miles

// Map the app's tradition choices to the denomination tokens OpenStreetMap uses
// on its `denomination=` tag. A church matches if any token is a substring.
const DENOM_TOKENS: Record<string, string[]> = {
  Catholic: ["catholic", "roman_catholic"],
  Orthodox: ["orthodox", "coptic", "greek_orthodox", "russian_orthodox", "eastern_orthodox"],
  Evangelical: ["evangelical", "pentecostal", "baptist", "charismatic", "born_again"],
  Protestant: [
    "protestant", "baptist", "methodist", "lutheran", "presbyterian",
    "anglican", "episcopal", "reformed", "evangelical", "pentecostal", "congregational",
  ],
  "Non-denominational": ["nondenominational", "non-denominational", "non_denominational"],
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function titleCase(s: string) {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postal = (searchParams.get("postal") || "").trim();
  const country = (searchParams.get("country") || "").trim();
  const city = (searchParams.get("city") || "").trim();
  const denomination = (searchParams.get("denomination") || "").trim();

  if (!postal) {
    return NextResponse.json({ error: "Please enter a postal or ZIP code." }, { status: 400 });
  }

  // --- 1. Geocode the postal code ------------------------------------------
  const q = [postal, city, country].filter(Boolean).join(", ");
  let point: { lat: number; lon: number; label: string };
  try {
    const url = `${NOMINATIM}?format=jsonv2&limit=1&addressdetails=0&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) throw new Error(`geocode ${res.status}`);
    const hits = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!hits.length) {
      return NextResponse.json(
        { error: `We couldn't find "${postal}". Double-check the code (and try adding your country).` },
        { status: 404 },
      );
    }
    point = { lat: parseFloat(hits[0].lat), lon: parseFloat(hits[0].lon), label: hits[0].display_name };
  } catch {
    return NextResponse.json({ error: "Location lookup is unavailable right now. Please try again." }, { status: 502 });
  }

  // --- 2. Find nearby Christian places of worship --------------------------
  const overpassQL = `[out:json][timeout:25];
(
  node["amenity"="place_of_worship"]["religion"="christian"](around:${SEARCH_RADIUS_M},${point.lat},${point.lon});
  way["amenity"="place_of_worship"]["religion"="christian"](around:${SEARCH_RADIUS_M},${point.lat},${point.lon});
);
out center tags 60;`;

  type OverpassEl = {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  };
  let elements: OverpassEl[] = [];
  try {
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(overpassQL),
    });
    if (!res.ok) throw new Error(`overpass ${res.status}`);
    const data = (await res.json()) as { elements: OverpassEl[] };
    elements = data.elements || [];
  } catch {
    return NextResponse.json({ error: "Church search is unavailable right now. Please try again." }, { status: 502 });
  }

  // --- 3. Shape, rank, and return ------------------------------------------
  const tokens = DENOM_TOKENS[denomination] || [];
  const seen = new Set<string>();

  const churches = elements
    .map(el => {
      const tags = el.tags || {};
      const name = tags.name;
      if (!name) return null; // skip unnamed points
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) return null;

      const rawDenom = (tags.denomination || "").toLowerCase();
      const matches = tokens.length > 0 && tokens.some(t => rawDenom.includes(t));
      const distanceKm = haversineKm(point.lat, point.lon, lat, lon);

      const addrParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean);

      return {
        id: `${el.type}/${el.id}`,
        name,
        denomination: tags.denomination ? titleCase(tags.denomination) : "Christian",
        matches,
        distanceKm: Math.round(distanceKm * 10) / 10,
        address: addrParts.join(", ") || null,
        website: tags.website || tags["contact:website"] || null,
        lat,
        lon,
        mapUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .filter(c => {
      if (seen.has(c.name + c.distanceKm)) return false; // dedupe near-identical
      seen.add(c.name + c.distanceKm);
      return true;
    })
    // Matches first, then nearest.
    .sort((a, b) => (a.matches === b.matches ? a.distanceKm - b.distanceKm : a.matches ? -1 : 1))
    .slice(0, 12);

  return NextResponse.json({
    location: point.label,
    denomination: denomination || null,
    count: churches.length,
    churches,
  });
}
