import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

// ── CRITICAL: Fix web scrolling ───────────────────────────────────────────────
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const injectCSS = () => {
    if (document.getElementById('voxira-web-fix')) return;
    const s = document.createElement('style');
    s.id = 'voxira-web-fix';
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      html, body {
        height: 100%; margin: 0; padding: 0; overflow: hidden;
        background: #121316;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
      }
      #root { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
      #root > div, #root > div > div {
        flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;
      }
      * { -webkit-overflow-scrolling: touch; scroll-behavior: smooth; box-sizing: border-box; }
      .card-3d {
        transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s cubic-bezier(0.23,1,0.32,1);
        will-change: transform;
      }
      .card-3d:hover {
        transform: perspective(900px) rotateX(-3deg) rotateY(2deg) translateZ(10px) translateY(-4px);
        box-shadow: 0 28px 56px rgba(0,0,0,0.55), 0 0 36px rgba(79,110,247,0.22);
      }
      @keyframes glowPulse {
        0%,100% { box-shadow: 0 0 22px rgba(79,110,247,0.35); }
        50%      { box-shadow: 0 0 44px rgba(79,110,247,0.65); }
      }
      .btn-glow { animation: glowPulse 2.6s ease-in-out infinite; }
      @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .page-enter { animation: fadeSlideIn 0.55s cubic-bezier(0.23,1,0.32,1) both; }
      body::after {
        content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
        opacity: 0.025;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(79,110,247,0.4); border-radius: 2px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(79,110,247,0.7); }
      ::selection { background: rgba(79,110,247,0.38); color: #fff; }
      .google-btn { transition: transform 0.18s ease, box-shadow 0.18s ease; cursor: pointer; }
      .google-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
      .google-btn:active { transform: translateY(0px); }
      input:focus { outline: none; }
    `;
    document.head.appendChild(s);
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
        <ActivityIndicator size="large" color="#4F6EF7" />
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
  loading: { flex: 1, backgroundColor: '#121316', alignItems: 'center', justifyContent: 'center' },
});
