import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { getSiteSettingsAction } from '@/lib/actions/settings.actions';
import type { Metadata } from 'next';
import type { Role } from '@/types';

export const metadata: Metadata = {
  title: {
    template: '%s | Miva Maintenance Portal',
    default: 'Dashboard | Miva Maintenance Portal',
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const settings = await getSiteSettingsAction();

  return (
    <DashboardShell profile={profile as any} settings={settings}>
      {children}
    </DashboardShell>
  );
}
