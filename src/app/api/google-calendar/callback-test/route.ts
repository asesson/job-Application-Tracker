import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/lib/services/google-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This should be the test user ID
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/test-google-auth?error=google_auth_cancelled`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/settings/test-google-auth?error=missing_auth_parameters`, request.url)
      );
    }

    const googleAuth = new GoogleAuthService();

    // Exchange code for tokens
    const tokens = await googleAuth.getTokensFromCode(code);

    // For testing, we'll just display the result instead of storing
    const resultPage = `
      <html>
        <head><title>Google Calendar Test Success</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>✅ Google Calendar OAuth Success!</h1>
          <p><strong>Test User ID:</strong> ${state}</p>
          <p><strong>Access Token:</strong> ${tokens.access_token.substring(0, 20)}...</p>
          <p><strong>Refresh Token:</strong> ${tokens.refresh_token ? 'Present' : 'Missing'}</p>
          <p><strong>Expires:</strong> ${new Date(tokens.expiry_date).toLocaleString()}</p>
          <p><strong>Scope:</strong> ${tokens.scope}</p>

          <h2>🎉 Integration is Working!</h2>
          <p>The Google Calendar OAuth flow completed successfully. The integration is functional!</p>

          <a href="/settings">← Back to Settings</a>
        </body>
      </html>
    `;

    return new NextResponse(resultPage, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error in Google Calendar test callback:', error);

    const errorPage = `
      <html>
        <head><title>Google Calendar Test Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>❌ Google Calendar Test Error</h1>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/settings/test-google-auth">← Try Again</a>
        </body>
      </html>
    `;

    return new NextResponse(errorPage, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}