import { RequestDetailsView } from '@/components/dashboard/RequestDetailsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Task Details | Miva Maintenance',
};

type Params = { params: Promise<{ slug: string }> };

export default async function OfficerRequestDetailsPage({ params }: Params) {
  const { slug } = await params;
  return <RequestDetailsView slug={slug} role="maintenance_officer" />;
}
