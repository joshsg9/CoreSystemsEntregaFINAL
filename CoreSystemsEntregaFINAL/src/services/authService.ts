// src/services/authService.ts
import { supabase } from '../lib/supabaseClient';
import type { User } from '../types';

const mapProfile = (profile: Record<string, unknown>): User => ({
  id:        profile.id as string,
  name:      (profile.full_name as string) ?? '',
  email:     profile.email as string,
  phone:     (profile.phone as string) ?? '',
  role:      (profile.role as 'buyer' | 'seller') ?? 'buyer',
  createdAt: profile.created_at as string,
});

export async function sendMagicLink(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error || !data.user) return { success: false, error: error?.message ?? 'Token inválido' };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) return { success: false, error: profileError.message };
  return { success: true, user: mapProfile(profile) };
}

export async function loginWithProvider(
  provider: 'google' | 'facebook'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function handleAuthCallback(): Promise<{ success: boolean; user?: User; error?: string }> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

  if (error || !data.session) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: error?.message ?? 'Sin sesión' };

    const user = await getCurrentUser();
    return user ? { success: true, user } : { success: false, error: 'Perfil no encontrado' };
  }

  const user = await getCurrentUser();
  return user ? { success: true, user } : { success: false, error: 'Perfil no encontrado' };
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile ? mapProfile(profile) : null;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function upgradeToSeller(
  userId: string,
  username: string,
  storeName: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'No autenticado' };

  const { data, error: rpcError } = await supabase.rpc('upgrade_to_seller', {
    p_user_id:    userId,
    p_username:   username,
    p_store_name: storeName,
  });
  if (rpcError) return { success: false, error: rpcError.message };
  if (!data?.success) return { success: false, error: data?.error ?? 'Error desconocido' };

  return { success: true };
}

export function validateIdentifier(value: string): string | null {
  if (!value.trim()) return 'Este campo es requerido.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Ingresa un email válido.';
  return null;
}