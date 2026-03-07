import { useState } from 'react';

export default function TuitionHeader({ tuition, tuitionCreatedDate, isTeacher, onBack }) {
  const [copying, setCopying] = useState(false);

  const handleCopyJoinCode = async () => {
    if (tuition?.join_code) {
      await navigator.clipboard.writeText(tuition.join_code);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tuition.name}</h1>
          <p className="text-sm text-slate-500">
            Created {tuitionCreatedDate}
          </p>
        </div>
      </div>
      {isTeacher && (
        <div className="text-right">
          <p className="text-sm text-slate-500">Join Code</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-lg font-semibold bg-slate-100 px-3 py-1 rounded">
              {tuition.join_code || 'N/A'}
            </p>
            <button
              onClick={handleCopyJoinCode}
              disabled={!tuition?.join_code || copying}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-50"
              title="Copy join code"
            >
              {copying ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
