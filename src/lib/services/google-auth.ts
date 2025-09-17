import { OAuth2Client } from 'google-auth-library';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate the authorization URL for Google OAuth flow
   */
  generateAuthUrl(state?: string, customRedirectUri?: string): string {
    // If a custom redirect URI is provided, create a new OAuth2Client instance
    const oauthClient = customRedirectUri
      ? new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001'}${customRedirectUri}`
        )
      : this.oauth2Client;

    return oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SCOPES,
      state: state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<GoogleTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Invalid tokens received from Google');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000, // 1 hour default
      scope: GOOGLE_SCOPES.join(' '),
    };
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      access_token: credentials.access_token,
      refresh_token: refreshToken, // Keep the same refresh token
      expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
      scope: GOOGLE_SCOPES.join(' '),
    };
  }

  /**
   * Store tokens in the database for a user
   */
  async storeTokensForUser(userId: string, tokens: GoogleTokens): Promise<void> {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(tokens.expiry_date).toISOString(),
        scope: tokens.scope,
      });

    if (error) {
      throw new Error(`Failed to store tokens: ${error.message}`);
    }
  }

  /**
   * Get tokens for a user from the database
   */
  async getTokensForUser(userId: string): Promise<GoogleTokens | null> {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expiry_date: new Date(data.token_expiry).getTime(),
      scope: data.scope,
    };
  }

  /**
   * Get a valid access token for a user (refresh if needed)
   */
  async getValidTokensForUser(userId: string): Promise<GoogleTokens | null> {
    const tokens = await this.getTokensForUser(userId);

    if (!tokens) {
      return null;
    }

    // Check if token is expired or expires in the next 5 minutes
    const now = Date.now();
    const expiresIn = tokens.expiry_date - now;
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresIn <= fiveMinutes) {
      try {
        // Refresh the token
        const refreshedTokens = await this.refreshAccessToken(tokens.refresh_token);

        // Store the refreshed tokens
        await this.storeTokensForUser(userId, refreshedTokens);

        return refreshedTokens;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Token might be revoked, return null to force re-authentication
        return null;
      }
    }

    return tokens;
  }

  /**
   * Get an authenticated OAuth2Client for a user
   */
  async getAuthenticatedClientForUser(userId: string): Promise<OAuth2Client | null> {
    const tokens = await this.getValidTokensForUser(userId);

    if (!tokens) {
      return null;
    }

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    return client;
  }

  /**
   * Remove tokens for a user (disconnect)
   */
  async removeTokensForUser(userId: string): Promise<void> {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { error } = await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove tokens: ${error.message}`);
    }
  }

  /**
   * Check if a user has valid Google Calendar integration
   */
  async isUserConnected(userId: string): Promise<boolean> {
    const tokens = await this.getValidTokensForUser(userId);
    return tokens !== null;
  }
}