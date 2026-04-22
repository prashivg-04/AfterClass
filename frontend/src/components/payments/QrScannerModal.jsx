export default function QrScannerModal({ qrCodeUrl, onClose }) {
  if (!qrCodeUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative max-w-sm w-full bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col items-center transform transition-all scale-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors group"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Scan to Pay</h3>
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 w-full mb-6">
          <img src={qrCodeUrl} alt="Expanded QR Code" className="w-full h-auto object-contain rounded-2xl shadow-sm mix-blend-multiply" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Point your scanner at the screen</p>
      </div>
    </div>
  );
}
