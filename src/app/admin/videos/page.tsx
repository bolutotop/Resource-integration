'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Film, Tv, MonitorPlay, 
  Compass, FileText, Loader2, MoreHorizontal 
} from 'lucide-react';
import Link from 'next/link';
import { getVideos, deleteVideo } from '@/app/actions/video';
import { useRouter } from 'next/navigation';

export default function VideoManagementPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // 这里为了方便，我们直接获取所有视频。实际生产中应该做分页。
    const data = await getVideos('首页'); 
    setVideos(data);
    setLoading(false);
  };

  // 删除处理
  const handleDelete = async (id: number, title: string) => {
    if (confirm(`确定要永久删除 "${title}" 吗？此操作不可恢复。`)) {
      const res = await deleteVideo(id);
      if (res.success) {
        // 从本地状态移除，避免重新请求
        setVideos(prev => prev.filter(v => v.id !== id));
      } else {
        alert("删除失败，请重试");
      }
    }
  };

  // 简单的过滤逻辑
  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-8 font-sans">
      
      {/* 顶部 Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">视频管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有影视资源、分类及标签</p>
        </div>
        
        {/* 这里就是你要的：添加视频按钮 */}
        <Link 
          href="/admin/add" 
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-green-900/20 hover:scale-105 active:scale-95"
        >
          <Plus size={20} /> 添加新视频
        </Link>
      </div>

      {/* 搜索与过滤栏 */}
      <div className="bg-[#161b22] border border-white/5 rounded-xl p-4 mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
           <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
           <input 
             type="text" 
             placeholder="搜索视频标题..." 
             className="w-full bg-[#0d1117] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* 表格区域 */}
      <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm bg-white/5">
                <th className="p-4 font-medium w-20">ID</th>
                <th className="p-4 font-medium">封面/标题</th>
                <th className="p-4 font-medium">类型</th>
                <th className="p-4 font-medium">评分</th>
                <th className="p-4 font-medium">播放量</th>
                <th className="p-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVideos.map((video) => (
                <tr key={video.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-gray-500 font-mono text-xs">#{video.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 bg-gray-800 rounded overflow-hidden shrink-0 border border-white/10">
                         {video.coverUrl && <img src={video.coverUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm line-clamp-1">{video.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{video.videoUrl}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border border-white/10
                      ${video.type === '电影' ? 'bg-blue-900/30 text-blue-400' : 
                        video.type === '电视剧' ? 'bg-green-900/30 text-green-400' :
                        video.type === '动漫' ? 'bg-purple-900/30 text-purple-400' : 'bg-gray-800 text-gray-400'}
                    `}>
                      {video.type}
                    </span>
                  </td>
                  <td className="p-4 text-yellow-500 font-bold text-sm">{video.rating}</td>
                  <td className="p-4 text-gray-400 text-sm">{video.views}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* 编辑按钮：跳转到编辑页 */}
                      <Link 
                        href={`/admin/videos/${video.id}/edit`}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </Link>
                      
                      {/* 删除按钮 */}
                      <button 
                        onClick={() => handleDelete(video.id, video.title)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && filteredVideos.length === 0 && (
          <div className="py-20 text-center text-gray-500">暂无数据</div>
        )}
      </div>
    </div>
  );
}