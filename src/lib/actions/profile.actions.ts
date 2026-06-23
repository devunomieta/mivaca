'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function updateProfileAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const full_name = formData.get('full_name') as string;
    const phone = formData.get('phone') as string;
    const department = formData.get('department') as string;
    const avatar_url = formData.get('avatar_url') as string;

    if (!full_name) {
      return { error: 'Full name is required' };
    }

    // We can use the standard authenticated client to update the profile since RLS allows it
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
        department,
        avatar_url,
      })
      .eq('id', user.id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update profile' };
  }
}
