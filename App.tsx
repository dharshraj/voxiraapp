import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

// ── Web scroll / layout fix ───────────────────────────────────────────────────
// Root cause of the scroll bug: overflow:hidden on every ancestor div clips the
// React Native Web ScrollView so content below the fold is unreachable.
// Fix: body/html keep overflow:hidden (prevents page-level scroll, tab bar
// stays fixed), but inner containers use min-height:0 so ScrollViews can grow.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const injectCSS = () => {
    if (document.getElementById('voxira-web-fix')) return;
    const style = document.createElement('style');
    style.id = 'voxira-web-fix';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      html, body {
        height: 100%; margin: 0; padding: 0;
        overflow: hidden;
        background: #FAF9F7;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      #root {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      /*
       * SCROLL FIX — the root cause of "can't scroll any screen":
       *
       * React Navigation nests content 6–8 <div> levels deep inside #root
       * (NavigationContainer → BottomTabNavigator → StackNavigator → Screen).
       * CSS flex items default to min-height: auto, which means they refuse to
       * shrink below their content height even when a parent clips them with
       * overflow: hidden.  The result: every intermediate div grows to FULL
       * content height, the parent clips it at viewport height, and the inner
       * ScrollView has no scroll context because it was also clipped to 0.
       *
       * Fix: apply min-height: 0 to EVERY div inside #root so ALL navigation
       * wrapper divs can shrink to fit the viewport.  The ScrollView's content
       * div still grows naturally (its height comes from its children, not from
       * min-height), while the viewport div gets a bounded height and scrolls.
       */
      #root div {
        min-height: 0;
      }
      /* Explicitly bound the first two levels and hide overflow so deeper
         layers cannot accidentally cause page-level scroll. */
      #root > div,
      #root > div > div {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      * { -webkit-overflow-scrolling: touch; box-sizing: border-box; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(79,110,247,0.3); border-radius: 2px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(79,110,247,0.6); }
      ::selection { background: rgba(79,110,247,0.2); }
      input:focus { outline: none; }
    `;
    document.head.appendChild(style);
  };
  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  }
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
