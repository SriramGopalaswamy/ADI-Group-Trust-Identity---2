import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchBatchData, findBatchUrl } from '../services/sheetService';
import { saveSubmission } from '../services/storageService';
import { Submission, BatchEntry } from '../types';
import GeminiImageEditor from './GeminiImageEditor';

const ConsumerForm: React.FC = () => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [packImage, setPackImage] = useState<string | null>(null);

  // App State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batchData, setBatchData] = useState<BatchEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // UI Features
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [matchedEntry, setMatchedEntry] = useState<BatchEntry | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Data
  useEffect(() => {
    const initData = async () => {
      try {
        const data = await fetchBatchData();
        setBatchData(data);
        if (data.length === 0) {
          setError("Service temporarily unavailable");
        }
      } catch (e) {
        setError("Service temporarily unavailable");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Geolocation Handler
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Got location:", position.coords);
        setPinCode("110001"); // Mock
        // Visual feedback could be added here
      },
      (err) => {
        alert("Location access denied or failed. Please enter PIN manually.");
      }
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMessage(null);
    setSubmitting(true);
    setMatchedEntry(null);
    setShowConfirmation(false);

    if (!fullName || !mobile || !pinCode || !batchCode) {
      setResultMessage({ type: 'error', text: "Please fill all required fields." });
      setSubmitting(false);
      return;
    }

    // Simulate small delay for better UX (so button animation shows)
    await new Promise(r => setTimeout(r, 600));

    try {
      const match = findBatchUrl(batchCode, batchData);
      
      const submission: Submission = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        fullName,
        mobile,
        email,
        pinCode,
        batchCode,
        matchedUrl: match ? match.reportUrl : undefined,
        status: match ? 'SUCCESS' : 'FAILURE',
        deviceType: /Mobi/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        packImage: packImage || undefined
      };

      saveSubmission(submission);

      if (match) {
        setMatchedEntry(match);
        setShowConfirmation(true);
      } else {
        setResultMessage({ type: 'error', text: "Batch code not found. Please check your pack." });
      }

    } catch (err) {
      setResultMessage({ type: 'error', text: "An unexpected error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadConfirm = () => {
    if (matchedEntry) {
      window.open(matchedEntry.reportUrl, '_blank');
      setResultMessage({ type: 'success', text: "Download started." });
      setShowConfirmation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-indigo-600 font-medium animate-pulse">Loading verified data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl shadow-2xl text-center border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">System Error</h2>
          <p className="text-gray-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-blue-50 relative pb-32 sm:pb-10">
      
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-cyan-100/30 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-blue-800 tracking-tight">ADI Bharat</h1>
          <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto rounded-full mt-3 mb-3"></div>
          <p className="text-slate-500 font-medium">Verification Portal</p>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-[2rem] shadow-xl overflow-hidden relative">
          
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h2 className="text-white text-xl font-bold flex items-center relative z-10">
              <svg className="w-6 h-6 mr-3 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Verify Product
            </h2>
            <p className="text-indigo-100 text-sm mt-1 ml-9 opacity-90">Enter details to fetch test report</p>
          </div>

          <form onSubmit={handleVerify} className="p-6 sm:p-8 space-y-6">
            
            <div className="space-y-5">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="block w-full rounded-2xl border-0 bg-slate-50/50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white px-5 py-4 transition-all duration-200 outline-none text-slate-900 font-medium shadow-sm placeholder-slate-400" 
                  placeholder="John Doe" 
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Mobile Number</label>
                <input 
                  type="tel" 
                  required 
                  pattern="[0-9]{10}" 
                  value={mobile} 
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  className="block w-full rounded-2xl border-0 bg-slate-50/50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white px-5 py-4 transition-all duration-200 outline-none text-slate-900 font-medium shadow-sm placeholder-slate-400 font-mono tracking-wide" 
                  placeholder="9876543210" 
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="block w-full rounded-2xl border-0 bg-slate-50/50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white px-5 py-4 transition-all duration-200 outline-none text-slate-900 font-medium shadow-sm placeholder-slate-400" 
                  placeholder="john@example.com" 
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">PIN Code</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required 
                    value={pinCode} 
                    onChange={(e) => setPinCode(e.target.value)} 
                    className="flex-1 rounded-2xl border-0 bg-slate-50/50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white px-5 py-4 transition-all duration-200 outline-none text-slate-900 font-medium shadow-sm placeholder-slate-400 font-mono" 
                    placeholder="110001" 
                  />
                  <button 
                    type="button" 
                    onClick={handleGeolocation} 
                    className="px-5 py-4 bg-white ring-1 ring-slate-200 rounded-2xl text-indigo-600 hover:bg-indigo-50 hover:ring-indigo-200 transition-all active:scale-95 shadow-sm"
                    title="Use Location"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </button>
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Batch Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold text-lg">#</span>
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={batchCode} 
                    onChange={(e) => setBatchCode(e.target.value)} 
                    className="block w-full rounded-2xl border-0 bg-slate-50/50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white pl-10 pr-5 py-4 transition-all duration-200 outline-none text-slate-900 font-bold shadow-sm placeholder-slate-400 uppercase tracking-widest text-lg" 
                    placeholder="ABC-123" 
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="pt-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Pack Photo <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                 
                 <div className="flex gap-4 items-center">
                   <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                   
                   <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex-1 py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 gap-1 active:scale-95"
                   >
                     <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                     <span className="text-xs font-semibold">{packImage ? 'Retake Photo' : 'Capture Pack'}</span>
                   </button>

                   {packImage && (
                     <div className="relative h-20 w-20 shrink-0">
                        <img src={packImage} alt="Pack" className="h-full w-full object-cover rounded-xl shadow-md border border-white" />
                        <button 
                          type="button" 
                          onClick={() => setShowImageEditor(true)} 
                          className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 active:scale-90 transition-transform"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            {/* Error Message */}
            {resultMessage && resultMessage.type === 'error' && (
              <div className="rounded-2xl bg-red-50 p-4 border border-red-100 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                     <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="text-sm font-medium text-red-800">{resultMessage.text}</p>
                </div>
              </div>
            )}

            {/* Desktop Button (Hidden on Mobile if sticky is preferred, but we use sticky wrapper below) */}
            <div className="hidden sm:block pt-2">
              <button 
                type="submit" 
                disabled={submitting} 
                className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-base font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${submitting ? 'bg-indigo-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-200'}`}
              >
                {submitting ? 'Verifying...' : 'Verify & Download Report'}
              </button>
            </div>
          </form>

          {/* Footer inside card */}
          <div className="bg-slate-50/80 px-8 py-5 border-t border-white/50 flex flex-col items-center space-y-2 backdrop-blur-sm">
             <Link to="/admin" className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-1 py-2">
               Admin Access
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
             </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Button Container */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-bottom">
        <button 
          type="submit" 
          onClick={handleVerify}
          disabled={submitting} 
          className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-base font-bold text-white transition-all active:scale-[0.98] ${submitting ? 'bg-indigo-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600'}`}
        >
          {submitting ? (
             <span className="flex items-center gap-2">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Verifying...
             </span>
          ) : 'Verify & Download Report'}
        </button>
      </div>

      {/* Confirmation Modal - Modernized */}
      {showConfirmation && matchedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100 animate-slide-up">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/20 mb-4 backdrop-blur-md shadow-inner">
                <svg className="h-10 w-10 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Verified & Safe</h3>
              <p className="text-green-100 mt-1 font-medium">Original Test Report Found</p>
            </div>
            
            <div className="px-8 py-6 bg-white">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Batch Code</span>
                  <span className="font-mono font-bold text-slate-800 text-lg">{matchedEntry.batchCode}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Test Date</span>
                  <span className="font-medium text-slate-900">{matchedEntry.testDate}</span>
                </div>
                <div className="py-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block mb-1">Product</span>
                  <span className="font-medium text-slate-900 block leading-tight">{matchedEntry.productName}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-6 flex flex-col gap-3">
               <button
                 onClick={handleDownloadConfirm}
                 className="w-full bg-slate-900 py-4 px-6 rounded-xl shadow-lg text-base font-bold text-white hover:bg-slate-800 active:scale-95 transition-all flex justify-center items-center gap-2"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                 Download PDF Report
               </button>
               <button
                 onClick={() => setShowConfirmation(false)}
                 className="w-full bg-white py-4 px-6 border border-slate-200 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}

      {showImageEditor && packImage && (
        <GeminiImageEditor 
          originalImage={packImage}
          onSave={(newImage) => {
            setPackImage(newImage);
            setShowImageEditor(false);
          }}
          onCancel={() => setShowImageEditor(false)}
        />
      )}

    </div>
  );
};

export default ConsumerForm;