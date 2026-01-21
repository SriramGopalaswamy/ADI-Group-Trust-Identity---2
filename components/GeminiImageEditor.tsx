import React, { useState } from 'react';
import { editImageWithGemini } from '../services/geminiService';

interface GeminiImageEditorProps {
  originalImage: string;
  onSave: (newImage: string) => void;
  onCancel: () => void;
}

const GeminiImageEditor: React.FC<GeminiImageEditorProps> = ({ originalImage, onSave, onCancel }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImage, setCurrentImage] = useState(originalImage);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await editImageWithGemini(currentImage, prompt);
      setCurrentImage(result);
      setPrompt(''); // Clear prompt after success
    } catch (err) {
      setError("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
          <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v-2"/><path d="M9 13v-2"/></svg>
            AI Image Editor
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          <img 
            src={currentImage} 
            alt="Editing Preview" 
            className="max-w-full max-h-[50vh] object-contain shadow-lg rounded-md border border-gray-200"
          />
        </div>

        <div className="p-6 bg-white border-t space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Make it look vintage', 'Add a neon glow'..."
              className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isProcessing}
            />
            <button
              onClick={handleEdit}
              disabled={isProcessing || !prompt.trim()}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center gap-2 ${
                isProcessing || !prompt.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>

          <div className="flex justify-between items-center pt-2">
             <button 
               onClick={() => setCurrentImage(originalImage)}
               className="text-sm text-gray-500 hover:text-gray-800 underline"
               disabled={isProcessing}
             >
               Reset to Original
             </button>
             <button
                onClick={() => onSave(currentImage)}
                disabled={isProcessing}
                className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition-transform active:scale-95"
             >
               Save & Use
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiImageEditor;
