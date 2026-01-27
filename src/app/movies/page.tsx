'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, Compass, MonitorPlay, Film, Tv, FileText, Search, PlayCircle, Loader2, Flame
} from 'lucide-react';
import Link from 'next/link';
import { getVideos } from '@/app/actions/video'; 

// 引入拆分出去的 Header 组件
import Header from '@/components/Header';

// --- VideoCover 组件 (保持不变) ---
const VideoCover = ({ src, title }: { src?: string | null, title: string }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
        <div className="flex flex-col items-center gap-2">
          <PlayCircle size={32} />
        </div>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={title} 
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      onError={() => setError(true)} 
    />
  );
};

// --- 分类配置 (保持不变) ---
const categories = [
  { name: '首页', icon: Home },
  { name: '电视剧', icon: Tv },
  { name: '电影', icon: Film },
  { name: '动漫', icon: MonitorPlay },
  { name: '综艺', icon: Compass },
  { name: '纪录片', icon: FileText },
];

export default function MoviesPage() {
  const [activeTab, setActiveTab] = useState('首页');
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
   
  // 搜索状态
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false); 

  const fetchData = async (category: string, search: string) => {
    setLoading(true);
    // 真实的 API 调用
    const data = await getVideos(category, search);
    setVideos(data || []); // 确保 data 是数组
    setLoading(false);
  };

  useEffect(() => {
    if (!isSearching) {
      fetchData(activeTab, '');
    }
  }, [activeTab, isSearching]);

  // 处理搜索回车事件
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!searchText.trim()) return;
      setIsSearching(true);
      setActiveTab(''); 
      fetchData('', searchText);
    }
  };

  // 处理分类点击 (同时也用于清空搜索状态)
  const handleCategoryClick = (categoryName: string) => {
    setActiveTab(categoryName);
    setIsSearching(false); 
    setSearchText('');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 flex font-sans selection:bg-teal-500/30 relative">
      
      {/* 侧边栏 */}
      <aside className="w-60 h-screen sticky top-0 bg-[#0d1117] flex flex-col border-r border-white/5 py-6 pl-4 pr-2 shrink-0 hidden md:flex">
        <div className="px-4 mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-green-400 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
            K
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Kali<span className="text-blue-500">Video</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === cat.name 
                  ? 'bg-gradient-to-r from-green-500/20 to-transparent text-green-400 font-bold border-l-2 border-green-500' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <cat.icon size={20} className={activeTab === cat.name ? "text-green-400" : "group-hover:text-white"} />
              <span>{cat.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 py-4 text-xs text-gray-600 space-y-2">
          <p>关于我们 • 合作</p>
          <p>© 2025 KaliVideo Dev</p>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 min-w-0 flex flex-col">
        
        {/* 1. Header 组件调用，显式开启 showSearch */}
        <Header 
          searchText={searchText} 
          setSearchText={setSearchText} 
          onSearch={handleSearch} 
          showSearch={true} // 明确显示搜索框
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
          
          {/* 首页 Banner 区 (仅在非搜索且首页Tab下显示) */}
          {!isSearching && activeTab === '首页' && (
            <div className="w-full aspect-[21/9] md:aspect-[32/9] bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl mb-10 relative overflow-hidden group cursor-pointer border border-white/5">
               <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1600&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60" />
               <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-[#0d1117] via-transparent">
                  <h2 className="text-4xl font-bold text-white mb-2">欢迎来到 KaliVideo</h2>
                  <p className="text-gray-300">私有部署的高性能影视库</p>
               </div>
            </div>
          )}

          {/* 标题栏 */}
          <div className="flex items-center gap-2 mb-6">
            {isSearching ? (
              <>
                <Search className="text-blue-500" size={24} />
                <h2 className="text-xl font-bold text-white">
                  "{searchText}" 的搜索结果 <span className="text-sm font-normal text-gray-500 ml-2">({videos.length})</span>
                </h2>
              </>
            ) : (
              <>
                <Flame className="text-red-500" fill="currentColor" />
                <h2 className="text-xl font-bold text-white">{activeTab === '首页' ? '最新推荐' : activeTab}</h2>
              </>
            )}
          </div>

          {/* 视频列表内容 */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <>
              {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Search size={48} className="opacity-20 mb-4" />
                  <p>{isSearching ? '没有找到相关视频' : '该分类下暂无视频'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
                  {videos.map((video) => (
                    <Link 
                      key={video.id} 
                      href={`/movies/${video.id}`}
                      className="group cursor-pointer flex flex-col gap-2"
                    >
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/5 shadow-lg bg-gray-900">
                        
                        <VideoCover src={video.coverUrl} title={video.title} />
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300">
                            <PlayCircle size={24} fill="currentColor" />
                          </div>
                        </div>

                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                          {video.type}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent flex items-end p-2 pointer-events-none">
                          <span className="text-xs text-gray-300 flex items-center gap-1">
                            <PlayCircle size={10} /> {video.views}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-gray-200 group-hover:text-green-400 transition-colors line-clamp-1">
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 group-hover:text-gray-400">
                          {video.description || '暂无简介'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
          
          <div className="h-20"></div>

        </div>
      </main>
    </div>
  );
}