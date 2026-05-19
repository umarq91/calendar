'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ROUTES } from '@/constants/routes';

export type AuthActionResult = { error?: string };

function appUrl(origin: string | null) {
  return process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000';
}

export async function signUp(
  _prev: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  const full_name = String(formData.get('full_name') ?? '');

  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (password !== confirm) return { error: 'Passwords do not match.' };

  const h = await headers();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${appUrl(h.get('origin'))}${ROUTES.authCallback}`,
    },
  });
  if (error) return { error: error.message };
  redirect(ROUTES.checkEmail);
}

export async function signIn(
  _prev: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (error) return { error: error.message };
  const next = String(formData.get('next') ?? ROUTES.dashboard) || ROUTES.dashboard;
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.signIn);
}

export async function requestPasswordReset(
  _prev: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const h = await headers();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    String(formData.get('email') ?? ''),
    { redirectTo: `${appUrl(h.get('origin'))}${ROUTES.reset}` },
  );
  if (error) return { error: error.message };
  return {};
}

export async function updatePassword(
  _prev: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect(ROUTES.dashboard);
}
