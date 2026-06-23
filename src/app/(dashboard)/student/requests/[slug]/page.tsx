import { RequestDetailsView } from '@/components/dashboard/RequestDetailsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Request Details | Miva Maintenance',
};

type Params = { params: Promise<{ slug: string }> };

export default async function StudentRequestDetailsPage({ params }: Params) {
  const { slug } = await params;
  return <RequestDetailsView slug={slug} role="student" />;
}
