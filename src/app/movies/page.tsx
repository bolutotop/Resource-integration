'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, PlayCircle, Flame, Search } from 'lucide-react';
import Link from 'next/link';
import { getVideos } from '@/app/actions/video'; // 只保留本地接口
import Header from '@/components/Header';

// 简单的封面组件
const VideoCover = ({ src, title }: { src?: string | null, title: string }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
        <PlayCircle size={32} />
      </div>
    );
  }
  return (
    <img 
      src={src} 
      alt={title} 
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
      onError={() => setError(true)} 
    />
  );
};

export default function MoviesPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 搜索状态
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false); 

  // 初始化加载
  useEffect(() => {
    if (!isSearching) {
      fetchData('');
    }
  }, [isSearching]);

  const fetchData = async (search: string) => {
    setLoading(true);
    // 默认获取“首页”分类或者全部，根据你之前的逻辑调整
    const data = await getVideos('首页', search); 
    setVideos(data || []);
    setLoading(false);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!searchText.trim()) {
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      fetchData(searchText);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans flex flex-col relative">
      
      {/* 头部 (带搜索功能) */}
      <Header 
        searchText={searchText} 
        setSearchText={setSearchText} 
        onSearch={handleSearch} 
        showSearch={true}
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        
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
              <h2 className="text-xl font-bold text-white">最新推荐</h2>
            </>
          )}
        </div>

        {/* 内容列表 */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <>
            {videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Search size={48} className="opacity-20 mb-4" />
                <p>{isSearching ? '没有找到相关视频' : '暂无视频数据'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
                {videos.map((video) => (
                  <Link 
                    key={video.id} 
                    href={`/movies/${video.id}`} // 链接回原来的详情页
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
      </main>
    </div>
  );
}