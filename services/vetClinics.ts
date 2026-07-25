import AsyncStorage from "@react-native-async-storage/async-storage";

// Vet clinic data fetching via OpenStreetMap Overpass API + Nominatim Fallback + Local Favorites
// Multi-source fetching ensures max accuracy globally without requiring paid API keys.

export interface VetClinic {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  email?: string;
  openingHours?: string;
  distance: number; // km from user
  isFavorite?: boolean;
  notes?: string;
}

const FAVORITES_KEY = "@petnexa_favorite_vets";

/** Haversine formula — returns distance in km */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] || tags["addr:district"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:country"],
  ].filter(Boolean);
  return parts.join(", ") || tags["addr:full"] || "Address unavailable";
}

/** Fetch favorite clinic IDs from AsyncStorage */
export async function getFavoriteClinicIds(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/** Toggle favorite status of a clinic ID */
export async function toggleFavoriteClinicId(id: string): Promise<string[]> {
  const current = await getFavoriteClinicIds();
  const updated = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

/** Overpass API query for veterinary clinics */
async function fetchOverpassClinics(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<VetClinic[]> {
  try {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});
        way["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});
        relation["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});
        node["healthcare"="veterinary"](around:${radiusMeters},${lat},${lng});
        way["healthcare"="veterinary"](around:${radiusMeters},${lat},${lng});
        node["office"="veterinary"](around:${radiusMeters},${lat},${lng});
      );
      out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.elements as any[])
      .map((el) => {
        const elLat: number = el.type === "node" ? el.lat : el.center?.lat ?? 0;
        const elLng: number = el.type === "node" ? el.lon : el.center?.lon ?? 0;

        if (!elLat || !elLng) return null;

        const tags: Record<string, string> = el.tags ?? {};
        const name: string = tags.name || tags["name:en"] || "Veterinary Clinic";
        const id = String(el.id);

        return {
          id,
          name,
          address: buildAddress(tags),
          lat: elLat,
          lng: elLng,
          phone: tags.phone || tags["contact:phone"],
          website: tags.website || tags["contact:website"],
          email: tags.email || tags["contact:email"],
          openingHours: tags.opening_hours,
          distance: haversineKm(lat, lng, elLat, elLng),
        } satisfies VetClinic;
      })
      .filter((c): c is VetClinic => c !== null);
  } catch (e) {
    console.warn("Overpass API error:", e);
    return [];
  }
}

/** Nominatim fallback search */
async function fetchNominatimClinics(
  lat: number,
  lng: number
): Promise<VetClinic[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=veterinary+clinic&lat=${lat}&lon=${lng}&limit=20`;
    const response = await fetch(url, {
      headers: { "User-Agent": "PetnexaAI/1.0" },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data as any[]).map((item) => {
      const elLat = parseFloat(item.lat);
      const elLng = parseFloat(item.lon);
      const nameParts = (item.display_name || "").split(",");
      const name = nameParts[0]?.trim() || "Veterinary Clinic";
      const address = nameParts.slice(1).join(",").trim() || "Address unavailable";

      return {
        id: `nom_${item.place_id}`,
        name,
        address,
        lat: elLat,
        lng: elLng,
        distance: haversineKm(lat, lng, elLat, elLng),
      } satisfies VetClinic;
    });
  } catch (e) {
    console.warn("Nominatim API error:", e);
    return [];
  }
}

/**
 * Fetch real vet clinics near a given coordinate using multi-source API queries,
 * merged with favorite statuses and sorted by distance.
 */
export async function fetchNearbyVetClinics(
  lat: number,
  lng: number,
  radiusMeters: number = 15000
): Promise<VetClinic[]> {
  const favoriteIds = await getFavoriteClinicIds();

  // Try primary Overpass search
  let clinics = await fetchOverpassClinics(lat, lng, radiusMeters);

  // If Overpass returned few/no results, use Nominatim search as fallback
  if (clinics.length === 0) {
    const fallbackClinics = await fetchNominatimClinics(lat, lng);
    clinics = fallbackClinics;
  }

  // Deduplicate and apply favorite status
  const seen = new Set<string>();
  const uniqueClinics: VetClinic[] = [];

  for (const c of clinics) {
    // Key by rounded lat/lng to prevent overlapping duplicate nodes
    const coordKey = `${c.lat.toFixed(4)}_${c.lng.toFixed(4)}`;
    if (!seen.has(coordKey)) {
      seen.add(coordKey);
      uniqueClinics.push({
        ...c,
        isFavorite: favoriteIds.includes(c.id),
      });
    }
  }

  return uniqueClinics.sort((a, b) => a.distance - b.distance);
}

/** Format distance nicely */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Open native maps app with directions to a clinic */
export function getDirectionsUrl(
  destLat: number,
  destLng: number,
  label: string
): string {
  const encodedLabel = encodeURIComponent(label);
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&destination_place_id=${encodedLabel}`;
}
