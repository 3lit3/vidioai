import { CheckCircle } from 'lucide-react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
}

export const CompletionModal = ({ isOpen, onClose, productTitle }: CompletionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl p-8 text-center max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-3">
          Congrats!
        </h2>

        <p className="text-lg text-gray-300 mb-2">
          Your video has been completed!
        </p>

        <p className="text-cyan-400 font-semibold mb-6">
          {productTitle}
        </p>

        <p className="text-gray-400 mb-8">
          Your video has been sent to your email. Check your inbox for the download link.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
