import { http, HttpResponse } from 'msw';

import metallicaData from './fixtures/metallica_10_shows.json';

export const handlers = [
  http.get('https://api.setlist.fm/rest/1.0/artist/:mbid/setlists', () => {
    return HttpResponse.json(metallicaData);
  }),

  http.post('https://api.spotify.com/v1/users/:userId/playlists', () => {
    return HttpResponse.json({
      id: 'test_playlist_id',
      external_urls: { spotify: 'https://open.spotify.com/playlist/test_playlist_id' },
      images: [{ url: 'https://i.scdn.co/image/test_image' }]
    });
  }),
];
