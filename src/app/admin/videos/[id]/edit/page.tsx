'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, ArrowLeft, Layers, Hash, Film, Link2, 
  Star, FileText, Tv, Compass, MonitorPlay, 
  Image as ImageIcon, Upload, Loader2 
} from 'lucide-react';
import { updateVideo, getVideoById } from '@/app/actions/video';

// 视频类型定义
const VIDEO_TYPES = [
  { id: '电影', label: '电影', icon: Film },
  { id: '电视剧', label: '电视剧', icon: Tv },
  { id: '动漫', label: '动漫', icon: MonitorPlay },
  { id: '综艺', label: '综艺', icon: Compass },
  { id: '纪录片', label: '纪录片', icon: FileText },
];

// Next.js 15 写法：params 是 Promise
export default function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // 1. 解包 params
  const { id } = use(params);
  const videoId = Number(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // 上传状态
  const [initializing, setInitializing] = useState(true); // 初始化加载状态
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

  // 2. 加载旧数据进行回显
  useEffect(() => {
    const fetchVideo = async () => {
      const data = await getVideoById(videoId);
      if (data) {
        setForm({
          title: data.title,
          videoUrl: data.videoUrl,
          coverUrl: data.coverUrl || '', // 回显封面
          description: data.description || '',
          rating: data.rating.toString(),
          type: data.type,
          // 将对象数组转回逗号分隔字符串
          categories: data.categories.map((c: any) => c.name).join(', '),
          tags: data.tags.map((t: any) => t.name).join(', '),
        });
      } else {
        alert("未找到该视频");
        router.push('/admin/videos');
      }
      setInitializing(false);
    };
    fetchVideo();
  }, [videoId, router]);

  // 3. 处理更新提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // @ts-ignore (临时忽略类型检查，确保 coverUrl 传过去)
    const result = await updateVideo(videoId, form);
    
    if (result.success) {
      alert("修改保存成功！");
      router.push('/admin/videos');
    } else {
      alert(result.message);
    }
    setLoading(false);
  };

  // 4. 处理图片上传 (上传成功后自动更新 input)
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
      
      // 自动填入封面 URL 输入框
      setForm(prev => ({ ...prev, coverUrl: data.url }));
      
    } catch (error) {
      alert('图片上传出错');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const inputClass = "w-full bg-[#0d1117] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600";
  const labelClass = "block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2";

  if (initializing) {
    return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans flex justify-center p-6">
      <div className="w-full max-w-2xl">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">编辑视频 <span className="text-gray-500 text-lg">#{videoId}</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#161b22] border border-white/5 rounded-2xl p-8 shadow-xl space-y-8">
          
          {/* 类型选择 */}
          <div>
            <label className={labelClass}>视频类型</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {VIDEO_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.id })}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    form.type === type.id 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                      : 'bg-[#0d1117] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <type.icon size={20} />
                  <span className="text-xs font-bold">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* 剧名 & 评分 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>剧名/标题</label>
                <input type="text" required className={inputClass} value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>豆瓣评分</label>
                <input type="number" step="0.1" className={inputClass} value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} />
              </div>
            </div>

            {/* 视频源链接 */}
            <div>
              <label className={labelClass}><Link2 size={16} /> 视频源链接</label>
              <input type="url" required className={`${inputClass} font-mono text-blue-400`} value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} />
            </div>

            {/* --- 封面 URL + 上传按钮 (与添加页保持一致) --- */}
            <div>
              <label className={labelClass}><ImageIcon size={16} /> 视频封面</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="输入封面链接 或 点击右侧上传..." 
                  className={`${inputClass} flex-1`}
                  value={form.coverUrl}
                  onChange={e => setForm({...form, coverUrl: e.target.value})}
                />
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                <button 
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#21262d] hover:bg-[#30363d] border border-gray-700 text-gray-300 px-6 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                  {uploading ? '上传中' : '上传图片'}
                </button>
              </div>
            </div>

            {/* 分类 & 标签 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}><Layers size={16} /> 二级分类 (逗号分隔)</label>
                <input type="text" className={inputClass} value={form.categories} onChange={e => setForm({...form, categories: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}><Hash size={16} /> 搜索标签 (逗号分隔)</label>
                <input type="text" className={inputClass} value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
              </div>
            </div>

            {/* 简介 */}
            <div>
              <label className={labelClass}><FileText size={16} /> 剧情简介</label>
              <textarea rows={4} className={inputClass} value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
              {loading ? <span className="animate-pulse">保存修改...</span> : <><Save size={20} /> 保存修改</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}