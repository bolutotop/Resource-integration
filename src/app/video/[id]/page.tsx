'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Play, Star, Tag, Clock, 
  Share2, ThumbsUp, MessageSquare, Loader2, PlayCircle, MoreHorizontal, User, Search, Download
} from 'lucide-react';
import { getVideoById, getRelatedVideos } from '@/app/actions/video';
import Link from 'next/link';

// 引入统一 Header
import Header from '@/components/Header';
// 引入播放器组件
import UIPlayer from '@/components/UIPlayer'; 

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Next.js 15: 使用 use() 解包 params
  const { id } = use(params); 
  const videoId = Number(id);

  const [video, setVideo] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 获取视频详情
      const data = await getVideoById(videoId);
      if (data) {
        setVideo(data);
        // 获取相关推荐
        const related = await getRelatedVideos(videoId, data.type);
        setRelatedVideos(related);
      }
      setLoading(false);
    };
    fetchData();
  }, [videoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-gray-400">
        <p>视频未找到</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline">返回上一页</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans">
      
      {/* 1. 统一的 Header (不传搜索props，保持默认样式) */}
      <Header />

      {/* 主体内容 */}
      <div className="max-w-[1800px] mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
        
        {/* 左侧：播放器与信息 */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              {video.title} 
              <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{video.type}</span>
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-green-400"><PlayCircle size={12}/> {video.views} 播放</span>
              <span>{video.createdAt ? new Date(video.createdAt).toLocaleDateString() : '未知日期'}</span>
              <span className="flex items-center gap-1 text-yellow-500"><Star size={12} fill="currentColor"/> {video.rating}</span>
            </div>
          </div>

          {/* 播放器容器 */}
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 mb-4">
            <UIPlayer url={video.videoUrl} /> 
          </div>

          {/* 工具栏 */}
          <div className="flex items-center justify-between py-2 border-b border-white/5 pb-6">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition"><ThumbsUp size={20} /> <span className="text-sm">点赞</span></button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition"><Star size={20} /> <span className="text-sm">收藏</span></button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition"><Download size={20} /> <span className="text-sm">下载</span></button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-white transition"><Share2 size={20} /> <span className="text-sm">分享</span></button>
            </div>
            <button className="text-gray-500 hover:text-white"><MoreHorizontal size={20} /></button>
          </div>

          {/* 评论区 (静态示例) */}
          <div className="mt-6">
            <h3 className="font-bold text-lg mb-4">评论</h3>
            <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-700 shrink-0"></div>
              <div className="flex-1">
                <textarea className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 min-h-[80px]" placeholder="发条弹幕..."></textarea>
                <div className="flex justify-end mt-2">
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-medium">发表</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：侧边栏 */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
          
          {/* 简介卡片 */}
          <div className="bg-[#161b22] rounded-xl p-4 border border-white/5">
            <div className="flex justify-between items-start mb-2">
               <h2 className="font-bold text-lg text-white">详情</h2>
               <div className="flex items-baseline gap-1 text-green-500">
                  <span className="text-xl font-bold font-mono">{video.rating}</span>
                  <span className="text-xs">分</span>
               </div>
            </div>
            <div className="text-xs text-gray-400 mb-3 flex flex-wrap gap-2">
               {video.tags?.map((tag: any) => (
                 <span key={tag.id} className="border border-white/10 px-1.5 py-0.5 rounded">{tag.name}</span>
               ))}
            </div>
            <p className="text-sm text-gray-400 line-clamp-6 leading-relaxed">
              {video.description || "暂无简介"}
            </p>
          </div>

          {/* 相关推荐列表 */}
          <div className="bg-[#161b22] rounded-xl p-4 border border-white/5">
            <h3 className="font-bold text-white mb-4">相关推荐</h3>
            <div className="flex flex-col gap-4">
              {relatedVideos.length > 0 ? relatedVideos.map((item: any) => (
                <Link key={item.id} href={`/video/${item.id}`} className="flex gap-3 group cursor-pointer">
                  <div className="w-32 aspect-video relative rounded-lg overflow-hidden shrink-0 bg-gray-800">
                     {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600"><PlayCircle /></div>
                     )}
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <h4 className="text-sm text-gray-300 font-medium line-clamp-2 group-hover:text-green-400 transition-colors">
                      {item.title}
                    </h4>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <PlayCircle size={10} /> {item.views}
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="text-sm text-gray-500">暂无相关推荐</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}