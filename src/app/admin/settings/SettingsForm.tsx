'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSiteSettingsAction } from '@/lib/actions/settings.actions';
import type { SiteSettings } from '@/types';
import { Save, Loader2, Image as ImageIcon } from 'lucide-react';

export default function SettingsForm({ settings }: { settings: SiteSettings | null }) {
  const [isPending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateSiteSettingsAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Site settings updated successfully');
      }
    });
  };

  return (
    <form action={handleSave} className="space-y-6 max-w-2xl bg-white p-6 rounded-2xl shadow-card border border-border">
      
      {/* Site Logo */}
      <div className="space-y-3">
        <Label htmlFor="logo_url" className="text-sm font-semibold text-brand-navy flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand-coral" />
          Sitewide Logo URL
        </Label>
        <p className="text-xs text-brand-gray">Used in the auth pages and potentially other areas. Requires a valid image URL.</p>
        <Input
          id="logo_url"
          name="logo_url"
          type="url"
          defaultValue={settings?.logo_url ?? ''}
          placeholder="https://images.unsplash.com/..."
          className="h-11"
        />
      </div>

      <hr className="border-border" />

      {/* Favicon */}
      <div className="space-y-3">
        <Label htmlFor="favicon_url" className="text-sm font-semibold text-brand-navy flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand-coral" />
          Favicon URL
        </Label>
        <p className="text-xs text-brand-gray">Small icon shown in the browser tab (ideally 32x32 px).</p>
        <Input
          id="favicon_url"
          name="favicon_url"
          type="url"
          defaultValue={settings?.favicon_url ?? ''}
          placeholder="https://images.unsplash.com/..."
          className="h-11"
        />
      </div>

      <hr className="border-border" />

      {/* Auth Screen Image */}
      <div className="space-y-3">
        <Label htmlFor="auth_image_url" className="text-sm font-semibold text-brand-navy flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand-coral" />
          Auth Screen Right-Side Image URL
        </Label>
        <p className="text-xs text-brand-gray">The large banner image displayed on the login and register pages.</p>
        <Input
          id="auth_image_url"
          name="auth_image_url"
          type="url"
          defaultValue={settings?.auth_image_url ?? ''}
          placeholder="https://images.unsplash.com/..."
          className="h-11"
        />
      </div>

      <hr className="border-border" />

      {/* Allow Registration Toggle */}
      <div className="flex items-center justify-between p-4 bg-brand-canvas rounded-xl border border-border">
        <div className="space-y-1">
          <Label htmlFor="allow_registration" className="text-sm font-semibold text-brand-navy">
            Allow New Student Signups
          </Label>
          <p className="text-xs text-brand-gray">If disabled, the registration page will be blocked.</p>
        </div>
        <div className="flex items-center h-5">
          <input
            id="allow_registration"
            name="allow_registration"
            type="checkbox"
            value="true"
            defaultChecked={settings?.allow_registration ?? true}
            className="w-5 h-5 text-brand-coral border-border rounded focus:ring-brand-coral"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-brand-navy hover:bg-[#0A1F44] text-white h-11 px-6 rounded-lg font-medium shadow-md transition-colors"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </span>
          )}
        </Button>
      </div>

    </form>
  );
}
