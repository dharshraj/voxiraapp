import { supabase } from './supabase';
import { Platform, Alert } from 'react-native';

export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (Platform.OS === 'web') {
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e?.message ?? 'Google sign-in failed' };
    }
  }

  // Native — try expo-web-browser (bundled inside expo-auth-session)
  try {
    const { makeRedirectUri } = require('expo-auth-session');
    let WebBrowser: any = null;
    try { WebBrowser = require('expo-web-browser'); } catch {}
    if (!WebBrowser) {
      try {
        WebBrowser = require(
          'expo-auth-session/node_modules/expo-web-browser'
        );
      } catch {}
    }

    if (!WebBrowser) {
      return {
        error:
          'Google Sign-In is available on web. Open the app in a browser to use it.',
      };
    }

    WebBrowser.maybeCompleteAuthSession();

    const redirectUri = makeRedirectUri({
      scheme: 'voxiraapp',
      path:   'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: redirectUri, skipBrowserRedirect: true },
    });
    if (error) return { error: error.message };
    if (!data.url) return { error: 'Failed to generate sign-in URL' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (result.type === 'success' && result.url) {
      const parsed = new URL(result.url);
      const code = parsed.searchParams.get('code');
      if (code) {
        const { error: ex } = await supabase.auth.exchangeCodeForSession(code);
        if (ex) return { error: ex.message };
      }
    } else if (result.type === 'cancel') {
      return { error: 'Sign-in cancelled' };
    }

    return {};
  } catch (e: any) {
    return { error: e?.message ?? 'Google sign-in failed' };
  }
}
