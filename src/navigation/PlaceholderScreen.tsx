import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const C = {
  bg:      '#0D1B2A',
  surface: '#1A2B3C',
  primary: '#1565FF',
  accent:  '#4FC3F7',
  text:    '#FFFFFF',
  muted:   'rgba(255,255,255,0.45)',
  border:  'rgba(255,255,255,0.10)',
};

export default function PlaceholderScreen() {
  const route = useRoute();
  const name  = route.name ?? 'Screen';

  const iconMap: Record<string, any> = {
    Home:           'home-outline',
    Speech:         'mic-outline',
    Writing:        'create-outline',
    Interview:      'people-outline',
    Profile:        'person-circle-outline',
    ForgotPassword: 'lock-open-outline',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={iconMap[name] ?? 'construct-outline'}
            size={40}
            color={C.accent}
          />
        </View>

        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>
          This screen is coming soon.{'\n'}
          Ask Claude to generate the code!
        </Text>

        {name === 'Profile' && (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => await supabase.auth.signOut()}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(21,101,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(21,101,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  logoutBtn: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});