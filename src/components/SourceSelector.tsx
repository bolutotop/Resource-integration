'use client';

import { useSource } from '@/context/SourceContext';
import { Layers } from 'lucide-react';

export default function SourceSelector() {
  const { currentSource, switchSource } = useSource();

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-white/50 text-sm font-bold">
        <Layers size={16} /> 数据源:
      </div>
      
      <div className="flex bg-[#161b22] border border-white/10 p-1 rounded-lg">
        {/* Age 按钮 */}
        <button
          onClick={() => switchSource('Age')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
            currentSource === 'Age'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Age动漫
        </button>

        {/* Yhmc 按钮 */}
        <button
          onClick={() => switchSource('Yhmc')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
            currentSource === 'Yhmc'
              ? 'bg-pink-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          樱花动漫
        </button>
      </div>
    </div>
  );
}