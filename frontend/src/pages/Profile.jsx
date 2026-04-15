import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../lib/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function Profile() {
    const navigate = useNavigate();
    const { session } = useAuth();
    const { role } = useSelector((state) => state.auth);

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    const getInitials = (name, email) => {
        if (name) {
            const parts = name.trim().split(/\s+/);
            if (parts.length > 1) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return name[0].toUpperCase();
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return '?';
    };

    useEffect(() => {
        fetchProfile();
    }, [session]);

    const fetchProfile = async () => {
        if (!session?.user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;

            setProfileData(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (!session?.user) {
        return null;
    }

    const { user } = session;

    if (loading) {
        return (
            <DashboardLayout role={role}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role={role}>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
                        <p className="text-sm text-slate-500 mt-1">View your account details</p>
                    </div>
                </div>

                {/* Profile Info Section */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="h-36 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full mix-blend-overlay filter blur-2xl pointer-events-none transform -translate-x-1/4 translate-y-1/4"></div>
                    </div>

                    <div className="px-8 pb-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-12 mb-8 gap-4 sm:gap-0">
                            <div className="relative">
                                <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl border-4 border-white flex items-center justify-center text-white text-4xl font-bold shadow-md object-cover transform hover:scale-105 transition-transform duration-300">
                                    {getInitials(profileData?.full_name || user.user_metadata?.full_name, user.email)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 text-center sm:text-left">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {profileData?.full_name || user.user_metadata?.full_name || 'No Name Provided'}
                                </h2>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
                                        {role}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
                                    <div className="flex items-center gap-2.5 mt-2">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-900 font-medium truncate">{user.email}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account ID</label>
                                    <div className="flex items-center gap-2.5 mt-2">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-900 font-medium font-mono text-sm">{user.id.split('-')[0]}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default Profile;
