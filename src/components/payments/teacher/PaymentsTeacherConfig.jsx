const PaymentsTeacherConfig = ({
  upiId,
  setUpiId,
  qrCodeUrl,
  qrCodeFile,
  setQrCodeFile,
  isEditingPaymentDetails,
  setIsEditingPaymentDetails,
  savingPaymentDetails,
  handleSaveTeacherPaymentDetails,
  handleDeleteQrCode,
  fileInputRef,
  fetchTeacherData
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Configuration</h3>
      </div>
      
      <div className={`bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm transition-all duration-300 ${isEditingPaymentDetails ? 'ring-4 ring-indigo-500/10 border-indigo-300' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 6h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Payout Account</h3>
              <p className="text-xs font-semibold text-slate-400">Payment Gateway info</p>
            </div>
          </div>
          {!isEditingPaymentDetails && (
            <button onClick={() => setIsEditingPaymentDetails(true)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
          )}
        </div>
        
        {!isEditingPaymentDetails ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Connected UPI ID</p>
              {upiId ? (
                <p className="font-black text-slate-900 text-lg break-all">{upiId}</p>
              ) : (
                <p className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded inline-block border border-amber-100">Not configured yet</p>
              )}
            </div>
            
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Scan Code Presenter</p>
               {qrCodeUrl ? (
                 <div className="border border-slate-100 rounded-3xl p-3 bg-white shadow-sm inline-block group relative">
                   <div className="w-40 h-40 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50">
                     <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                   </div>
                 </div>
               ) : (
                 <div className="w-full h-32 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
                    <span className="text-xs font-bold">No QR Uploaded</span>
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in slide-in-from-top-2 fade-in duration-200">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">UPI Identifier</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="teacher@upi"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-900 transition-all placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Checkout QR Code</label>
              <div className="space-y-4">
                {qrCodeUrl && !qrCodeFile && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 p-1 shadow-sm"><img src={qrCodeUrl} alt="Active QR" className="w-full h-full object-contain" /></div>
                      <span className="text-xs font-bold text-slate-600">Active Image</span>
                    </div>
                    <button onClick={handleDeleteQrCode} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setQrCodeFile(file);
                    }}
                    ref={fileInputRef}
                    className="hidden"
                    id="qr-upload"
                  />
                  <label htmlFor="qr-upload" className={`w-full group flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${qrCodeFile ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-600'}`}>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                     <span className="text-sm font-bold">{qrCodeFile ? qrCodeFile.name : 'Upload New QR'}</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsEditingPaymentDetails(false);
                  setQrCodeFile(null);
                  fetchTeacherData(); // reset
                }}
                className="flex-1 px-4 py-3 font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                   await handleSaveTeacherPaymentDetails();
                   setIsEditingPaymentDetails(false);
                }}
                disabled={savingPaymentDetails}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)] flex justify-center items-center gap-2"
              >
                {savingPaymentDetails ? (
                  <>
                     <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Saving...
                  </>
                ) : (
                   'Save Lock'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsTeacherConfig;
