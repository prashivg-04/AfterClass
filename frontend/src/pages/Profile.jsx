import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../lib/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ProfileHero from '../components/profile/ProfileHero';
import ProfileBentoGrid from '../components/profile/ProfileBentoGrid';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function Profile() {
    const navigate = useNavigate();
    const { session } = useAuth();
    const { role } = useSelector((state) => state.auth);

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);



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
            <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Identity Profile</h1>
                            <p className="text-sm font-semibold text-slate-500 mt-1">Manage your account details securely</p>
                        </div>
                    </div>
                </div>

                {/* Refactored Dark Mode Bento Hero */}
                <ProfileHero profileData={profileData} user={user} role={role} />

                {/* Refactored Bento Grid Info Section */}
                <ProfileBentoGrid user={user} />
            </div>
        </DashboardLayout>
    );
}

export default Profile;
