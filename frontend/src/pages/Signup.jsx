import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { supabase } from '../lib/supabase';
import { signupSchema } from '../schemas/signup.schema';
import { handleError } from '../utilities/errorHandler';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Check if email confirmation is required
      if (signUpData?.user?.identities?.length === 0) {
        toast.error('An account with this email already exists. Please log in instead.');
        return;
      }

      if (signUpData?.session) {
        // Auto-confirmed - create profile and navigate to role selection
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          full_name: data.name,
        });
        toast.success('Account created successfully');
        navigate('/role-selection');
      } else {
        // Email confirmation required
        toast.success('Check your email for the confirmation link to complete your account setup.');
      }
      reset();
    } catch (err) {
      handleError(err, 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            placeholder="John Doe"
            className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.name
              ? 'border-red-300 focus:ring-red-500/20 text-red-900 placeholder-red-300'
              : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.email
              ? 'border-red-300 focus:ring-red-500/20 text-red-900 placeholder-red-300'
              : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register('password')}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.password
                ? 'border-red-300 focus:ring-red-500/20 text-red-900 placeholder-red-300'
                : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              aria-invalid={errors.password ? "true" : "false"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-2.5 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${loading
              ? 'bg-blue-300 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {loading ? 'Creating account...' : 'Continue'}
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}