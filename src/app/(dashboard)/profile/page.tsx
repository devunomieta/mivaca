import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Manage your account settings and profile information.',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="text-brand-gray text-sm mt-0.5">
            Update your personal details and avatar.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
