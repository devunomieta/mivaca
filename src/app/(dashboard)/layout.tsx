import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
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

  return (
    <div className="flex h-screen bg-brand-canvas overflow-hidden">
      <Sidebar profile={profile as any} />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
