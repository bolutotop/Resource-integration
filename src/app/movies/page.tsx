'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { getVideos } from '@/app/actions/video';
import { PlayCircle, Flame, Clock, Loader2, ChevronRight } from 'lucide-react';

// --- 组件部分 ---

// 1. 封面组件
const VideoCover = ({ src, title, status }: { src?: string | null, title: string, status?: string }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
        <PlayCircle size={32} />
      </div>
    );
  }

  return (
    <>
      <img 
        src={src} 
        alt={title} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        onError={() => setError(true)} 
      />
      {/* 状态角标 */}
      {status && (
        <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
          {status}
        </div>
      )}
    </>
  );
};

// 2. 视频卡片组件
const VideoCard = ({ video, className = "" }: { video: any, className?: string }) => (
  <Link 
    href={`/movies/${video.id}`} 
    className={`group block shrink-0 ${className}`}
  >
    <div className="aspect-[2/3] rounded-lg overflow-hidden relative border border-white/5 mb-2 bg-gray-900 shadow-md">
      <VideoCover src={video.coverUrl} title={video.title} status={video.status} />
      
      {/* 悬停时的遮罩层 */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none" />
      
      {/* 悬停播放按钮效果 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <div className="bg-green-500/90 rounded-full p-2 text-white shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
            <PlayCircle size={20} fill="currentColor" />
         </div>
      </div>
    </div>

    <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400 transition-colors">
      {video.title}
    </h3>
    <p className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
      <span>{video.year || '未知年份'}</span>
      <span className="bg-gray-800 px-1 rounded text-gray-400">{video.type}</span>
    </p>
  </Link>
);

// --- 主页面 ---

export default function HomePage() {
  const [recommends, setRecommends] = useState<any[]>([]);
  const [recents, setRecents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // --- 修改开始: 按照你的要求更新了参数和数据读取逻辑 ---
        
        // 使用 Promise.all 并行请求
        const [recRes, recentRes] = await Promise.all([
          getVideos({ isRecommended: true, pageSize: 12 } as any), // 首页只需少量推荐
          getVideos({ isRecent: true, pageSize: 18 } as any)       // 首页显示最近更新
        ]);
        
        // ⚠️ 修改点：访问 .data 属性 (这里加了 || [] 防止接口返回 null 导致报错)
        setRecommends(recRes.data || []);
        setRecents(recentRes.data || []);

        // --- 修改结束 ---

      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans">
      <Header />
      
      <main className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-12">
        
        {/* Banner / 头部引导 */}
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
           <div>
             <h1 className="text-3xl font-bold text-white tracking-tight">发现动漫</h1>
             <p className="text-gray-500 text-sm mt-1">探索最新、最热的动漫影视内容</p>
           </div>
           <Link href="/catalog" className="flex items-center text-sm text-blue-500 hover:text-blue-400 transition-colors group">
             浏览全部片库 <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <>
            {/* 1. 今日推荐 (横向滚动) */}
            {recommends.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <Flame className="text-red-500" fill="currentColor" /> 
                  <h2 className="text-xl font-bold">今日推荐</h2>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 -mx-1 scroll-smooth">
                  {recommends.map((v: any) => (
                    <VideoCard key={v.id} video={v} className="w-36 md:w-44 lg:w-48" />
                  ))}
                </div>
              </section>
            )}

            {/* 2. 最近更新 (网格布局) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Clock className="text-green-500" /> 
                <h2 className="text-xl font-bold">最近更新</h2>
              </div>
              
              {recents.length === 0 ? (
                <div className="text-gray-500 text-sm">暂无更新数据</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                  {recents.map((v: any) => (
                    <VideoCard key={v.id} video={v} className="w-full" />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}