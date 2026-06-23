'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfileAction } from '@/lib/actions/profile.actions';
import type { Profile } from '@/types';
import { Save, Loader2, User, Building, Phone, Mail } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Profile updated successfully');
      }
    });
  };

  return (
    <form action={handleSave} className="space-y-6 max-w-2xl">
      
      {/* Avatar */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-brand-navy flex items-center gap-2">
          <User className="w-4 h-4 text-brand-coral" />
          Profile Picture
        </Label>
        <ImageUpload
          name="avatar_url"
          bucket="avatars"
          defaultValue={profile.avatar_url ?? ''}
          label="Upload Avatar"
          aspectRatio="square"
          className="max-w-[160px]"
        />
      </div>

      <hr className="border-border" />

      {/* Account Info (Read-only) */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-brand-navy flex items-center gap-2">
          <Mail className="w-4 h-4 text-brand-coral" />
          Email Address
        </Label>
        <Input
          type="email"
          value={profile.email}
          disabled
          className="h-11 bg-brand-canvas text-brand-gray cursor-not-allowed"
        />
        <p className="text-xs text-brand-gray">Your email address cannot be changed.</p>
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-3">
          <Label htmlFor="full_name" className="text-sm font-semibold text-brand-navy flex items-center gap-2">
            <User className="w-4 h-4 text-brand-coral" />
            Full Name
          </Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name}
            required
            className="h-11"
          />
        </div>

        {/* Phone */}
        <div className="space-y-3">
          <Label htmlFor="phone" className="text-sm font-semibold text-brand-navy flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand-coral" />
            Phone Number
          </Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={profile.phone ?? ''}
            className="h-11"
          />
        </div>
      </div>

      {/* Department */}
      <div className="space-y-3">
        <Label htmlFor="department" className="text-sm font-semibold text-brand-navy flex items-center gap-2">
          <Building className="w-4 h-4 text-brand-coral" />
          Department / Faculty
        </Label>
        <Input
          id="department"
          name="department"
          defaultValue={profile.department ?? ''}
          className="h-11"
        />
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
              Save Changes
            </span>
          )}
        </Button>
      </div>

    </form>
  );
}
