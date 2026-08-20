import { NextResponse } from 'next/server';
import { ConcertEvent } from '@/types';
import { searchSpotifyArtists } from '@/lib/spotify';

const BASE_URL = 'https://api.setlist.fm/rest/1.0';

// Known music hubs for coordinate-to-city proximity and multi-city radius resolution
const CITIES: { name: string; country: string; lat: number; lng: number }[] = [
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  { name: 'Bratislava', country: 'Slovakia', lat: 48.1486, lng: 17.1077 },
  { name: 'Prague', country: 'Czechia', lat: 50.0755, lng: 14.4378 },
  { name: 'Brno', country: 'Czechia', lat: 49.1951, lng: 16.6068 },
  { name: 'Krakow', country: 'Poland', lat: 50.0647, lng: 19.945 },
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402 },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.582 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Austin', country: 'United States', lat: 30.2672, lng: -97.7431 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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

async function fetchCityConcerts(cityName: string, apiKey: string): Promise<ConcertEvent[]> {
  try {
    const url = `${BASE_URL}/search/setlists?cityName=${encodeURIComponent(cityName)}&p=1`;
    const res = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const setlists = data.setlist || [];
    const results: ConcertEvent[] = [];

    for (const s of setlists) {
      const artistName = s.artist?.name;
      const mbid = s.artist?.mbid;
      if (!artistName) continue;

      const venueName = s.venue?.name || 'Local Arena';
      const city = s.venue?.city?.name || cityName;
      const country = s.venue?.city?.country?.name || 'World';
      const eventDate = s.eventDate || 'Upcoming Date';
      const tourName = s.tour?.name || `${new Date().getFullYear()} Tour`;

      results.push({
        id: s.id || `${mbid}-${city}`,
        artistName,
        mbid,
        venue: venueName,
        city,
        country,
        date: eventDate,
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
  const radiusParam = parseInt(searchParams.get('radius') || '50', 10);

  let targetCity = cityParam?.trim() || 'Vienna';
  const userLat: number | null = latParam ? parseFloat(latParam) : null;
  const userLng: number | null = lngParam ? parseFloat(lngParam) : null;

  let originLat: number | null = userLat;
  let originLng: number | null = userLng;

  // Resolve nearest city if GPS coordinates were provided
  if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
    let closestCity = CITIES[0];
    let minDistance = Infinity;

    for (const c of CITIES) {
      const dist = calculateDistance(userLat, userLng, c.lat, c.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestCity = c;
      }
    }
    targetCity = closestCity.name;
    originLat = closestCity.lat;
    originLng = closestCity.lng;
  } else {
    const matchedCity = CITIES.find((c) => c.name.toLowerCase() === targetCity.toLowerCase());
    if (matchedCity) {
      originLat = matchedCity.lat;
      originLng = matchedCity.lng;
    }
  }

  // Find all cities within requested radius (up to 400km)
  const queryCities: { name: string; distance: number }[] = [{ name: targetCity, distance: 0 }];

  if (originLat !== null && originLng !== null) {
    for (const c of CITIES) {
      if (c.name.toLowerCase() === targetCity.toLowerCase()) continue;
      const dist = calculateDistance(originLat, originLng, c.lat, c.lng);
      if (dist <= radiusParam) {
        queryCities.push({ name: c.name, distance: dist });
      }
    }
  }

  // Sort by closest distance
  queryCities.sort((a, b) => a.distance - b.distance);
  const selectedCities = queryCities.slice(0, 4);

  try {
    const apiKey = process.env.SETLISTFM_API_KEY;
    let concerts: ConcertEvent[] = [];

    if (apiKey) {
      // Query target and nearby cities in parallel
      const resultsByCity = await Promise.all(
        selectedCities.map(async (c) => {
          const list = await fetchCityConcerts(c.name, apiKey);
          return list.map((item) => ({
            ...item,
            distanceKm: c.distance,
          }));
        })
      );

      const seenArtists = new Set<string>();

      for (const cityList of resultsByCity) {
        for (const concert of cityList) {
          const key = concert.artistName.toLowerCase();
          if (!seenArtists.has(key)) {
            seenArtists.add(key);
            concerts.push(concert);
          }
          if (concerts.length >= 24) break;
        }
        if (concerts.length >= 24) break;
      }
    }

    // Hydrate top artist images via Spotify
    concerts = await Promise.all(
      concerts.map(async (concert) => {
        try {
          const spotifyArtists = await searchSpotifyArtists(concert.artistName);
          if (spotifyArtists.length > 0 && spotifyArtists[0].images?.[0]?.url) {
            return {
              ...concert,
              artistImageUrl: spotifyArtists[0].images[0].url,
            };
          }
        } catch {
          // Ignore hydration failure
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
