import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Button,
  Img,
  Preview,
} from '@react-email/components';

interface RequestConfirmationProps {
  studentName: string;
  requestTitle: string;
  referenceId: string;
  category: string;
  location: string;
  priority: string;
  submittedAt: string;
  appUrl: string;
}

export function RequestConfirmationEmail({
  studentName,
  requestTitle,
  referenceId,
  category,
  location,
  priority,
  submittedAt,
  appUrl,
}: RequestConfirmationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your maintenance request has been received — Ref #{referenceId}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={logoText}>Miva Open University</Heading>
            <Text style={headerSubtitle}>Facilities & Maintenance Portal</Text>
          </Section>

          {/* Body */}
          <Section style={contentStyle}>
            <Heading as="h2" style={heading2}>
              Request Received
            </Heading>
            <Text style={paragraph}>Dear {studentName},</Text>
            <Text style={paragraph}>
              Your maintenance request has been successfully submitted and is now in our
              system. Our facilities team will review it and assign a maintenance officer
              shortly.
            </Text>

            {/* Reference Card */}
            <Section style={cardStyle}>
              <Text style={cardLabel}>Reference Number</Text>
              <Text style={refNumber}>#{referenceId}</Text>
            </Section>

            {/* Details */}
            <Section style={detailsBox}>
              <DetailRow label="Title" value={requestTitle} />
              <DetailRow label="Category" value={category} />
              <DetailRow label="Location" value={location} />
              <DetailRow label="Priority" value={priority} />
              <DetailRow label="Submitted" value={submittedAt} />
            </Section>

            <Text style={paragraph}>
              You will receive email notifications when your request is assigned to a
              maintenance officer and when work is completed.
            </Text>

            <Button style={buttonStyle} href={`${appUrl}/student`}>
              Track My Request
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerStyle}>
            <Text style={footerText}>
              This is an automated message from Miva Open University Maintenance Portal.
              Please do not reply to this email.
            </Text>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Miva Open University. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Section style={detailRow}>
      <Text style={detailLabel}>{label}:</Text>
      <Text style={detailValue}>{value}</Text>
    </Section>
  );
}

// Styles
const bodyStyle = { backgroundColor: '#F8F9FA', fontFamily: "'Inter', sans-serif", margin: 0 };
const containerStyle = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden' };
const headerStyle = { backgroundColor: '#051026', padding: '32px 40px' };
const logoText = { color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 };
const headerSubtitle = { color: '#6C757D', fontSize: '13px', margin: '4px 0 0' };
const contentStyle = { padding: '40px' };
const heading2 = { color: '#051026', fontSize: '24px', fontWeight: '700', margin: '0 0 16px' };
const paragraph = { color: '#374151', fontSize: '15px', lineHeight: '1.6', margin: '0 0 16px' };
const cardStyle = { backgroundColor: '#051026', borderRadius: '8px', padding: '20px', textAlign: 'center' as const, margin: '24px 0' };
const cardLabel = { color: '#6C757D', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: 0 };
const refNumber = { color: '#FF5A36', fontSize: '28px', fontWeight: '700', margin: '8px 0 0' };
const detailsBox = { backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '20px', margin: '24px 0' };
const detailRow = { margin: '8px 0' };
const detailLabel = { color: '#6C757D', fontSize: '12px', fontWeight: '600', margin: 0, display: 'inline' };
const detailValue = { color: '#051026', fontSize: '14px', margin: '0 0 0 8px', display: 'inline' };
const buttonStyle = { backgroundColor: '#FF5A36', color: '#FFFFFF', borderRadius: '8px', padding: '14px 28px', fontWeight: '600', fontSize: '15px', textDecoration: 'none', display: 'inline-block', margin: '16px 0' };
const divider = { borderColor: '#E5E7EB', margin: '0 40px' };
const footerStyle = { padding: '24px 40px' };
const footerText = { color: '#6C757D', fontSize: '12px', lineHeight: '1.5', margin: '0 0 4px' };
