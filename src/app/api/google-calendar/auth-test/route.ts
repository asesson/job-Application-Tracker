import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/lib/services/google-auth';

export async function GET(request: NextRequest) {
  try {
    // For testing, use a fake user ID
    const testUserId = 'test-user-' + Date.now();

    const googleAuth = new GoogleAuthService();
    // Use the test callback URL instead of the main one
    const authUrl = googleAuth.generateAuthUrl(testUserId, '/api/google-calendar/callback-test');

    // Debug information
    const debugInfo = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '[HIDDEN]' : 'MISSING',
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    };

    return NextResponse.json({
      authUrl,
      testUserId,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}