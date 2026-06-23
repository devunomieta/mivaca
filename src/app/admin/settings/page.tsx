import { Metadata } from 'next';
import { getSiteSettingsAction } from '@/lib/actions/settings.actions';
import SettingsForm from './SettingsForm';

export const metadata: Metadata = {
  title: 'Site Settings',
  description: 'Manage global configuration like logos and auth images.',
};

export default async function AdminSettingsPage() {
  const settings = await getSiteSettingsAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-brand-navy tracking-tight">Site Settings</h1>
        <p className="text-brand-gray text-sm">
          Update global platform assets, branding, and images.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
