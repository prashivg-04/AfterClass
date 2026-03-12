import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../lib/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';

function Profile() {
    const navigate = useNavigate();
    const { session } = useAuth();
    const { role } = useSelector((state) => state.auth);

    if (!session?.user) {
        return null; // or redirect, handled by PrivateRoute usually
    }

    const { user } = session;

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
                        <p className="text-sm text-slate-500 mt-1">Manage your account settings and preferences</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Cover Photo Area - decorative */}
                    <div className="h-32 bg-linear-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    <div className="px-8 pb-8">
                        {/* Avatar section shifting up over the cover photo */}
                        <div className="flex items-end justify-between -mt-12 mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 bg-slate-900 rounded-2xl border-4 border-white flex items-center justify-center text-white text-3xl font-bold shadow-sm">
                                    {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {user.user_metadata?.full_name || 'No Name Provided'}
                                </h2>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                                        {role}
                                    </span>
                                    <span className="text-sm text-slate-500 flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-500">Email Address</label>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-slate-900 font-medium">{user.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-500">Account ID</label>
                                    <p className="text-slate-900 font-medium font-mono text-sm">{user.id.split('-')[0]}</p>
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
