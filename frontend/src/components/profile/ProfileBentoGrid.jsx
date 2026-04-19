import React from 'react';

const ProfileBentoGrid = ({ user }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity text-blue-600">
                    <svg className="w-32 h-32 -mt-8 -mr-8" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 4.3l-8 5-8-5V6l8 5 8-5v2.3z"/></svg>
                </div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 block">Email Address</label>
                <div className="flex items-center gap-4 relative z-10 w-full overflow-hidden">
                    <div className="shrink-0 w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xl md:text-2xl text-slate-900 font-black tracking-tight truncate w-full" title={user.email}>{user.email}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity text-emerald-600">
                    <svg className="w-32 h-32 -mt-8 -mr-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                </div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 block">Account Identifier</label>
                <div className="flex items-center gap-4 relative z-10 w-full overflow-hidden">
                    <div className="shrink-0 w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <div className="flex-1 flex items-baseline gap-2 min-w-0">
                        <p className="text-xl md:text-2xl text-slate-900 font-black tracking-tight font-mono">{user.id.split('-')[0]}</p>
                        <p className="text-slate-400 text-sm font-semibold truncate hidden sm:block">- {user.id.substring(user.id.indexOf('-') + 1)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileBentoGrid;
