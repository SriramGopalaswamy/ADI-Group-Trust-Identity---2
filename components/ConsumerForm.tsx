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

    // Simulate small delay for UX
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

  // --- RENDERING ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-[380px] w-full bg-white p-8 rounded-3xl shadow-xl text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">System Unavailable</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      
      {/* Centered Mobile Container */}
      <div className="mx-auto w-full max-w-[420px] px-5 pt-8 sm:pt-12">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ADI Bharat</h1>
          <p className="text-slate-500 text-sm mt-1">Product Verification</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          
          {/* Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5">
            <h2 className="text-white font-semibold text-lg flex items-center">
              Verify Product
            </h2>
            <p className="text-indigo-100 text-xs opacity-90 mt-0.5">Enter details below</p>
          </div>

          <form onSubmit={handleVerify} className="p-6 space-y-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 ml-1">Name</label>
              <input 
                type="text" 
                required 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                className="block w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white py-3.5 px-4 text-[17px] text-slate-900 placeholder-slate-400 transition-all outline-none" 
                placeholder="Your Name" 
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 ml-1">Mobile</label>
              <input 
                type="tel" 
                required 
                pattern="[0-9]{10}" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                className="block w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white py-3.5 px-4 text-[17px] text-slate-900 placeholder-slate-400 transition-all outline-none font-medium" 
                placeholder="10-digit number" 
              />
            </div>

            {/* PIN Code */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 ml-1">PIN Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required 
                  value={pinCode} 
                  onChange={(e) => setPinCode(e.target.value)} 
                  className="flex-1 rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white py-3.5 px-4 text-[17px] text-slate-900 placeholder-slate-400 transition-all outline-none" 
                  placeholder="000000" 
                />
                <button 
                  type="button" 
                  onClick={handleGeolocation} 
                  className="px-4 bg-white ring-1 ring-slate-200 rounded-2xl text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </button>
              </div>
            </div>

            {/* Batch Code */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 ml-1">Batch Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold text-lg">#</span>
                </div>
                <input 
                  type="text" 
                  required 
                  value={batchCode} 
                  onChange={(e) => setBatchCode(e.target.value)} 
                  className="block w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white pl-9 pr-4 py-3.5 text-[17px] text-slate-900 font-bold placeholder-slate-400 transition-all outline-none uppercase tracking-wider" 
                  placeholder="BATCH-ID" 
                />
              </div>
            </div>

            {/* Optional Email (Collapsible/Small) */}
             <div>
              <label className="block text-[13px] font-semibold text-slate-400 uppercase tracking-wide mb-2 ml-1">Email (Optional)</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="block w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white py-3.5 px-4 text-[17px] text-slate-900 placeholder-slate-400 transition-all outline-none" 
                placeholder="name@email.com" 
              />
            </div>

            {/* Pack Photo */}
            <div className="pt-2">
               <div className="flex gap-3 items-center">
                 <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                 
                 <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex-1 py-3 px-4 rounded-2xl border border-dashed border-slate-300 text-slate-500 active:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                 >
                   <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                   <span className="text-[15px] font-medium">{packImage ? 'Retake' : 'Add Photo'}</span>
                 </button>

                 {packImage && (
                   <div className="relative h-14 w-14 shrink-0">
                      <img src={packImage} alt="Pack" className="h-full w-full object-cover rounded-lg border border-slate-200" />
                      <button 
                        type="button" 
                        onClick={() => setShowImageEditor(true)} 
                        className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full shadow-md"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                   </div>
                 )}
               </div>
            </div>

            {/* Error Feedback */}
            {resultMessage && resultMessage.type === 'error' && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100 font-medium">
                {resultMessage.text}
              </div>
            )}
          </form>

          {/* Admin Link */}
          <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
             <Link to="/admin" className="text-xs font-semibold text-slate-400 hover:text-indigo-600 uppercase tracking-widest px-4 py-2">
               Admin Login
             </Link>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 px-5 py-3 pb-safe">
        <div className="mx-auto max-w-[420px]">
          <button 
            type="submit" 
            onClick={handleVerify}
            disabled={submitting} 
            className={`w-full py-3.5 px-6 rounded-[18px] text-[17px] font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${submitting ? 'bg-indigo-300' : 'bg-indigo-600'}`}
          >
            {submitting ? 'Verifying...' : 'Verify Product'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showConfirmation && matchedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[340px] overflow-hidden transform transition-all scale-100 animate-slide-up">
            
            <div className="pt-8 pb-6 px-6 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Verified</h3>
              <p className="text-slate-500 text-sm mt-1">Valid report found</p>
            </div>
            
            <div className="bg-slate-50 px-6 py-5 border-t border-slate-100 border-b">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Batch</span>
                <span className="text-base font-mono font-bold text-slate-900">{matchedEntry.batchCode}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-400 uppercase">Date</span>
                 <span className="text-sm font-medium text-slate-700">{matchedEntry.testDate}</span>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
               <button
                 onClick={handleDownloadConfirm}
                 className="w-full bg-slate-900 py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-95 transition-transform"
               >
                 Download Report
               </button>
               <button
                 onClick={() => setShowConfirmation(false)}
                 className="w-full py-3.5 rounded-2xl text-[16px] font-semibold text-slate-600 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors"
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