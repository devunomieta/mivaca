import Image from 'next/image';
import { getSiteSettingsAction } from '@/lib/actions/settings.actions';
import { GraduationCap } from 'lucide-react';

export default async function AuthLogo() {
  const settings = await getSiteSettingsAction();
  
  return (
    <div className="flex flex-col items-center justify-center mb-8">
      {settings?.logo_url ? (
        <div className="relative w-48 h-12 mb-6">
          <Image 
            src={settings.logo_url} 
            alt="Site Logo" 
            fill 
            className="object-contain"
            priority
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-6 text-[#1A2E44]">
          <GraduationCap className="w-10 h-10 text-[#BE9C79]" />
          <span className="text-2xl font-bold tracking-tight">MIVA</span>
          <span className="text-xs tracking-widest mt-1 opacity-70">OPEN UNIVERSITY</span>
        </div>
      )}
      <h2 className="text-[28px] font-bold text-[#1A2E44] mb-2">Log In</h2>
      <p className="text-[#8492A6] text-sm font-medium">Enter your account details</p>
    </div>
  );
}
