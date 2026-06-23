import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

import { getSiteSettingsAction } from '@/lib/actions/settings.actions';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsAction();
  
  return {
    title: {
      template: '%s | Miva Maintenance Portal',
      default: 'Miva Campus Maintenance & Service Request Platform',
    },
    description:
      'Submit, track, and manage campus maintenance requests for Miva Open University. Digitizing facilities management for students, staff, and maintenance officers.',
    keywords: ['Miva', 'maintenance', 'service requests', 'campus facilities', 'Open University'],
    authors: [{ name: 'Miva Open University — Facilities Management' }],
    openGraph: {
      title: 'Miva Campus Maintenance Portal',
      description: 'Digital campus maintenance management for Miva Open University.',
      type: 'website',
    },
    icons: {
      icon: settings?.favicon_url || '/favicon.ico',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-brand-canvas antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
