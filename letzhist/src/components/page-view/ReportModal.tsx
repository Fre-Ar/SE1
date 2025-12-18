import { useState} from "react";
import { ReportCategory } from "@/components/data_types";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";


interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void; 
  onSubmit: (cat: string, reason: string) => void; 
  isSubmitting: boolean;
}


export const ReportModal = ({ isOpen, onClose, onSubmit, isSubmitting }: ReportModalProps) => {
  
  const [category, setCategory] = useState<ReportCategory>('spam');
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <FaExclamationTriangle />
            Report Content
          </h3>
          <button onClick={onClose} className="text-amber-800/60 hover:text-amber-900">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="spam">Spam or Advertising</option>
              <option value="harassment">Harassment or Bullying</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="violence">Violence or Threats</option>
              <option value="accuracy">Factually Incorrect</option>
              <option value="bias">Biased Content</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Details</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Please provide more context..."
              className="w-full p-2 border border-slate-300 rounded text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 flex justify-end gap-3 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(category, reason)}
            disabled={!reason.trim() || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Sending..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
};