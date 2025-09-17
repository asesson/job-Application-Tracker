import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CalendarSyncService } from '@/lib/services/calendar-sync';

export async function POST(request: NextRequest) {
  try {
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

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { syncDirection } = await request.json();
    const syncService = new CalendarSyncService();

    let result;

    switch (syncDirection) {
      case 'app_to_google':
        result = await syncService.syncAppEventsToGoogle(user.id);
        break;
      case 'google_to_app':
        result = await syncService.syncGoogleEventsToApp(user.id);
        break;
      case 'bidirectional':
      default:
        result = await syncService.performBidirectionalSync(user.id);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json(
      {
        success: false,
        eventsProcessed: 0,
        errorsCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Sync failed'
      },
      { status: 500 }
    );
  }
}