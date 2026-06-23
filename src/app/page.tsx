import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/types';

const ROLE_ROUTES: Record<Role, string> = {
  student: '/student',
  maintenance_officer: '/officer',
  admin: '/admin',
};

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  const role = (profile?.roles as unknown as { name: Role } | null)?.name ?? 'student';
  redirect(ROLE_ROUTES[role]);
}
