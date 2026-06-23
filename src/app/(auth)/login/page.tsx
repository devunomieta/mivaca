'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInAction } from '@/lib/actions/auth.actions';

const initialState = { error: null as string | null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result = await signInAction(formData);
      return result ?? initialState;
    },
    initialState
  );
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillDemoAccount = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Admin@Miva1234'); // Passwords are the same for all demo accounts or just pass the generic one
    if (roleEmail.includes('student')) setPassword('Student@Miva1234');
    if (roleEmail.includes('officer')) setPassword('Officer@Miva1234');
  };

  return (
    <div className="w-full animate-fade-in">
      {state?.error && (
        <div
          id="login-error"
          role="alert"
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
        >
          <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs flex-shrink-0 font-bold">!</span>
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4" id="login-form">
        <div>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@miva.edu.ng"
              className="w-full px-4 h-[46px] bg-[#EEF2FA] border-transparent rounded-lg text-[#1A2E44] placeholder:text-[#8492A6] focus:border-[#BE9C79] focus:ring-[#BE9C79] transition-colors outline-none"
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-4 pr-10 h-[46px] bg-[#EEF2FA] border-transparent rounded-lg text-[#1A2E44] placeholder:text-[#8492A6] focus:border-[#BE9C79] focus:ring-[#BE9C79] transition-colors outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8492A6] hover:text-[#1A2E44] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end mt-2">
            <a href="#" className="text-xs text-[#5C6B89] hover:text-[#BE9C79] transition-colors">
              Forgot Password?
            </a>
          </div>
        </div>

        <button
          id="btn-login"
          type="submit"
          disabled={pending}
          className="w-full h-[46px] mt-2 bg-[#BE9C79] hover:bg-[#a68665] text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </span>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[#8492A6] mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#BE9C79] font-medium hover:underline">
          Create one
        </Link>
      </p>

      {/* Demo Accounts - Click to Fill */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-[11px] uppercase tracking-wider text-[#8492A6] text-center mb-4 font-semibold">
          Click to Fill Demo Account
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            type="button" 
            onClick={() => fillDemoAccount('student@miva.edu.ng')}
            className="px-5 py-2 rounded-lg bg-[#EEF2FA]/50 hover:bg-[#EEF2FA] border border-transparent hover:border-[#BE9C79]/30 transition-all text-sm font-semibold text-[#1A2E44]"
          >
            Student
          </button>
          
          <button 
            type="button" 
            onClick={() => fillDemoAccount('officer@miva.edu.ng')}
            className="px-5 py-2 rounded-lg bg-[#EEF2FA]/50 hover:bg-[#EEF2FA] border border-transparent hover:border-[#BE9C79]/30 transition-all text-sm font-semibold text-[#1A2E44]"
          >
            Officer
          </button>
          
          <button 
            type="button" 
            onClick={() => fillDemoAccount('admin@miva.edu.ng')}
            className="px-5 py-2 rounded-lg bg-[#EEF2FA]/50 hover:bg-[#EEF2FA] border border-transparent hover:border-[#BE9C79]/30 transition-all text-sm font-semibold text-[#1A2E44]"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
