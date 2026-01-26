'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, ArrowLeft, Layers, Hash, Film, Link2, 
  Star, FileText, Tv, Compass, MonitorPlay, 
  Image as ImageIcon, Upload, Loader2 
} from 'lucide-react';
import { addVideo } from '@/app/actions/video';

// 视频类型定义
const VIDEO_TYPES = [
  { id: '电影', label: '电影', icon: Film },
  { id: '电视剧', label: '电视剧', icon: Tv },
  { id: '动漫', label: '动漫', icon: MonitorPlay },
  { id: '综艺', label: '综艺', icon: Compass },
  { id: '纪录片', label: '纪录片', icon: FileText },
];

export default function AddVideoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // 上传状态
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    title: '',
    videoUrl: '',
    coverUrl: '', // 封面 URL
    description: '',
    rating: '',
    categories: '',
    tags: '',
    type: '电影'
  });

  // 处理整个表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // @ts-ignore
    const result = await addVideo(form);
    if (result.success) {
      alert(result.message);
      router.push('/admin/videos');
    } else {
      alert(result.message);
    }
    setLoading(false);
  };

  // 处理图片上传逻辑
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('上传失败');
      
      const data = await res.json();
      
      // --- 核心逻辑：上传成功后，自动填入输入框 ---
      setForm(prev => ({ ...prev, coverUrl: data.url }));
      
    } catch (error) {
      alert('图片上传出错');
    } finally {
      setUploading(false);
      // 清空 input 防止重复上传同一张不触发 onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const inputClass = "w-full bg-[#0d1117] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600";
  const labelClass = "block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2";

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans flex justify-center p-6">
      <div className="w-full max-w-2xl">
        
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">添加新资源</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#161b22] border border-white/5 rounded-2xl p-8 shadow-xl space-y-8">
          
          {/* 1. 视频类型选择 */}
          <div>
            <label className={labelClass}>视频类型</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {VIDEO_TYPES.map((type) => {
                const isSelected = form.type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm({ ...form, type: type.id })}
                    className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-[#0d1117] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <type.icon size={20} />
                    <span className="text-xs font-bold">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            {/* 剧名 & 评分 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>剧名/标题</label>
                <input 
                  type="text" required placeholder="例如：黑客帝国" 
                  className={inputClass}
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClass}>豆瓣评分</label>
                <input 
                  type="number" step="0.1" min="0" max="10" placeholder="0.0" 
                  className={inputClass}
                  value={form.rating}
                  onChange={e => setForm({...form, rating: e.target.value})}
                />
              </div>
            </div>

            {/* 视频源链接 */}
            <div>
              <label className={labelClass}><Link2 size={16} /> 视频源链接 (M3U8/MP4)</label>
              <input 
                type="url" required placeholder="https://..." 
                className={`${inputClass} font-mono text-blue-400`}
                value={form.videoUrl}
                onChange={e => setForm({...form, videoUrl: e.target.value})}
              />
            </div>

            {/* --- 修改点：封面 URL + 上传按钮 --- */}
            <div>
              <label className={labelClass}><ImageIcon size={16} /> 视频封面</label>
              <div className="flex gap-3">
                {/* 封面 URL 输入框 */}
                <input 
                  type="text" 
                  placeholder="输入封面链接 或 点击右侧上传..." 
                  className={`${inputClass} flex-1`}
                  value={form.coverUrl}
                  onChange={e => setForm({...form, coverUrl: e.target.value})}
                />
                
                {/* 隐藏的文件输入框 */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                {/* 上传按钮 */}
                <button 
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#21262d] hover:bg-[#30363d] border border-gray-700 text-gray-300 px-6 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Upload size={18} />
                  )}
                  {uploading ? '上传中' : '上传图片'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                支持粘贴网络图片链接，或点击按钮上传本地图片（会自动填入链接）。
              </p>
            </div>

            {/* 分类 & 标签 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>
                  <Layers size={16} /> 二级分类 
                  <span className="text-xs text-gray-600 ml-auto">(逗号分隔)</span>
                </label>
                <input 
                  type="text" placeholder="科幻, 动作" 
                  className={inputClass}
                  value={form.categories}
                  onChange={e => setForm({...form, categories: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Hash size={16} /> 搜索标签
                  <span className="text-xs text-gray-600 ml-auto">(逗号分隔)</span>
                </label>
                <input 
                  type="text" placeholder="基努里维斯, 经典" 
                  className={inputClass}
                  value={form.tags}
                  onChange={e => setForm({...form, tags: e.target.value})}
                />
              </div>
            </div>

            {/* 简介 */}
            <div>
              <label className={labelClass}><FileText size={16} /> 剧情简介</label>
              <textarea 
                rows={4} placeholder="输入剧情简介..." 
                className={inputClass}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
              {loading ? <span className="animate-pulse">保存中...</span> : <><Save size={20} /> 确认添加</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}