import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';

// ── CRITICAL: Fix web scrolling ───────────────────────────────────────────────
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Must run BEFORE React mounts
  const injectCSS = () => {
    const s = document.createElement('style');
    s.id = 'voxira-web-fix';
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #05050F;
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
      #root > div {
        overflow: visible !important;
        flex: 1;
      }
      * {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        box-sizing: border-box;
      }

      /* 3D card lift on hover */
      .card-3d {
        transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s cubic-bezier(0.23,1,0.32,1);
        will-change: transform;
      }
      .card-3d:hover {
        transform: perspective(900px) rotateX(-3deg) rotateY(2deg) translateZ(10px) translateY(-4px);
        box-shadow: 0 28px 56px rgba(0,0,0,0.55), 0 0 36px rgba(139,92,246,0.22);
      }

      /* Glow pulse on CTA buttons */
      @keyframes glowPulse {
        0%,100% { box-shadow: 0 0 22px rgba(139,92,246,0.35); }
        50%      { box-shadow: 0 0 44px rgba(139,92,246,0.65); }
      }
      .btn-glow { animation: glowPulse 2.6s ease-in-out infinite; }

      /* Page enter animation */
      @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .page-enter { animation: fadeSlideIn 0.55s cubic-bezier(0.23,1,0.32,1) both; }

      /* Subtle grain overlay */
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.025;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      }

      /* Scrollbar */
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.4); border-radius: 2px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.7); }

      /* Selection */
      ::selection { background: rgba(139,92,246,0.38); color: #fff; }

      /* Google button micro-interaction */
      .google-btn { transition: transform 0.18s ease, box-shadow 0.18s ease; cursor: pointer; }
      .google-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
      .google-btn:active { transform: translateY(0px); }

      /* Input focus glow */
      input:focus { outline: none; }
    `;
    document.head.appendChild(s);
  };
  // Inject immediately
  injectCSS();
  // Also inject after DOM ready (in case head isn't ready yet)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  }
}

const queryClient = new QueryClient({ defaultOptions:{ queries:{ retry:1, staleTime:30000 } } });

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        if (Platform.OS !== 'web') {
          const SplashScreen = require('expo-splash-screen');
          await SplashScreen.preventAutoHideAsync();
          await SplashScreen.hideAsync();
        }
      } catch{}
      finally { setReady(true); }
    })();
  },[]);

  if (!ready) return <View style={s.loading}><ActivityIndicator size="large" color="#6C5CE7"/></View>;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={s.flex}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark"/>
          <RootNavigator/>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  flex:    { flex:1 },
  loading: { flex:1, backgroundColor:'#F8F7F4', alignItems:'center', justifyContent:'center' },
});
