import { useState, useEffect } from 'react';

interface ProgressBarProps {
  duration: number;
}

export function ProgressBar({ duration }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return Math.min(newProgress, 95);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 25) setStatus('Initializing');
    else if (progress < 50) setStatus('Processing');
    else if (progress < 75) setStatus('Rendering');
    else setStatus('Finalizing');
  }, [progress]);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{status}...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">Estimated wait time: ~3 minutes</p>
    </div>
  );
}
