import { adminClient } from '@/lib/supabase/admin';
import { sendRequestConfirmation } from '@/lib/actions/email.actions';

export type NotificationType = 'request_created' | 'request_assigned' | 'status_updated';

export interface DispatchNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  sendEmail?: boolean;
  requestId?: string; // Used to fetch request details for the email if needed
}

export async function dispatchNotification({
  userId,
  title,
  message,
  type,
  link,
  sendEmail = false,
  requestId
}: DispatchNotificationParams) {
  try {
    // 1. Insert In-App Notification
    const { error } = await adminClient.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      link,
    });

    if (error) {
      console.error('Failed to insert in-app notification:', error);
    }

    // 2. Dispatch Email if requested
    if (sendEmail && requestId) {
      // We can use the existing email action, or in the future build custom templates per type
      await sendRequestConfirmation(requestId).catch((err) => {
        console.error('Failed to dispatch email notification:', err);
      });
    }

  } catch (error) {
    console.error('Notification Dispatcher Error:', error);
  }
}
