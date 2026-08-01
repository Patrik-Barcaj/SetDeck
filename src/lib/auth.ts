import NextAuth from 'next-auth';
import Spotify from 'next-auth/providers/spotify';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization:
        'https://accounts.spotify.com/authorize?scope=user-read-private%20user-read-email%20playlist-modify-public%20playlist-modify-private',
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.providerAccountId = account.providerAccountId;
      }
      if (profile) {
        token.name = (profile.display_name as string) || user?.name;
        token.picture = ((profile as { images?: { url: string }[] }).images?.[0]?.url as string) || user?.image;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      session.providerAccountId = token.providerAccountId as string;
      return session;
    },
  },
});
