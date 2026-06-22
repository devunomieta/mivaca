'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { signInSchema, signUpSchema } from '@/lib/validations/auth.schema';
import type { Role } from '@/types';

const ROLE_ROUTES: Record<Role, string> = {
  student: '/student',
  maintenance_officer: '/officer',
  admin: '/admin',
};

// -----------------------------------------------
// Sign In
// -----------------------------------------------
export async function signInAction(formData: FormData) {
  const supabase = await createClient();

  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const result = signInSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { data, error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { error: 'Invalid email or password. Please try again.' };
  }

  // Fetch role for redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id, roles(name)')
    .eq('id', data.user.id)
    .single();

  const roleName = (profile?.roles as { name: Role } | null)?.name ?? 'student';

  revalidatePath('/', 'layout');
  redirect(ROLE_ROUTES[roleName]);
}

// -----------------------------------------------
// Sign Up (Students/Staff only — officers created by admin)
// -----------------------------------------------
export async function signUpAction(formData: FormData) {
  const supabase = await createClient();

  const raw = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    department: formData.get('department') as string,
    phone: formData.get('phone') as string,
  };

  const result = signUpSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.full_name,
        role_id: 1, // student by default
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Registration failed. Please try again.' };
  }

  // Update additional profile fields
  await adminClient.from('profiles').update({
    department: result.data.department || null,
    phone: result.data.phone || null,
  }).eq('id', data.user.id);

  revalidatePath('/', 'layout');
  redirect('/student');
}

// -----------------------------------------------
// Sign Out
// -----------------------------------------------
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// -----------------------------------------------
// Get Current Session & Profile
// -----------------------------------------------
export async function getCurrentUser() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single();

  return profile ?? null;
}
