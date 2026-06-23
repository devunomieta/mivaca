'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateSiteSettingsAction } from '@/lib/actions/settings.actions';
import type { SiteSettings } from '@/types';
import { Save, Loader2, Image as ImageIcon, Settings2, ShieldCheck, Palette } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';

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
    <form action={handleSave} className="space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Brand Assets */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="border-b border-border bg-brand-canvas/50 px-6 py-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-coral" />
              <h2 className="text-sm font-semibold text-brand-navy">Brand Identity</h2>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Site Logo */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-brand-navy flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-gray" />
                  Sitewide Logo
                </Label>
                <p className="text-xs text-brand-gray leading-relaxed mb-4">
                  Used in the auth pages and sidebar areas across the platform.
                </p>
                <ImageUpload
                  name="logo_url"
                  bucket="assets"
                  defaultValue={settings?.logo_url ?? ''}
                  label="Upload Logo"
                  aspectRatio="auto"
                />
              </div>

              <hr className="border-border" />

              {/* Favicon */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-brand-navy flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-gray" />
                  Browser Favicon
                </Label>
                <p className="text-xs text-brand-gray leading-relaxed mb-4">
                  Small icon shown in the browser tab. Use a perfectly square image (e.g. 32x32 px).
                </p>
                <ImageUpload
                  name="favicon_url"
                  bucket="assets"
                  defaultValue={settings?.favicon_url ?? ''}
                  label="Upload Favicon"
                  aspectRatio="square"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: System Config */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="border-b border-border bg-brand-canvas/50 px-6 py-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-brand-coral" />
              <h2 className="text-sm font-semibold text-brand-navy">Display Settings</h2>
            </div>
            
            <div className="p-6">
              {/* Auth Screen Image */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-brand-navy flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-gray" />
                  Auth Screen Background
                </Label>
                <p className="text-xs text-brand-gray leading-relaxed mb-4">
                  The large banner image displayed on the right side of the login and register pages.
                </p>
                <ImageUpload
                  name="auth_image_url"
                  bucket="assets"
                  defaultValue={settings?.auth_image_url ?? ''}
                  label="Upload Background"
                  aspectRatio="video"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="border-b border-border bg-brand-canvas/50 px-6 py-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-coral" />
              <h2 className="text-sm font-semibold text-brand-navy">System Configuration</h2>
            </div>
            
            <div className="p-6">
              {/* Allow Registration Toggle */}
              <div className="flex items-center justify-between">
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
            </div>
          </div>

        </div>
      </div>

      <div className="pt-6 mt-8 border-t border-border flex justify-end">
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-brand-navy hover:bg-[#0A1F44] text-white h-11 px-6 rounded-xl font-medium shadow-lg transition-all hover:shadow-xl"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </span>
          )}
        </Button>
      </div>

    </form>
  );
}
