import { getSiteSettingsAction } from '@/lib/actions/settings.actions';
import RegisterForm from './RegisterForm';
import Link from 'next/link';

export const metadata = {
  title: 'Register',
  description: 'Create a new account',
};

export default async function RegisterPage() {
  const settings = await getSiteSettingsAction();

  if (!settings?.allow_registration) {
    return (
      <div className="w-full flex flex-col items-center text-center animate-fade-in p-6 bg-red-50 rounded-xl border border-red-100">
        <span className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl mb-4 font-bold">!</span>
        <h2 className="text-xl font-bold text-red-800 mb-2">No New Signups</h2>
        <p className="text-red-600 text-sm mb-6">
          Registration is currently disabled by the administrator. Please contact your IT support or Administration office if you need an account.
        </p>
        <Link href="/login" className="text-brand-navy bg-white border border-border px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">
          Return to Login
        </Link>
      </div>
    );
  }

  return <RegisterForm />;
}
