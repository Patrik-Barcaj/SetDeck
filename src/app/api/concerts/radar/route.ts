import { NextResponse } from 'next/server';
import { ConcertEvent } from '@/types';
import { searchSpotifyArtists } from '@/lib/spotify';

const BASE_URL = 'https://api.setlist.fm/rest/1.0';

interface GlobalCity {
  name: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
}

const GLOBAL_MUSIC_HUBS: GlobalCity[] = [
  // Central & Eastern Europe
  { name: 'Vienna', country: 'Austria', flag: '🇦🇹', lat: 48.2082, lng: 16.3738 },
  { name: 'Bratislava', country: 'Slovakia', flag: '🇸🇰', lat: 48.1486, lng: 17.1077 },
  { name: 'Prague', country: 'Czechia', flag: '🇨🇿', lat: 50.0755, lng: 14.4378 },
  { name: 'Brno', country: 'Czechia', flag: '🇨🇿', lat: 49.1951, lng: 16.6068 },
  { name: 'Ostrava', country: 'Czechia', flag: '🇨🇿', lat: 49.8209, lng: 18.2625 },
  { name: 'Budapest', country: 'Hungary', flag: '🇭🇺', lat: 47.4979, lng: 19.0402 },
  { name: 'Krakow', country: 'Poland', flag: '🇵🇱', lat: 50.0647, lng: 19.945 },
  { name: 'Warsaw', country: 'Poland', flag: '🇵🇱', lat: 52.2297, lng: 21.0122 },
  { name: 'Wroclaw', country: 'Poland', flag: '🇵🇱', lat: 51.1079, lng: 17.0385 },
  { name: 'Gdansk', country: 'Poland', flag: '🇵🇱', lat: 54.352, lng: 18.6466 },
  { name: 'Zagreb', country: 'Croatia', flag: '🇭🇷', lat: 45.815, lng: 15.9819 },
  { name: 'Ljubljana', country: 'Slovenia', flag: '🇸🇮', lat: 46.0569, lng: 14.5058 },
  { name: 'Belgrade', country: 'Serbia', flag: '🇷🇸', lat: 44.7866, lng: 20.4489 },
  { name: 'Bucharest', country: 'Romania', flag: '🇷🇴', lat: 44.4268, lng: 26.1025 },
  { name: 'Sofia', country: 'Bulgaria', flag: '🇧🇬', lat: 42.6977, lng: 23.3219 },
  { name: 'Vilnius', country: 'Lithuania', flag: '🇱🇹', lat: 54.6872, lng: 25.2797 },
  { name: 'Riga', country: 'Latvia', flag: '🇱🇻', lat: 56.9496, lng: 24.1052 },
  { name: 'Tallinn', country: 'Estonia', flag: '🇪🇪', lat: 59.437, lng: 24.7535 },

  // Western & Northern Europe
  { name: 'Berlin', country: 'Germany', flag: '🇩🇪', lat: 52.52, lng: 13.405 },
  { name: 'Munich', country: 'Germany', flag: '🇩🇪', lat: 48.1351, lng: 11.582 },
  { name: 'Hamburg', country: 'Germany', flag: '🇩🇪', lat: 53.5511, lng: 9.9937 },
  { name: 'Cologne', country: 'Germany', flag: '🇩🇪', lat: 50.9375, lng: 6.9603 },
  { name: 'Frankfurt', country: 'Germany', flag: '🇩🇪', lat: 50.1109, lng: 8.6821 },
  { name: 'Stuttgart', country: 'Germany', flag: '🇩🇪', lat: 48.7758, lng: 9.1829 },
  { name: 'Leipzig', country: 'Germany', flag: '🇩🇪', lat: 51.3397, lng: 12.3731 },
  { name: 'Paris', country: 'France', flag: '🇫🇷', lat: 48.8566, lng: 2.3522 },
  { name: 'Lyon', country: 'France', flag: '🇫🇷', lat: 45.764, lng: 4.8357 },
  { name: 'Marseille', country: 'France', flag: '🇫🇷', lat: 43.2965, lng: 5.3698 },
  { name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', lat: 52.3676, lng: 4.9041 },
  { name: 'Rotterdam', country: 'Netherlands', flag: '🇳🇱', lat: 51.9244, lng: 4.4777 },
  { name: 'Utrecht', country: 'Netherlands', flag: '🇳🇱', lat: 52.0907, lng: 5.1214 },
  { name: 'Brussels', country: 'Belgium', flag: '🇧🇪', lat: 50.8503, lng: 4.3517 },
  { name: 'Antwerp', country: 'Belgium', flag: '🇧🇪', lat: 51.2194, lng: 4.4025 },
  { name: 'Zurich', country: 'Switzerland', flag: '🇨🇭', lat: 47.3769, lng: 8.5417 },
  { name: 'Geneva', country: 'Switzerland', flag: '🇨🇭', lat: 46.2044, lng: 6.1432 },
  { name: 'Basel', country: 'Switzerland', flag: '🇨🇭', lat: 47.5596, lng: 7.5886 },
  { name: 'Copenhagen', country: 'Denmark', flag: '🇩🇰', lat: 55.6761, lng: 12.5683 },
  { name: 'Stockholm', country: 'Sweden', flag: '🇸🇪', lat: 59.3293, lng: 18.0686 },
  { name: 'Gothenburg', country: 'Sweden', flag: '🇸🇪', lat: 57.7089, lng: 11.9746 },
  { name: 'Oslo', country: 'Norway', flag: '🇳🇴', lat: 59.9139, lng: 10.7522 },
  { name: 'Helsinki', country: 'Finland', flag: '🇫🇮', lat: 60.1699, lng: 24.9384 },
  { name: 'Dublin', country: 'Ireland', flag: '🇮🇪', lat: 53.3498, lng: -6.2603 },
  { name: 'Belfast', country: 'United Kingdom', flag: '🇬🇧', lat: 54.5973, lng: -5.9301 },
  { name: 'Reykjavik', country: 'Iceland', flag: '🇮🇸', lat: 64.1466, lng: -21.9426 },

  // UK
  { name: 'London', country: 'United Kingdom', flag: '🇬🇧', lat: 51.5074, lng: -0.1278 },
  { name: 'Manchester', country: 'United Kingdom', flag: '🇬🇧', lat: 53.4808, lng: -2.2426 },
  { name: 'Birmingham', country: 'United Kingdom', flag: '🇬🇧', lat: 52.4862, lng: -1.8904 },
  { name: 'Glasgow', country: 'United Kingdom', flag: '🇬🇧', lat: 55.8642, lng: -4.2518 },
  { name: 'Edinburgh', country: 'United Kingdom', flag: '🇬🇧', lat: 55.9533, lng: -3.1883 },
  { name: 'Leeds', country: 'United Kingdom', flag: '🇬🇧', lat: 53.8008, lng: -1.5491 },
  { name: 'Liverpool', country: 'United Kingdom', flag: '🇬🇧', lat: 53.4084, lng: -2.9916 },
  { name: 'Bristol', country: 'United Kingdom', flag: '🇬🇧', lat: 51.4545, lng: -2.5879 },
  { name: 'Newcastle', country: 'United Kingdom', flag: '🇬🇧', lat: 54.9783, lng: -1.6178 },
  { name: 'Cardiff', country: 'United Kingdom', flag: '🇬🇧', lat: 51.4816, lng: -3.1791 },

  // Southern Europe
  { name: 'Madrid', country: 'Spain', flag: '🇪🇸', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', country: 'Spain', flag: '🇪🇸', lat: 41.3879, lng: 2.1699 },
  { name: 'Valencia', country: 'Spain', flag: '🇪🇸', lat: 39.4699, lng: -0.3763 },
  { name: 'Seville', country: 'Spain', flag: '🇪🇸', lat: 37.3891, lng: -5.9845 },
  { name: 'Bilbao', country: 'Spain', flag: '🇪🇸', lat: 43.263, lng: -2.935 },
  { name: 'Lisbon', country: 'Portugal', flag: '🇵🇹', lat: 38.7223, lng: -9.1393 },
  { name: 'Porto', country: 'Portugal', flag: '🇵🇹', lat: 41.1579, lng: -8.6291 },
  { name: 'Rome', country: 'Italy', flag: '🇮🇹', lat: 41.9028, lng: 12.4964 },
  { name: 'Milan', country: 'Italy', flag: '🇮🇹', lat: 45.4642, lng: 9.19 },
  { name: 'Bologna', country: 'Italy', flag: '🇮🇹', lat: 44.4949, lng: 11.3426 },
  { name: 'Florence', country: 'Italy', flag: '🇮🇹', lat: 43.7696, lng: 11.2558 },
  { name: 'Turin', country: 'Italy', flag: '🇮🇹', lat: 45.0703, lng: 7.6869 },
  { name: 'Naples', country: 'Italy', flag: '🇮🇹', lat: 40.8518, lng: 14.2681 },
  { name: 'Athens', country: 'Greece', flag: '🇬🇷', lat: 37.9838, lng: 23.7275 },

  // North America
  { name: 'New York', country: 'United States', flag: '🇺🇸', lat: 40.7128, lng: -74.006 },
  { name: 'Los Angeles', country: 'United States', flag: '🇺🇸', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', country: 'United States', flag: '🇺🇸', lat: 41.8781, lng: -87.6298 },
  { name: 'Austin', country: 'United States', flag: '🇺🇸', lat: 30.2672, lng: -97.7431 },
  { name: 'Nashville', country: 'United States', flag: '🇺🇸', lat: 36.1627, lng: -86.7816 },
  { name: 'Seattle', country: 'United States', flag: '🇺🇸', lat: 47.6062, lng: -122.3321 },
  { name: 'San Francisco', country: 'United States', flag: '🇺🇸', lat: 37.7749, lng: -122.4194 },
  { name: 'Boston', country: 'United States', flag: '🇺🇸', lat: 42.3601, lng: -71.0589 },
  { name: 'Philadelphia', country: 'United States', flag: '🇺🇸', lat: 39.9526, lng: -75.1652 },
  { name: 'Atlanta', country: 'United States', flag: '🇺🇸', lat: 33.749, lng: -84.388 },
  { name: 'Miami', country: 'United States', flag: '🇺🇸', lat: 25.7617, lng: -80.1918 },
  { name: 'Denver', country: 'United States', flag: '🇺🇸', lat: 39.7392, lng: -104.9903 },
  { name: 'Las Vegas', country: 'United States', flag: '🇺🇸', lat: 36.1699, lng: -115.1398 },
  { name: 'Washington', country: 'United States', flag: '🇺🇸', lat: 38.9072, lng: -77.0369 },
  { name: 'Dallas', country: 'United States', flag: '🇺🇸', lat: 32.7767, lng: -96.797 },
  { name: 'Houston', country: 'United States', flag: '🇺🇸', lat: 29.7604, lng: -95.3698 },
  { name: 'Minneapolis', country: 'United States', flag: '🇺🇸', lat: 44.9778, lng: -93.265 },
  { name: 'Detroit', country: 'United States', flag: '🇺🇸', lat: 42.3314, lng: -83.0458 },
  { name: 'Portland', country: 'United States', flag: '🇺🇸', lat: 45.5152, lng: -122.6784 },
  { name: 'Toronto', country: 'Canada', flag: '🇨🇦', lat: 43.6532, lng: -79.3832 },
  { name: 'Montreal', country: 'Canada', flag: '🇨🇦', lat: 45.5017, lng: -73.5673 },
  { name: 'Vancouver', country: 'Canada', flag: '🇨🇦', lat: 49.2827, lng: -123.1207 },
  { name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', lat: 19.4326, lng: -99.1332 },
  { name: 'Guadalajara', country: 'Mexico', flag: '🇲🇽', lat: 20.6597, lng: -103.3496 },

  // South America
  { name: 'São Paulo', country: 'Brazil', flag: '🇧🇷', lat: -23.5505, lng: -46.6333 },
  { name: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', lat: -22.9068, lng: -43.1729 },
  { name: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', lat: -34.6037, lng: -58.3816 },
  { name: 'Santiago', country: 'Chile', flag: '🇨🇱', lat: -33.4489, lng: -70.6693 },
  { name: 'Bogota', country: 'Colombia', flag: '🇨🇴', lat: 4.711, lng: -74.0721 },
  { name: 'Lima', country: 'Peru', flag: '🇵🇪', lat: -12.0464, lng: -77.0428 },

  // Asia & Oceania
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', lat: 35.6762, lng: 139.6503 },
  { name: 'Osaka', country: 'Japan', flag: '🇯🇵', lat: 34.6937, lng: 135.5023 },
  { name: 'Seoul', country: 'South Korea', flag: '🇰🇷', lat: 37.5665, lng: 126.978 },
  { name: 'Singapore', country: 'Singapore', flag: '🇸🇬', lat: 1.3521, lng: 103.8198 },
  { name: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', lat: 22.3193, lng: 114.1694 },
  { name: 'Taipei', country: 'Taiwan', flag: '🇹🇼', lat: 25.033, lng: 121.5654 },
  { name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', lat: 13.7563, lng: 100.5018 },
  { name: 'Sydney', country: 'Australia', flag: '🇦🇺', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', country: 'Australia', flag: '🇦🇺', lat: -37.8136, lng: 144.9631 },
  { name: 'Brisbane', country: 'Australia', flag: '🇦🇺', lat: -27.4698, lng: 153.0251 },
  { name: 'Perth', country: 'Australia', flag: '🇦🇺', lat: -31.9505, lng: 115.8605 },
  { name: 'Auckland', country: 'New Zealand', flag: '🇳🇿', lat: -36.8485, lng: 174.7633 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function parseSetlistDate(dateStr?: string): {
  isoDate?: string;
  formattedDate?: string;
  daysUntil?: number;
  isSoon?: boolean;
} {
  if (!dateStr) return {};

  try {
    // Expected Setlist.fm format: dd-MM-yyyy (e.g. 24-09-2026)
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      const eventDate = new Date(Date.UTC(year, month, day));
      if (!isNaN(eventDate.getTime())) {
        const today = new Date();
        const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        const diffMs = eventDate.getTime() - startOfToday.getTime();
        const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDate = `${monthNames[month]} ${day}, ${year}`;
        const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        return {
          isoDate,
          formattedDate,
          daysUntil,
          isSoon: daysUntil >= 0 && daysUntil <= 14,
        };
      }
    }
  } catch {
    // fallback
  }

  return { formattedDate: dateStr };
}

async function fetchCityConcerts(cityName: string, apiKey: string): Promise<ConcertEvent[]> {
  try {
    const url = `${BASE_URL}/search/setlists?cityName=${encodeURIComponent(cityName)}&p=1`;
    const res = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const setlists = data.setlist || [];
    const results: ConcertEvent[] = [];

    for (const s of setlists) {
      const artistName = s.artist?.name;
      const mbid = s.artist?.mbid;
      if (!artistName) continue;

      const venueName = s.venue?.name || 'Live Music Venue';
      const city = s.venue?.city?.name || cityName;
      const country = s.venue?.city?.country?.name || 'World';
      const rawDate = s.eventDate || 'Upcoming';
      const tourName = s.tour?.name || `${new Date().getFullYear()} Tour`;
      const dateMeta = parseSetlistDate(rawDate);

      results.push({
        id: s.id || `${mbid}-${city}-${rawDate}`,
        artistName,
        mbid,
        venue: venueName,
        city,
        country,
        date: rawDate,
        isoDate: dateMeta.isoDate,
        formattedDate: dateMeta.formattedDate || rawDate,
        daysUntil: dateMeta.daysUntil,
        isSoon: dateMeta.isSoon,
        tourName,
      });
    }

    return results;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityParam = searchParams.get('city');
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const radiusParam = parseInt(searchParams.get('radius') || '100', 10);

  let targetCity = cityParam?.trim() || 'Vienna';
  const userLat: number | null = latParam ? parseFloat(latParam) : null;
  const userLng: number | null = lngParam ? parseFloat(lngParam) : null;

  let originLat: number | null = userLat;
  let originLng: number | null = userLng;

  // Resolve nearest known city if GPS coordinates were provided
  if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
    let closestCity = GLOBAL_MUSIC_HUBS[0];
    let minDistance = Infinity;

    for (const c of GLOBAL_MUSIC_HUBS) {
      const dist = calculateDistance(userLat, userLng, c.lat, c.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestCity = c;
      }
    }
    targetCity = closestCity.name;
    originLat = userLat;
    originLng = userLng;
  } else {
    // Match city name
    const matchedCity = GLOBAL_MUSIC_HUBS.find(
      (c) => c.name.toLowerCase() === targetCity.toLowerCase()
    );
    if (matchedCity) {
      originLat = matchedCity.lat;
      originLng = matchedCity.lng;
    }
  }

  // Find all hubs within requested radius (up to 400km)
  const queryCities: { name: string; distance: number; country: string; flag: string }[] = [];

  if (originLat !== null && originLng !== null) {
    for (const c of GLOBAL_MUSIC_HUBS) {
      const dist = calculateDistance(originLat, originLng, c.lat, c.lng);
      if (dist <= radiusParam) {
        queryCities.push({ name: c.name, distance: dist, country: c.country, flag: c.flag });
      }
    }
  } else {
    queryCities.push({ name: targetCity, distance: 0, country: 'World', flag: '🌍' });
  }

  // If no hub was within radius, always include the origin city
  if (queryCities.length === 0) {
    queryCities.push({ name: targetCity, distance: 0, country: 'World', flag: '🌍' });
  }

  // Sort by closest distance and limit to top 6 parallel queries for fast performance
  queryCities.sort((a, b) => a.distance - b.distance);
  const selectedCities = queryCities.slice(0, 6);

  try {
    const apiKey = process.env.SETLISTFM_API_KEY;
    let concerts: ConcertEvent[] = [];

    if (apiKey) {
      // Query target and nearby regional cities in parallel
      const resultsByCity = await Promise.all(
        selectedCities.map(async (c) => {
          const list = await fetchCityConcerts(c.name, apiKey);
          return list.map((item) => ({
            ...item,
            distanceKm: c.distance,
          }));
        })
      );

      const seenConcerts = new Map<string, ConcertEvent>();

      for (const cityList of resultsByCity) {
        for (const concert of cityList) {
          const key = `${concert.artistName.toLowerCase()}-${concert.date}`;
          if (!seenConcerts.has(key)) {
            seenConcerts.set(key, concert);
          }
        }
      }

      concerts = Array.from(seenConcerts.values());

      // Sort concerts: upcoming first (closest upcoming date first), then past shows (newest first)
      concerts.sort((a, b) => {
        const aDays = a.daysUntil ?? -9999;
        const bDays = b.daysUntil ?? -9999;

        // Both in future
        if (aDays >= 0 && bDays >= 0) {
          return aDays - bDays;
        }
        // a is future, b is past
        if (aDays >= 0 && bDays < 0) return -1;
        // b is future, a is past
        if (bDays >= 0 && aDays < 0) return 1;

        // Both in past: sort closest to now first
        return bDays - aDays;
      });

      // Limit results to top 32 concerts
      concerts = concerts.slice(0, 32);
    }

    // Hydrate top artist images and genres via Spotify
    concerts = await Promise.all(
      concerts.map(async (concert) => {
        try {
          const spotifyArtists = await searchSpotifyArtists(concert.artistName);
          if (spotifyArtists.length > 0) {
            const first = spotifyArtists[0];
            return {
              ...concert,
              artistImageUrl: first.images?.[0]?.url || concert.artistImageUrl,
              genres: first.genres || [],
            };
          }
        } catch {
          // Graceful fallback without image
        }
        return concert;
      })
    );

    return NextResponse.json({
      targetCity,
      radius: radiusParam,
      queriedCities: selectedCities.map((c) => c.name),
      totalFound: concerts.length,
      concerts,
    });
  } catch (err) {
    console.error('Radar API Error:', err);
    return NextResponse.json({
      targetCity,
      radius: radiusParam,
      totalFound: 0,
      concerts: [],
      error: 'Failed to query live radar dates',
    });
  }
}
