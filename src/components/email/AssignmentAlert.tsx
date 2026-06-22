import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Button, Preview,
} from '@react-email/components';

interface AssignmentAlertProps {
  officerName: string;
  requestTitle: string;
  requesterName: string;
  location: string;
  priority: string;
  category: string;
  assignedAt: string;
  notes?: string;
  appUrl: string;
}

export function AssignmentAlertEmail({
  officerName, requestTitle, requesterName, location, priority, category, assignedAt, notes, appUrl,
}: AssignmentAlertProps) {
  const priorityColor = priority === 'critical' ? '#DC2626' : priority === 'high' ? '#FF5A36' : priority === 'medium' ? '#F59E0B' : '#10B981';

  return (
    <Html lang="en">
      <Head />
      <Preview>New task assigned to you — {requestTitle}</Preview>
      <Body style={{ backgroundColor: '#F8F9FA', fontFamily: "'Inter', sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden' }}>
          <Section style={{ backgroundColor: '#051026', padding: '32px 40px' }}>
            <Heading style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 }}>Miva Open University</Heading>
            <Text style={{ color: '#6C757D', fontSize: '13px', margin: '4px 0 0' }}>Facilities & Maintenance Portal</Text>
          </Section>

          <Section style={{ padding: '40px' }}>
            <Section style={{ backgroundColor: '#FF5A36', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <Text style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600', margin: 0, textAlign: 'center' }}>
                NEW TASK ASSIGNED
              </Text>
            </Section>

            <Heading as="h2" style={{ color: '#051026', fontSize: '22px', fontWeight: '700', margin: '0 0 16px' }}>
              Hi {officerName},
            </Heading>
            <Text style={{ color: '#374151', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px' }}>
              A new maintenance request has been assigned to you. Please review the details below and begin work as soon as possible.
            </Text>

            <Section style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '24px', margin: '0 0 24px' }}>
              <Text style={{ color: '#051026', fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
                {requestTitle}
              </Text>
              {[
                ['Submitted By', requesterName],
                ['Category', category],
                ['Location', location],
                ['Assigned On', assignedAt],
              ].map(([label, value]) => (
                <Section key={label} style={{ margin: '8px 0', display: 'flex' }}>
                  <Text style={{ color: '#6C757D', fontSize: '12px', fontWeight: '600', margin: 0 }}>{label}</Text>
                  <Text style={{ color: '#051026', fontSize: '14px', margin: '2px 0 0' }}>{value}</Text>
                </Section>
              ))}
              <Section style={{ margin: '8px 0' }}>
                <Text style={{ color: '#6C757D', fontSize: '12px', fontWeight: '600', margin: 0 }}>Priority</Text>
                <Text style={{ color: priorityColor, fontSize: '14px', fontWeight: '700', margin: '2px 0 0' }}>
                  {priority.toUpperCase()}
                </Text>
              </Section>
              {notes && (
                <Section style={{ margin: '16px 0 0', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                  <Text style={{ color: '#6C757D', fontSize: '12px', fontWeight: '600', margin: '0 0 4px' }}>Admin Notes</Text>
                  <Text style={{ color: '#374151', fontSize: '14px', margin: 0 }}>{notes}</Text>
                </Section>
              )}
            </Section>

            <Button style={{ backgroundColor: '#FF5A36', color: '#FFFFFF', borderRadius: '8px', padding: '14px 28px', fontWeight: '600', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
              href={`${appUrl}/officer`}>
              View My Tasks
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
