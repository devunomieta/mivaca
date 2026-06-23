import { CategoryManager } from '@/components/dashboard/CategoryManager';
import SettingsForm from './SettingsForm';
import { getSiteSettingsAction } from '@/lib/actions/settings.actions';
import type { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Site Settings | Miva Maintenance',
  description: 'Manage global configuration like logos, categories, and auth images.',
};

export default async function AdminSettingsPage() {
  const settings = await getSiteSettingsAction();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-brand-navy tracking-tight">Site Settings</h1>
        <p className="text-brand-gray mt-2 text-base">Manage global application configurations, branding, and data categories.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-brand-canvas/50 border border-border p-1 rounded-xl mb-8 w-full sm:w-auto inline-flex">
          <TabsTrigger value="general" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-brand-coral data-[state=active]:shadow-sm">General & Branding</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-brand-coral data-[state=active]:shadow-sm">Request Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0 outline-none animate-fade-in">
          <SettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="categories" className="mt-0 outline-none animate-fade-in">
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm">
            <div className="mb-6 border-b border-border pb-4">
              <h2 className="text-lg font-semibold text-brand-navy">Request Categories</h2>
              <p className="text-brand-gray text-sm mt-1">Manage the types of issues students can report.</p>
            </div>
            <CategoryManager />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
