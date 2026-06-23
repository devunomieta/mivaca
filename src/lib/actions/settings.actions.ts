'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { SiteSettings } from '@/types';

export async function getSiteSettingsAction(): Promise<SiteSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching site settings:', error);
    // Return a default fallback if DB isn't seeded or has an error
    return {
      id: 'default',
      logo_url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop&q=80',
      favicon_url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=32&h=32&fit=crop&q=80',
      auth_image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=1600&fit=crop&q=80',
      allow_registration: true,
      updated_at: new Date().toISOString(),
    };
  }

  return data as SiteSettings;
}

export async function updateSiteSettingsAction(formData: FormData) {
  const supabase = await createClient();

  // Verify Admin Role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', user.id)
    .single();

  if (profile?.role_id !== 3) {
    return { error: 'Forbidden' };
  }

  const logo_url = formData.get('logo_url') as string;
  const favicon_url = formData.get('favicon_url') as string;
  const auth_image_url = formData.get('auth_image_url') as string;
  const allow_registration = formData.get('allow_registration') === 'true';

  const { error } = await supabase
    .from('site_settings')
    .update({ logo_url, favicon_url, auth_image_url, allow_registration, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update the single row

  if (error) {
    console.error('Error updating site settings:', error);
    return { error: 'Failed to update settings' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
