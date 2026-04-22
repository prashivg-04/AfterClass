import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { tuitionSchema } from '../../../schemas/tuition.schema';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'JEE', 'NEET'];
const BATCHES = ['Morning', 'Evening'];

function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function CreateTuitionModal({ isOpen, onClose, userId, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tuitionSchema),
    defaultValues: {
      tuitionName: '',
      subject: '',
      grade: '',
      batch: '',
      monthlyFee: '',
      description: '',
    },
  });

  const resetForm = () => {
    reset({
      tuitionName: '',
      subject: '',
      grade: '',
      batch: '',
      monthlyFee: '',
      description: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onSubmit = async (data) => {
    if (!userId) return;

    setLoading(true);

    try {
      // Generate a random 6-character join code
      const joinCode = generateJoinCode();

      // 1. Create tuition space
      const { data: tuition, error: tuitionError } = await supabase
        .from('tuition_spaces')
        .insert({
          name: data.tuitionName,
          created_by: userId,
          join_code: joinCode,
          subject: data.subject || null,
          grade: data.grade || null,
          batch: data.batch || null,
          description: data.description || null,
          monthly_fee: parseFloat(data.monthlyFee),
        })
        .select()
        .single();

      if (tuitionError) throw tuitionError;

      // 2. Add teacher as member with teacher role
      const { error: memberError } = await supabase
        .from('tuition_members')
        .insert({
          user_id: userId,
          tuition_id: tuition.id,
          role_in_tuition: 'teacher',
        });

      if (memberError) throw memberError;

      toast.success('Tuition created successfully');
      onSuccess(tuition);
      handleClose();
    } catch (err) {
      toast.error('Failed to create tuition');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-4xl max-w-lg w-full shadow-2xl border border-slate-200/60 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 flex items-center justify-between relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Tuition</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Tuition Name */}
            <div>
              <label className="block text-sm font-bold tracking-wide text-slate-700 mb-2">
                Tuition Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('tuitionName')}
                placeholder="e.g., Math Grade 10 Morning Batch"
                className={`w-full px-5 py-3.5 bg-slate-50/50 border rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 transition-all duration-200 placeholder:text-slate-400 ${errors.tuitionName
                  ? 'border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900 placeholder:text-red-300'
                  : 'border-slate-200/80 hover:border-slate-300 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                  }`}
                aria-invalid={errors.tuitionName ? "true" : "false"}
              />
              {errors.tuitionName && (
                <p className="mt-2 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.tuitionName.message}
                </p>
              )}
            </div>

            {/* Subject & Grade Grid */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 mb-2">Subject</label>
                <div className="relative">
                  <select
                    {...register('subject')}
                    className={`w-full px-5 py-3.5 bg-slate-50/50 border rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 transition-all duration-200 appearance-none ${errors.subject
                      ? 'border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900'
                      : 'border-slate-200/80 hover:border-slate-300 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                      }`}
                    aria-invalid={errors.subject ? "true" : "false"}
                  >
                    <option value="">Select subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.subject && (
                  <p className="mt-2 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {errors.subject.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 mb-2">Grade</label>
                <div className="relative">
                  <select
                    {...register('grade')}
                    className={`w-full px-5 py-3.5 bg-slate-50/50 border rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 transition-all duration-200 appearance-none ${errors.grade
                      ? 'border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900'
                      : 'border-slate-200/80 hover:border-slate-300 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                      }`}
                    aria-invalid={errors.grade ? "true" : "false"}
                  >
                    <option value="">Select grade</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.grade && (
                  <p className="mt-2 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {errors.grade.message}
                  </p>
                )}
              </div>
            </div>

            {/* Batch & Fee Grid */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 mb-2">Batch</label>
                <div className="relative">
                  <select
                    {...register('batch')}
                    className={`w-full px-5 py-3.5 bg-slate-50/50 border rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 transition-all duration-200 appearance-none ${errors.batch
                      ? 'border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900'
                      : 'border-slate-200/80 hover:border-slate-300 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                      }`}
                    aria-invalid={errors.batch ? "true" : "false"}
                  >
                    <option value="">Select batch</option>
                    {BATCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.batch && (
                  <p className="mt-2 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {errors.batch.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 mb-2">
                  Monthly Fee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    {...register('monthlyFee')}
                    placeholder="e.g., 1500"
                    min="1"
                    step="1"
                    className={`w-full pl-9 pr-5 py-3.5 bg-slate-50/50 border rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 transition-all duration-200 placeholder:text-slate-400 ${errors.monthlyFee
                      ? 'border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900 placeholder:text-red-300'
                      : 'border-slate-200/80 hover:border-slate-300 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                      }`}
                    aria-invalid={errors.monthlyFee ? "true" : "false"}
                  />
                </div>
                {errors.monthlyFee && (
                  <p className="mt-2 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {errors.monthlyFee.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold tracking-wide text-slate-700 mb-2">Description</label>
              <textarea
                {...register('description')}
                placeholder="Add brief notes or curriculum details about this tuition..."
                rows={3}
                className={`w-full px-5 py-3.5 bg-slate-50/50 border rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 transition-all duration-200 resize-none placeholder:text-slate-400 ${errors.description
                  ? 'border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900'
                  : 'border-slate-200/80 hover:border-slate-300 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                  }`}
                aria-invalid={errors.description ? "true" : "false"}
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-4 text-base font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 text-base font-bold text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all hover:shadow-[0_8px_20px_rgba(15,23,42,0.2)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Tuition'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateTuitionModal;
