import { NextResponse } from 'next/server';
import { ConcertEvent } from '@/types';
import { searchSpotifyArtists } from '@/lib/spotify';

const BASE_URL = 'https://api.setlist.fm/rest/1.0';

// Known major music hubs for coordinate-to-city proximity resolution
const CITIES: { name: string; country: string; lat: number; lng: number }[] = [
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Prague', country: 'Czechia', lat: 50.0755, lng: 14.4378 },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'Austin', country: 'United States', lat: 30.2672, lng: -97.7431 },
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityParam = searchParams.get('city');
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const radiusParam = parseInt(searchParams.get('radius') || '50', 10);

  let targetCity = cityParam?.trim() || 'London';
  const userLat: number | null = latParam ? parseFloat(latParam) : null;
  const userLng: number | null = lngParam ? parseFloat(lngParam) : null;

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
  }

  try {
    const apiKey = process.env.SETLISTFM_API_KEY;
    const url = `${BASE_URL}/search/setlists?cityName=${encodeURIComponent(targetCity)}&p=1`;

    let concerts: ConcertEvent[] = [];

    if (apiKey) {
      const res = await fetch(url, {
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        const setlists = data.setlist || [];

        // Transform unique artist events
        const seenArtists = new Set<string>();

        for (const s of setlists) {
          const artistName = s.artist?.name;
          const mbid = s.artist?.mbid;
          if (!artistName || seenArtists.has(artistName.toLowerCase())) continue;
          seenArtists.add(artistName.toLowerCase());

          const venueName = s.venue?.name || 'Local Arena';
          const cityName = s.venue?.city?.name || targetCity;
          const countryName = s.venue?.city?.country?.name || 'World';
          const eventDate = s.eventDate || 'Upcoming Date';
          const tourName = s.tour?.name || `${new Date().getFullYear()} Tour`;

          concerts.push({
            id: s.id || `${mbid}-${cityName}`,
            artistName,
            mbid,
            venue: venueName,
            city: cityName,
            country: countryName,
            date: eventDate,
            tourName,
            distanceKm: radiusParam,
          });

          if (concerts.length >= 16) break;
        }
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
