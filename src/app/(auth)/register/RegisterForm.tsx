'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signUpAction } from '@/lib/actions/auth.actions';

const initialState = { error: null as string | null };

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result = await signUpAction(formData);
      return result ?? initialState;
    },
    initialState
  );
  
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full animate-fade-in flex flex-col items-center">
      <h2 className="text-[28px] font-bold text-[#1A2E44] mb-2 text-center">Create Account</h2>
      <p className="text-[#8492A6] text-sm font-medium text-center mb-8">Fill in your details to get started</p>

      {state?.error && (
        <div
          id="register-error"
          role="alert"
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
        >
          <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs flex-shrink-0 font-bold">!</span>
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4" id="register-form">
        <div>
          <div className="relative">
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Full Name"
              className="w-full px-4 h-[46px] bg-[#EEF2FA] border-transparent rounded-lg text-[#1A2E44] placeholder:text-[#8492A6] focus:border-[#BE9C79] focus:ring-[#BE9C79] transition-colors outline-none"
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
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
              autoComplete="new-password"
              required
              placeholder="Password (min 8 chars)"
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
        </div>

        <button
          id="btn-register"
          type="submit"
          disabled={pending}
          className="w-full h-[46px] mt-4 bg-[#BE9C79] hover:bg-[#a68665] text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[#8492A6] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#BE9C79] font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
