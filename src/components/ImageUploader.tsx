'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('上传失败');
      const data = await res.json();
      onChange(data.url);
    } catch (error) {
      alert('上传出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* --- 核心修改：比例优化 --- 
         1. w-48: 限制宽度为 192px，不再是撑满全屏
         2. aspect-[3/4]: 强制 3:4 的海报比例
      */}
      <div className="relative w-48 aspect-[3/4] bg-[#0d1117] border-2 border-dashed border-gray-700 rounded-xl overflow-hidden group hover:border-blue-500 transition-colors shrink-0">
        {value ? (
          <>
            <img src={value} alt="Cover" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white hover:bg-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
            {loading ? (
              <Loader2 className="animate-spin text-blue-500" size={24} />
            ) : (
              <>
                <ImageIcon size={24} />
                <span className="text-[10px] text-center px-2">暂无海报<br/>(3:4)</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <div className="flex gap-2 text-xs font-bold text-gray-400 bg-black/20 p-1 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setInputType('upload')}
            className={`px-3 py-1 rounded-md transition-all ${inputType === 'upload' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
          >
            本地上传
          </button>
          <button
            type="button"
            onClick={() => setInputType('url')}
            className={`px-3 py-1 rounded-md transition-all ${inputType === 'url' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
          >
            网络外链
          </button>
        </div>

        {inputType === 'upload' ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer bg-[#161b22] border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
          >
            <Upload size={16} />
            <span className="font-medium">点击上传</span>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
        ) : (
          <div className="relative">
             <LinkIcon size={14} className="absolute left-3 top-3 text-gray-500" />
             <input 
              type="url"
              placeholder="https://..."
              className="w-full bg-[#161b22] border border-gray-700 text-white pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 text-xs"
              value={value}
              onChange={(e) => onChange(e.target.value)}
             />
          </div>
        )}
      </div>
    </div>
  );
}