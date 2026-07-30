import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

// ── Web layout fix (SINGLE source of truth — this file, not web/index.html) ──
// `expo start --web` (the dev server) never actually serves web/index.html —
// it always uses its own generic built-in HTML shell. web/index.html only
// applies to a production `expo export --platform web` build. So a CSS fix
// that lives only in web/index.html silently does nothing during normal
// development. This block runs as plain JS inside the bundle, so it applies
// identically in both dev and production — this is the one place a layout
// fix here actually has to live.
//
// Root cause of the "content is cut off, can't scroll" bug: browsers give
// flex items a default `min-height: auto`, which stops them shrinking below
// their content's natural height even inside a bounded parent. React
// Navigation nests screen content inside many <div> layers; without
// `min-height: 0` on those wrapper divs, one of them grows to full content
// height instead of being capped at the viewport, so the actual ScrollView
// further down never gets a bounded box to compute overflow against — the
// extra content is simply clipped at the page edge instead of scrolling.
//
// `min-height: 0` alone isn't sufficient though (verified) — it only allows
// *shrinking*, it doesn't establish the bound in the first place. The
// bound comes from `flex-grow` cascading down the same wrapper chain, so
// each level actually receives (and passes on) a share of the parent's
// available space instead of just sizing to its own content. We deliberately
// never set `flex-direction` or `display` here: react-native-web already
// emits the correct value per element via its own atomic CSS classes
// (that's why the code used to need a `!important` escape hatch just to
// keep the tab bar in row direction — an ID-selector rule setting
// flex-direction here would silently beat react-native-web's own classes).
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const inject = () => {
    if (document.getElementById('vx-web')) return;
    const el = document.createElement('style');
    el.id = 'vx-web';
    el.textContent = `
      html, body {
        height: 100%;
        margin: 0; padding: 0;
        overflow: hidden;
      }
      #root {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      #root div { min-height: 0; }
      #root > div,
      #root > div > div,
      #root > div > div > div,
      #root > div > div > div > div,
      #root > div > div > div > div > div,
      #root > div > div > div > div > div > div,
      #root > div > div > div > div > div > div > div,
      #root > div > div > div > div > div > div > div > div,
      #root > div > div > div > div > div > div > div > div > div,
      #root > div > div > div > div > div > div > div > div > div > div,
      #root > div > div > div > div > div > div > div > div > div > div > div,
      #root > div > div > div > div > div > div > div > div > div > div > div > div {
        flex-grow: 1;
        flex-shrink: 1;
      }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-thumb { background: rgba(146,64,14,0.25); border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(146,64,14,0.45); }
      input:focus, textarea:focus { outline: none; }
    `;
    document.head.appendChild(el);
  };
  inject();
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', inject)
    : inject();
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize auth store — sets up listeners, resolves initial session
    const cleanupAuth = useAuthStore.getState().initialize();

    // Handle native splash screen
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          const SplashScreen = require('expo-splash-screen');
          await SplashScreen.preventAutoHideAsync();
          await SplashScreen.hideAsync();
        }
      } catch {}
      finally { setReady(true); }
    })();

    return cleanupAuth;
  }, []);

  if (!ready) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#92400E" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={s.flex}>
        <ThemeProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  flex:    { flex: 1 },
  loading: { flex: 1, backgroundColor: '#FAF9F7', alignItems: 'center', justifyContent: 'center' },
});
