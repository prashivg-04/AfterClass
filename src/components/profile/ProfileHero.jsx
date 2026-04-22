import React from 'react';

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

const ProfileHero = ({ profileData, user, role }) => {
    return (
        <div className="bg-slate-900 rounded-4xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8 lg:gap-12">
                {/* Consistent Circular Avatar */}
                <div className="shrink-0 relative self-start md:self-auto">
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/50 to-purple-600/50 rounded-full blur-2xl animate-pulse"></div>
                    <div className="w-32 h-32 md:w-36 md:h-36 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full border-4 border-white/10 ring-8 ring-slate-900 flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl relative z-10 transform transition-transform duration-500 group-hover:scale-105">
                        {getInitials(profileData?.full_name || user.user_metadata?.full_name, user.email)}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3 truncate">
                        {profileData?.full_name || user.user_metadata?.full_name || 'No Name Provided'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                            {role}
                        </span>
                        <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700/50">
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHero;
