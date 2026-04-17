import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ArrowRight, Mail, KeyRound, AlertCircle, User } from 'lucide-react';
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

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      handleError(err, 'Failed to sign up with Google');
    }
  };

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
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full" noValidate>
        
        {/* Header Tile */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl text-white font-extrabold tracking-tight mb-2">Initialize access.</h1>
            <p className="text-slate-400 text-base md:text-lg">Create your AfterClass instance.</p>
          </div>
          <div className="relative z-10 hidden md:block">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
               <svg className="w-6 h-6 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
          </div>
        </div>

        {/* Full Name Input Tile */}
        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 focus-within:bg-emerald-50/30 focus-within:border-emerald-300 transition-all group relative overflow-hidden shadow-sm hover:shadow-md">
          <div className="flex items-center gap-2 mb-3 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
             <User className="w-4 h-4" />
             <label className="text-xs font-bold uppercase tracking-widest">
               Identity Name
             </label>
          </div>
          <input
            type="text"
            {...register('name')}
            placeholder="John Doe"
            className="w-full bg-transparent text-xl sm:text-2xl lg:text-3xl text-slate-900 outline-none placeholder-slate-300 font-medium tracking-tight"
          />
          {errors.name && (
            <div className="flex items-center gap-2 mt-4 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 text-sm font-medium animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.name.message}</span>
            </div>
          )}
        </div>

        {/* Email Input Tile */}
        <div className="bg-white border border-slate-200/80 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 focus-within:bg-indigo-50/30 focus-within:border-indigo-300 transition-all group relative overflow-hidden shadow-sm hover:shadow-md">
          <div className="flex items-center gap-2 mb-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
             <Mail className="w-4 h-4" />
             <label className="text-xs font-bold uppercase tracking-widest">
               Work Email
             </label>
          </div>
          <input
            type="email"
            {...register('email')}
            placeholder="hq@afterclass.com"
            className="w-full bg-transparent text-xl sm:text-2xl lg:text-3xl text-slate-900 outline-none placeholder-slate-300 font-medium tracking-tight"
          />
          {errors.email && (
            <div className="flex items-center gap-2 mt-4 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 text-sm font-medium animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>

        {/* Password Input Tile */}
        <div className="bg-white border border-slate-200/80 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 focus-within:bg-purple-50/30 focus-within:border-purple-300 transition-all group relative overflow-hidden shadow-sm hover:shadow-md">
          <div className="flex items-center gap-2 mb-3 text-slate-400 group-focus-within:text-purple-600 transition-colors">
             <KeyRound className="w-4 h-4" />
             <label className="text-xs font-bold uppercase tracking-widest">
               Passkey
             </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register('password')}
              placeholder="••••••••"
              className="w-full bg-transparent text-xl sm:text-2xl lg:text-3xl text-slate-900 outline-none placeholder-slate-300 font-mono tracking-widest pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 bg-white/50 hover:bg-slate-50 rounded-full focus:outline-none transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              )}
            </button>
          </div>
          {errors.password && (
            <div className="flex items-center gap-2 mt-4 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 text-sm font-medium animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.password.message}</span>
            </div>
          )}
        </div>

        {/* Google SSO Tile */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="bg-white border border-slate-200/80 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between items-start h-[120px] md:h-[160px] group shadow-sm"
        >
          <div className="w-full flex justify-between items-start">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 -rotate-45" />
            </div>
          </div>
          <span className="text-slate-900 font-extrabold text-lg sm:text-xl md:text-[1.35rem] tracking-tight text-left leading-tight">Continue<br/>with Google</span>
        </button>

        {/* Submit Tile */}
        <button
          type="submit"
          disabled={loading}
          className={`
            border rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 flex flex-col justify-between items-end h-[120px] md:h-[160px] transition-all group overflow-hidden relative shadow-lg
            ${loading 
               ? 'bg-indigo-50 border-indigo-100 cursor-wait' 
               : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-700 hover:scale-[0.98] active:scale-95 shadow-[0_0_40px_rgba(79,70,229,0.2)] hover:shadow-[0_0_60px_rgba(79,70,229,0.4)]'
            }
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
             <ArrowRight className={`w-8 h-8 md:w-10 md:h-10 ${loading ? 'text-indigo-300' : 'text-white group-hover:translate-x-2 transition-transform'}`} />
          </div>
          <span className={`font-extrabold text-xl sm:text-2xl tracking-tight relative z-10 ${loading ? 'text-indigo-300' : 'text-white leading-tight text-right'}`}>
            {loading ? 'Processing...' : <>Deploy<br/>Instance</>}
          </span>
        </button>

        {/* Footer Link Container */}
        <div className="md:col-span-2 mt-4 text-center">
          <p className="text-sm font-medium text-slate-500">
            Already verified?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
              Access dashboard
            </Link>
          </p>
        </div>

      </form>
    </AuthLayout>
  );
}