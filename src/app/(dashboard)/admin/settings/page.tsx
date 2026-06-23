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
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Site Settings</h1>
          <p className="text-brand-gray text-sm mt-0.5">
            Update global platform assets, branding, and images.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
