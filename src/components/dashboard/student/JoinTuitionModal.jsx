import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { joinSchema } from '../../../schemas/join.schema';

export default function JoinTuitionModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      joinCode: '',
    },
  });

  const handleJoinTuition = async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userId = user.id;
    setLoading(true);

    try {
      const joinCodeValue = data.joinCode.trim().toUpperCase();

      const { data: tuition } = await supabase
        .from('tuition_spaces')
        .select('id, name, monthly_fee, due_day')
        .eq('join_code', joinCodeValue)
        .maybeSingle();

      if (!tuition) {
        toast.error('Invalid join code');
        return;
      }

      const { data: existingMembers } = await supabase
        .from('tuition_members')
        .select('id')
        .eq('tuition_id', tuition.id)
        .eq('user_id', userId);

      if (existingMembers && existingMembers.length > 0) {
        toast.error('You are already a member of this tuition');
        return;
      }

      const { error: joinError } = await supabase
        .from('tuition_members')
        .insert({
          user_id: userId,
          tuition_id: tuition.id,
          role_in_tuition: 'student',
        });

      if (joinError) {
        if (joinError.code === '23505' || joinError.message?.includes('duplicate')) {
          toast.error('You are already a member of this tuition');
          return;
        }
        throw joinError;
      }

      const { error: feeError } = await supabase
        .from('student_fees')
        .insert({
          tuition_id: tuition.id,
          student_id: userId,
          fee_amount: tuition.monthly_fee || 0,
          due_day: tuition.due_day || 1,
        });

      if (feeError) {
        toast.error('Joined tuition but fee record could not be created. Please contact your teacher.');
        return;
      }

      toast.success('Joined tuition successfully');
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to join tuition');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-4xl max-w-md w-full shadow-2xl border border-slate-200/60 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 flex items-center justify-between relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Join a Tuition</h2>
              <p className="text-xs font-semibold text-slate-400">Enter the code from your teacher</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onClose(); reset(); }}
            className="relative z-10 w-9 h-9 rounded-2xl flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit(handleJoinTuition)} className="space-y-5" noValidate>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                Join Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('joinCode')}
                value={watch('joinCode') || ''}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().slice(0, 6);
                  setValue('joinCode', value, { shouldValidate: true });
                }}
                placeholder="e.g. MATH10"
                maxLength={6}
                className={`w-full px-5 py-4 bg-slate-50 border text-slate-900 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-200 uppercase placeholder:normal-case font-mono tracking-widest font-black text-xl text-center ${errors.joinCode
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-slate-300'
                  }`}
                aria-invalid={errors.joinCode ? "true" : "false"}
              />
              {errors.joinCode && (
                <p className="mt-2 text-sm text-red-500 font-bold animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.joinCode.message}
                </p>
              )}
              <p className="text-xs text-slate-400 font-semibold mt-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                A 6-character code like 'MATH10' or 'A1B2C3'
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { onClose(); reset(); }}
                className="px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3 text-sm font-black text-white bg-indigo-600 shadow-sm rounded-2xl hover:bg-indigo-700 transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </>
                ) : (
                  'Join Tuition'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
