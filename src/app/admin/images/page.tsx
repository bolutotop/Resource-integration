'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Trash2, Copy, Check, Upload, ImageIcon, Loader2, 
  LayoutGrid, List as ListIcon, Search, Calendar, Link2
} from 'lucide-react';
import { getImages, deleteImage } from '@/app/actions/image';

export default function ImageLibraryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    const data = await getImages();
    setImages(data);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      try {
        await fetch('/api/upload', { method: 'POST', body: formData });
      } catch (err) {
        console.error(err);
      }
    }
    await loadImages();
    setUploading(false);
  };

  const handleDelete = async (id: number, filename: string) => {
    if (!confirm(`确定删除 "${filename}" 吗？此操作不可恢复。`)) return;
    const res = await deleteImage(id, filename);
    if (res.success) {
      setImages(prev => prev.filter(img => img.id !== id));
    } else {
      alert('删除失败');
    }
  };

  const handleCopy = async (url: string, id: number) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showSuccess(id);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showSuccess(id);
      } catch (e) {
        alert("复制失败，请手动复制");
      }
      document.body.removeChild(textArea);
    }
  };

  const showSuccess = (id: number) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredImages = images.filter(img => 
    img.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
    img.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-8 font-sans">
      
      {/* 顶部 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">媒体库</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有上传的图片资源</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           
           {/* 搜索框 */}
           <div className="relative group flex items-center">
             <input 
               type="text" 
               placeholder="搜索文件名..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               // --- 修改点：pl-4 (左侧标准间距), pr-10 (右侧留出图标空间) ---
               className="bg-[#161b22] border border-gray-700 text-sm rounded-lg pl-4 pr-10 h-10 focus:outline-none focus:border-blue-500 text-gray-200 w-full md:w-64 transition-all shadow-sm"
             />
             {/* --- 修改点：absolute right-3 (图标靠右) --- */}
             <Search className="absolute right-3 text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={16} />
           </div>

           {/* 视图切换按钮 */}
           <div className="flex bg-[#161b22] border border-gray-700 rounded-lg p-1 shadow-sm h-10 items-center">
             <button 
               onClick={() => setViewMode('grid')}
               className={`h-full px-2 rounded-md transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
               title="网格视图"
             >
               <LayoutGrid size={18} />
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`h-full px-2 rounded-md transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
               title="列表视图"
             >
               <ListIcon size={18} />
             </button>
           </div>

           {/* 上传按钮 */}
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={uploading}
             className="bg-blue-600 hover:bg-blue-500 text-white px-5 h-10 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg hover:shadow-blue-900/30 hover:scale-105 active:scale-95 disabled:opacity-50 text-sm whitespace-nowrap"
           >
             {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
             上传图片
           </button>
           <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 min-h-[500px] shadow-xl">
        {loading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <>
            {filteredImages.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-60 text-gray-500 gap-4">
                 <div className="bg-[#0d1117] p-4 rounded-full border border-gray-800">
                    <ImageIcon size={48} className="opacity-20" />
                 </div>
                 <p>暂无图片，点击右上角上传</p>
               </div>
            ) : (
              <>
                {/* --- 网格视图 --- */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {filteredImages.map((img) => (
                      <div key={img.id} className="group bg-[#0d1117] rounded-lg border border-white/10 overflow-hidden hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 flex flex-col">
                        <div className="relative aspect-[4/3] bg-[#21262d] overflow-hidden">
                          <img src={img.url} alt={img.filename} className="w-full h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button 
                               onClick={() => handleCopy(img.url, img.id)}
                               className="bg-white text-black text-[10px] px-2 py-1 rounded-full font-bold hover:bg-gray-200 flex items-center gap-1 shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                             >
                               {copiedId === img.id ? <Check size={12} /> : <Copy size={12} />}
                               {copiedId === img.id ? '已复制' : '复制'}
                             </button>
                          </div>
                        </div>
                        
                        <div className="p-2 flex flex-col gap-1">
                           <div className="text-[10px] text-gray-300 font-medium truncate" title={img.filename}>
                             {img.filename}
                           </div>
                           <div className="flex items-center justify-between mt-auto">
                              <span className="text-[9px] text-gray-500 flex items-center gap-1">
                                <Calendar size={8} />
                                {new Date(img.createdAt).toLocaleDateString()}
                              </span>
                              <button 
                                onClick={() => handleDelete(img.id, img.filename)}
                                className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                                title="删除图片"
                              >
                                <Trash2 size={12} />
                              </button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* --- 列表视图 --- */}
                {viewMode === 'list' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-wider bg-white/5">
                          <th className="px-4 py-3 w-16">预览</th>
                          <th className="px-4 py-3">文件名</th>
                          <th className="px-4 py-3">链接</th>
                          <th className="px-4 py-3">上传时间</th>
                          <th className="px-4 py-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {filteredImages.map((img) => (
                          <tr key={img.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-2">
                              <div className="w-10 h-10 bg-[#21262d] rounded overflow-hidden border border-white/10">
                                <img src={img.url} className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="px-4 py-2 font-medium text-white max-w-xs truncate text-xs md:text-sm">
                              {img.filename}
                            </td>
                            <td className="px-4 py-2 max-w-xs truncate text-gray-500 font-mono text-xs">
                              <div className="flex items-center gap-2 group-hover:text-blue-400 transition-colors cursor-pointer" onClick={() => handleCopy(img.url, img.id)}>
                                <Link2 size={12} />
                                <span className="truncate">{img.url}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-500 text-xs">
                              {new Date(img.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right">
                               <div className="flex items-center justify-end gap-2">
                                 <button 
                                    onClick={() => handleCopy(img.url, img.id)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors flex items-center gap-1
                                      ${copiedId === img.id 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                      }`}
                                 >
                                    {copiedId === img.id ? <Check size={12} /> : <Copy size={12} />}
                                    {copiedId === img.id ? '已复制' : '复制'}
                                 </button>
                                 <button 
                                   onClick={() => handleDelete(img.id, img.filename)}
                                   className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}