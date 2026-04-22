import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { supabase } from '../lib/supabase';
import { forgotPasswordSchema } from '../schemas/forgotPassword.schema';
import { handleError } from '../utilities/errorHandler';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      handleError(err, 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout title="Check your email">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600">
            We've sent a password reset link to your email. Please check your inbox and follow the instructions.
          </p>
          <Link
            to="/login"
            className="inline-block text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <p className="text-sm text-gray-600 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>

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
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
