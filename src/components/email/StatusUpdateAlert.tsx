import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Button, Preview,
} from '@react-email/components';

interface StatusUpdateAlertProps {
  studentName: string;
  requestTitle: string;
  oldStatus: string;
  newStatus: string;
  officerName?: string;
  remarks?: string;
  updatedAt: string;
  appUrl: string;
  requestId: number | string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  assigned: 'Assigned to Officer',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  assigned: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#6C757D',
};

export function StatusUpdateAlertEmail({
  studentName, requestTitle, oldStatus, newStatus, officerName, remarks, updatedAt, appUrl, requestId
}: StatusUpdateAlertProps) {
  const statusColor = STATUS_COLORS[newStatus] ?? '#051026';
  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;

  return (
    <Html lang="en">
      <Head />
      <Preview>Update on your request: {requestTitle} — Now {statusLabel}</Preview>
      <Body style={{ backgroundColor: '#F8F9FA', fontFamily: "'Inter', sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden' }}>
          <Section style={{ backgroundColor: '#051026', padding: '32px 40px' }}>
            <Heading style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 }}>Miva Open University</Heading>
            <Text style={{ color: '#6C757D', fontSize: '13px', margin: '4px 0 0' }}>Facilities & Maintenance Portal</Text>
          </Section>

          <Section style={{ padding: '40px' }}>
            <Heading as="h2" style={{ color: '#051026', fontSize: '22px', fontWeight: '700', margin: '0 0 16px' }}>
              Request Status Update
            </Heading>
            <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px' }}>
              Dear {studentName}, the status of your maintenance request has been updated.
            </Text>

            <Section style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '24px', margin: '0 0 24px' }}>
              <Text style={{ color: '#051026', fontSize: '16px', fontWeight: '700', margin: '0 0 20px' }}>
                {requestTitle}
              </Text>

              {/* Status transition */}
              <Section style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px' }}>
                <Text style={{ color: '#6C757D', fontSize: '13px', margin: 0 }}>
                  {STATUS_LABELS[oldStatus] ?? oldStatus}
                </Text>
                <Text style={{ color: '#6C757D', fontSize: '18px', margin: '0 8px' }}>—</Text>
                <Text style={{ color: statusColor, fontSize: '15px', fontWeight: '700', backgroundColor: `${statusColor}18`, padding: '4px 12px', borderRadius: '20px', margin: 0 }}>
                  {statusLabel}
                </Text>
              </Section>

              {officerName && (
                <Section style={{ margin: '8px 0' }}>
                  <Text style={{ color: '#6C757D', fontSize: '12px', fontWeight: '600', margin: 0 }}>Handled By</Text>
                  <Text style={{ color: '#051026', fontSize: '14px', margin: '2px 0 0' }}>{officerName}</Text>
                </Section>
              )}
              <Section style={{ margin: '8px 0' }}>
                <Text style={{ color: '#6C757D', fontSize: '12px', fontWeight: '600', margin: 0 }}>Updated At</Text>
                <Text style={{ color: '#051026', fontSize: '14px', margin: '2px 0 0' }}>{updatedAt}</Text>
              </Section>
              {remarks && (
                <Section style={{ margin: '16px 0 0', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                  <Text style={{ color: '#6C757D', fontSize: '12px', fontWeight: '600', margin: '0 0 4px' }}>Officer Remarks</Text>
                  <Text style={{ color: '#374151', fontSize: '14px', fontStyle: 'italic', margin: 0 }}>"{remarks}"</Text>
                </Section>
              )}
            </Section>

            {newStatus === 'completed' && (
              <Section style={{ backgroundColor: '#DCFCE7', borderRadius: '8px', padding: '16px', margin: '0 0 24px' }}>
                <Text style={{ color: '#166534', fontSize: '14px', fontWeight: '600', margin: 0, textAlign: 'center' }}>
                  Your request has been resolved. Thank you for your patience!
                </Text>
              </Section>
            )}

            <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px' }}>
              Log in to the portal to view the latest updates on your request and communicate directly with the team.
            </Text>
            <Button style={{ backgroundColor: '#FF5A36', color: '#FFFFFF', borderRadius: '8px', padding: '14px 28px', fontWeight: '600', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
              href={`${appUrl}/student/requests/${requestId}`}>
              View Request Details
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E5E7EB', margin: '0 40px' }} />
          <Section style={{ padding: '24px 40px' }}>
            <Text style={{ color: '#6C757D', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
              This is an automated message from Miva Open University Maintenance Portal. &copy; {new Date().getFullYear()} Miva Open University.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
