import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

// ── Web layout — injected once before React mounts ───────────────────────────
//
// The scroll fix works like this:
//
//   html (height:100%)
//   └── body (height:100%, NO overflow:hidden)
//       └── #root (height:100%, flex column)
//           └── GestureHandler / SafeArea / Nav divs (height:100%, flex column)
//               └── Screen root View (height:100%)
//                   └── ScrollView (height:100%, overflow-y:auto)  ← SCROLLS
//
// Every level must have a defined height — if any ancestor uses flex:1 WITHOUT
// a defined height, the chain breaks and the ScrollView cannot calculate its
// own height, so it doesn't scroll.
//
// We do NOT set overflow:hidden anywhere in this chain — that clips children.
// The fixed tab bar (position:fixed) handles its own layering.
//
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const inject = () => {
    if (document.getElementById('vx-web')) return;
    const el = document.createElement('style');
    el.id = 'vx-web';
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        height: 100%;
        margin: 0; padding: 0;
        background: #FAF9F7;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-font-smoothing: antialiased;
        overflow: hidden;
      }
      #root {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      ::-webkit-scrollbar { width: 5px; }
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
