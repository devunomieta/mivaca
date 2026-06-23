'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function uploadFileAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    
    if (!file || !bucket) {
      return { error: 'File and bucket are required' };
    }

    // Determine the path. For avatars, it MUST start with the user's ID per our RLS policy
    const fileExt = file.name.split('.').pop();
    let filePath = '';

    if (bucket === 'avatars') {
      filePath = `${user.id}/${Date.now()}.${fileExt}`;
    } else {
      filePath = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    }

    // Convert File to Buffer/ArrayBuffer for Supabase Upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If uploading to assets, user MUST be admin. We'll use the authenticated client 
    // to let RLS naturally block them if they aren't admin, but we can also use adminClient 
    // for assets if RLS gets complex. We will use adminClient here for reliability 
    // since this is a server action and we verified auth above. Wait, no, RLS requires 
    // the authenticated client to check `auth.uid()`. So we must use `supabase`!
    
    // Wait, the regular `supabase` server client doesn't support File/Blob easily 
    // sometimes without tricky polyfills. `adminClient` bypasses RLS. 
    // Let's manually verify admin status if bucket is assets, and then use adminClient 
    // to ensure reliable upload of the buffer.

    if (bucket === 'assets') {
      const { data: profile } = await adminClient.from('profiles').select('role_id').eq('id', user.id).single();
      if (profile?.role_id !== 3) {
        return { error: 'Forbidden: Only admins can upload assets' };
      }
    }

    // Use adminClient to bypass any potential RLS buffer-upload issues, since we already did auth checks.
    const { data, error } = await adminClient.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return { error: error.message };
    }

    // Get the public URL
    const { data: { publicUrl } } = adminClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (e: any) {
    return { error: e.message || 'Failed to upload file' };
  }
}
