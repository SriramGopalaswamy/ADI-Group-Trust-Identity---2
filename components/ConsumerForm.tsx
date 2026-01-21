import React, { useState, useEffect, useRef } from 'react';
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
        alert("Location detected! PIN code auto-filled (Mock).");
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

    try {
      // 1. Check Batch
      const match = findBatchUrl(batchCode, batchData);
      
      // 2. Prepare Submission Record
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

      // 3. Save to Storage
      saveSubmission(submission);

      // 4. Handle Result
      if (match) {
        setMatchedEntry(match);
        setShowConfirmation(true); // Show confirmation instead of auto-download
      } else {
        setResultMessage({ type: 'error', text: "Batch code not found. Please check the code on your pack and try again." });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-100">
          <div className="text-red-500 mb-4">
             <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">System Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Header */}
      <div className="max-w-md mx-auto text-center mb-8">
        <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight">ADI Bharat</h1>
        <p className="mt-2 text-sm text-indigo-600">Quality Assurance Verification Portal</p>
      </div>

      {/* Main Form Card */}
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 relative z-10">
        <div className="bg-indigo-600 px-6 py-4">
          <h2 className="text-white text-lg font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Verify Your Product
          </h2>
        </div>

        <form onSubmit={handleVerify} className="p-6 space-y-5">
          
          {/* Form Fields */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
            <input type="text" id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-3" placeholder="Enter your name" />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
            <input type="tel" id="mobile" required pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-3" placeholder="10-digit number" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email ID (Optional)</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-3" placeholder="you@example.com" />
          </div>

          <div>
            <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700">PIN Code <span className="text-red-500">*</span></label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input type="text" id="pinCode" required value={pinCode} onChange={(e) => setPinCode(e.target.value)} className="flex-1 min-w-0 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-3" placeholder="000000" />
              <button type="button" onClick={handleGeolocation} className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm">
                <span className="hidden sm:inline">Use Location</span>
                <span className="sm:hidden">📍</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="batchCode" className="block text-sm font-medium text-gray-700">Batch Code <span className="text-red-500">*</span></label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">#</span>
              </div>
              <input type="text" id="batchCode" required value={batchCode} onChange={(e) => setBatchCode(e.target.value)} className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-3 uppercase tracking-wider" placeholder="BATCH123" />
            </div>
          </div>

          {/* Pack Image */}
          <div className="border-t border-gray-200 pt-4">
             <label className="block text-sm font-medium text-gray-700 mb-2">Pack Photo (Optional)</label>
             <div className="flex items-start space-x-4">
               <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
               <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                 {packImage ? 'Retake Photo' : 'Take Photo'}
               </button>
               {packImage && (
                 <div className="relative group">
                    <img src={packImage} alt="Pack" className="h-16 w-16 object-cover rounded-md border" />
                    <button type="button" onClick={() => setShowImageEditor(true)} className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow hover:bg-indigo-700">Edit</button>
                 </div>
               )}
             </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button type="submit" disabled={submitting} className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {submitting ? 'Verifying...' : 'Verify & Download Report'}
            </button>
          </div>

          {/* Error Message Only (Success handled by modal) */}
          {resultMessage && resultMessage.type === 'error' && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{resultMessage.text}</p>
                </div>
              </div>
            </div>
          )}

        </form>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-center">
             <span className="text-xs text-gray-500">© 2024 ADI Bharat. All rights reserved.</span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && matchedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden transform transition-all">
            <div className="bg-green-600 p-4 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-2">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-white">Valid Test Report Found</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Batch Code</span>
                  <span className="font-mono font-bold text-gray-900">{matchedEntry.batchCode}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Product</span>
                  <span className="font-medium text-gray-900 text-right">{matchedEntry.productName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Test Date</span>
                  <span className="font-medium text-gray-900">{matchedEntry.testDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lab Name</span>
                  <span className="font-medium text-gray-900 text-right">{matchedEntry.labName}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex space-x-3">
               <button
                 onClick={() => setShowConfirmation(false)}
                 className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
               >
                 Cancel
               </button>
               <button
                 onClick={handleDownloadConfirm}
                 className="flex-1 bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none"
               >
                 Download PDF
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
