import type { Metadata } from 'next';
import { getSiteSettingsAction } from '@/lib/actions/settings.actions';
import AuthLogo from '@/components/auth/AuthLogo';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to the Miva Campus Maintenance Portal',
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsAction();
  const authImageUrl = settings?.auth_image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=1600&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-white flex">
      
      {/* Left panel — form (White Canvas) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white relative">
        <div className="w-full max-w-[380px]">
          <AuthLogo />
          {children}
        </div>
      </div>

      {/* Right panel — image */}
      <div className="hidden lg:flex w-1/2 p-6 bg-white">
        <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${authImageUrl})` }}
          />
          {/* Dark Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Bottom Content */}
          <div className="absolute bottom-0 left-0 w-full p-12 text-white">
            <h1 className="text-5xl font-bold leading-tight mb-4 tracking-tight drop-shadow-md">
              Learn with<br />Miva Open University
            </h1>
            <p className="text-lg text-white/90 mb-8 max-w-md drop-shadow-sm font-medium">
              Affordable higher education you can take wherever life takes you. Learn anywhere at your own pace.
            </p>

            {/* Glassmorphism License Box */}
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 flex items-center gap-4 w-full max-w-lg shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-white text-sm leading-relaxed font-medium">
                Miva Open University is licensed by the National Universities Commission
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
