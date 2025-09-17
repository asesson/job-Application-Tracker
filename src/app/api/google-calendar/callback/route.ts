import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleAuthService } from '@/lib/services/google-auth';
import { GoogleCalendarClient } from '@/lib/services/google-calendar-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This should be the user ID
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=google_auth_cancelled`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/settings?error=missing_auth_parameters`, request.url)
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== state) {
      return NextResponse.redirect(
        new URL(`/settings?error=unauthorized`, request.url)
      );
    }

    const googleAuth = new GoogleAuthService();
    const googleClient = new GoogleCalendarClient();

    // Exchange code for tokens
    const tokens = await googleAuth.getTokensFromCode(code);

    // Store tokens
    await googleAuth.storeTokensForUser(user.id, tokens);

    // Get user's primary calendar
    const primaryCalendar = await googleClient.getPrimaryCalendar(user.id);

    if (primaryCalendar) {
      // Create or update sync settings
      await supabase
        .from('google_calendar_settings')
        .upsert({
          user_id: user.id,
          google_calendar_id: primaryCalendar.id,
          sync_enabled: true,
          sync_interviews: true,
          sync_deadlines: true,
          sync_applications: false,
          sync_follow_ups: true,
          sync_custom_events: true,
        });
    }

    return NextResponse.redirect(
      new URL(`/settings?success=google_calendar_connected`, request.url)
    );
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=connection_failed`, request.url)
    );
  }
}