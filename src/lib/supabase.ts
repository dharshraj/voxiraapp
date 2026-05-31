import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase env vars. Check your .env file.');
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE ADAPTER
// Web  → use localStorage (built into browser, no size limit issues)
// Native → chunked SecureStore (splits tokens > 2048 bytes across keys)
// ─────────────────────────────────────────────────────────────────────────────

let storageAdapter: any;

if (Platform.OS === 'web') {
  // Web: localStorage works perfectly for Supabase sessions
  storageAdapter = {
    getItem:    (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem:    (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve(); },
    removeItem: (key: string) => { localStorage.removeItem(key); return Promise.resolve(); },
  };
} else {
  // Native: chunked SecureStore (avoids 2048 byte limit)
  const SecureStore = require('expo-secure-store');
  const CHUNK = 1800;

  storageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
      try {
        const countStr = await SecureStore.getItemAsync(`${key}_count`);
        if (countStr) {
          const count = parseInt(countStr, 10);
          const chunks: string[] = [];
          for (let i = 0; i < count; i++) {
            const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
            if (chunk == null) return null;
            chunks.push(chunk);
          }
          return chunks.join('');
        }
        return await SecureStore.getItemAsync(key);
      } catch { return null; }
    },

    setItem: async (key: string, value: string): Promise<void> => {
      try {
        if (value.length <= CHUNK) {
          await SecureStore.deleteItemAsync(`${key}_count`).catch(() => {});
          await SecureStore.setItemAsync(key, value);
          return;
        }
        const chunks: string[] = [];
        for (let i = 0; i < value.length; i += CHUNK) {
          chunks.push(value.slice(i, i + CHUNK));
        }
        await SecureStore.setItemAsync(`${key}_count`, String(chunks.length));
        for (let i = 0; i < chunks.length; i++) {
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
        }
        try { await SecureStore.deleteItemAsync(key); } catch {}
      } catch {}
    },

    removeItem: async (key: string): Promise<void> => {
      try {
        const countStr = await SecureStore.getItemAsync(`${key}_count`);
        if (countStr) {
          const count = parseInt(countStr, 10);
          for (let i = 0; i < count; i++) {
            await SecureStore.deleteItemAsync(`${key}_chunk_${i}`).catch(() => {});
          }
          await SecureStore.deleteItemAsync(`${key}_count`).catch(() => {});
        }
        await SecureStore.deleteItemAsync(key).catch(() => {});
      } catch {}
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            storageAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: Platform.OS === 'web', // web needs this for OAuth redirects
  },
});