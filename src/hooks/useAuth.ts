import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const session      = useAuthStore(s => s.session);
  const user         = useAuthStore(s => s.user);
  const loading      = useAuthStore(s => s.loading);
  const storeSignOut = useAuthStore(s => s.signOut);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });
    return error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email:    email.trim().toLowerCase(),
      password,
      options:  { data: { full_name: fullName } },
    });
    return error;
  };

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase()
    );
    return error;
  };

  return {
    session,
    user,
    loading,
    isAuthenticated: session !== null,
    signIn,
    signUp,
    forgotPassword,
    signOut: storeSignOut,
  };
}
