'use server';

import { Resend } from 'resend';
import { render } from '@react-email/render';
import { adminClient } from '@/lib/supabase/admin';
import { RequestConfirmationEmail } from '@/components/email/RequestConfirmation';
import { AssignmentAlertEmail } from '@/components/email/AssignmentAlert';
import { StatusUpdateAlertEmail } from '@/components/email/StatusUpdateAlert';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@miva.edu.ng';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// -----------------------------------------------
// Trigger 1: Request Submission Confirmation
// -----------------------------------------------
export async function sendRequestConfirmation(requestId: string) {
  try {
    const { data: request } = await adminClient
      .from('service_requests')
      .select('*, profiles(*), request_categories(name)')
      .eq('id', requestId)
      .single();

    if (!request) return { error: 'Request not found' };

    const html = await render(RequestConfirmationEmail({
      studentName: request.profiles?.full_name ?? 'Student',
      requestTitle: request.title,
      referenceId: request.id.slice(0, 8).toUpperCase(),
      category: request.request_categories?.name ?? '',
      location: request.location,
      priority: request.priority.charAt(0).toUpperCase() + request.priority.slice(1),
      submittedAt: formatDate(request.created_at),
      appUrl: APP_URL,
    }));

    const { error } = await resend.emails.send({
      from: `Miva Maintenance Portal <${FROM}>`,
      to: [request.profiles?.email ?? ''],
      subject: `Request Received — Ref #${request.id.slice(0, 8).toUpperCase()}`,
      html,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    console.error('[Email] sendRequestConfirmation error:', err);
    return { error: 'Failed to send confirmation email' };
  }
}

// -----------------------------------------------
// Trigger 2: Assignment Alert to Officer
// -----------------------------------------------
export async function sendAssignmentAlert(requestId: string, officerId: string) {
  try {
    const [{ data: request }, { data: officer }] = await Promise.all([
      adminClient
        .from('service_requests')
        .select('*, profiles(*), request_categories(name)')
        .eq('id', requestId)
        .single(),
      adminClient.from('profiles').select('*').eq('id', officerId).single(),
    ]);

    if (!request || !officer) return { error: 'Request or officer not found' };

    // Fetch latest assignment notes
    const { data: assignment } = await adminClient
      .from('assignments')
      .select('notes, assigned_at')
      .eq('request_id', requestId)
      .eq('officer_id', officerId)
      .single();

    const html = await render(AssignmentAlertEmail({
      officerName: officer.full_name,
      requestTitle: request.title,
      requesterName: request.profiles?.full_name ?? '',
      location: request.location,
      priority: request.priority.charAt(0).toUpperCase() + request.priority.slice(1),
      category: request.request_categories?.name ?? '',
      assignedAt: formatDate(assignment?.assigned_at ?? new Date().toISOString()),
      notes: assignment?.notes ?? undefined,
      appUrl: APP_URL,
    }));

    const { error } = await resend.emails.send({
      from: `Miva Maintenance Portal <${FROM}>`,
      to: [officer.email],
      subject: `New Task Assigned: ${request.title}`,
      html,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    console.error('[Email] sendAssignmentAlert error:', err);
    return { error: 'Failed to send assignment alert' };
  }
}

// -----------------------------------------------
// Trigger 3: Status Update Alert to Student
// -----------------------------------------------
export async function sendStatusUpdateAlert(
  requestId: string,
  newStatus: string,
  oldStatus: string,
  remarks?: string,
  officerName?: string
) {
  try {
    const { data: request } = await adminClient
      .from('service_requests')
      .select('*, profiles(*)')
      .eq('id', requestId)
      .single();

    if (!request) return { error: 'Request not found' };

    const html = await render(StatusUpdateAlertEmail({
      studentName: request.profiles?.full_name ?? 'Student',
      requestTitle: request.title,
      oldStatus,
      newStatus,
      officerName,
      remarks,
      updatedAt: formatDate(new Date().toISOString()),
      appUrl: APP_URL,
    }));

    const { error } = await resend.emails.send({
      from: `Miva Maintenance Portal <${FROM}>`,
      to: [request.profiles?.email ?? ''],
      subject: `Request Update — ${request.title}`,
      html,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    console.error('[Email] sendStatusUpdateAlert error:', err);
    return { error: 'Failed to send status update email' };
  }
}
