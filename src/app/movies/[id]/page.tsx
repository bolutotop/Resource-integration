'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Star, 
  ThumbsUp, 
  Loader2, 
  PlayCircle, 
  Share2, 
  MessageSquare,
  Heart
} from 'lucide-react';
import Link from 'next/link';

// 引入统一 Header
import Header from '@/components/Header';
// 引入播放器组件
import UIPlayer from '@/components/UIPlayer'; 
// 引入评论组件 (New)
import CommentSection from '@/components/CommentSection';

// 引入 Action
import { 
  getVideoById, 
  getRelatedVideos, 
  toggleVideoLike, 
  getVideoLikeStatus 
} from '@/app/actions/video';

// 引入 Context Hook
import { useAuthModal } from '@/context/AuthModalContext';

// 引入历史记录 Hook
import { useRecordHistory } from '@/hooks/useRecordHistory';

// 引入收藏 Hook
import { useFavorite } from '@/hooks/useFavorite';

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Next.js 15: 使用 use() 解包 params
  const { id } = use(params); 
  const videoId = Number(id);

  // 获取登录弹窗控制权
  const { openLoginModal } = useAuthModal(); 

  const [video, setVideo] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 点赞状态管理 ---
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // --- 历史记录集成 ---
  useRecordHistory({
    id: videoId,
    type: 'MOVIE',
    title: video?.title || '',
    coverUrl: video?.coverUrl || '',
    routeUrl: `/movies/${videoId}`,
    enable: !!video 
  });

  // --- 收藏功能 ---
  const { isFavorited, handleToggleFavorite } = useFavorite({
    id: videoId,
    type: 'MOVIE',
    title: video?.title || '',
    coverUrl: video?.coverUrl || '',
    routeUrl: `/movies/${videoId}`
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 获取视频基本信息
        const data = await getVideoById(videoId);
        
        if (data) {
          setVideo(data);
          
          // 并行请求：相关推荐 & 点赞状态
          const [related, likeStatus] = await Promise.all([
            getRelatedVideos(videoId, data.type),
            getVideoLikeStatus(videoId)
          ]);

          setRelatedVideos(related || []);
          
          // 设置点赞初始状态
          if (likeStatus) {
            setIsLiked(likeStatus.isLiked);
            setLikesCount(likeStatus.likesCount);
          }
        }
      } catch (error) {
        console.error("Failed to fetch video details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [videoId]);

  // --- 处理点赞点击 (乐观更新 + 登录拦截) ---
  const handleLike = async () => {
    if (likeLoading) return;
    
    const prevIsLiked = isLiked;
    const prevCount = likesCount;
    
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    setLikeLoading(true);

    try {
      const res = await toggleVideoLike(videoId);
      
      if (!res.success) {
        setIsLiked(prevIsLiked);
        setLikesCount(prevCount);

        if (res.message === "请先登录") {
          openLoginModal();
        } else {
          console.error(res.message);
        }
      }
    } catch (error) {
      setIsLiked(prevIsLiked);
      setLikesCount(prevCount);
      console.error("Like toggle failed:", error);
    } finally {
      setLikeLoading(false);
    }
  };

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
        <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline flex items-center gap-1">
          <ArrowLeft size={16}/> 返回上一页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans">
      <Header />

      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 左侧主要内容区 (占2列) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. 播放器容器 */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group border border-white/5">
                 <UIPlayer url={video.videoUrl} />
              </div>
              
              {/* 2. 标题、操作栏与简介 */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{video.title}</h1>
                
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                   <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Star size={16} fill="currentColor" /> {Number(video.rating).toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle size={16} /> {video.views} 次播放
                      </span>
                      <span className="bg-[#161b22] px-2 py-0.5 rounded border border-white/10 text-xs">
                        {video.type}
                      </span>
                   </div>

                   {/* --- 操作按钮组 --- */}
                   <div className="flex items-center gap-3">
                      {/* 点赞按钮 */}
                      <button 
                        onClick={handleLike}
                        disabled={likeLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all active:scale-95 ${
                          isLiked 
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' 
                            : 'bg-[#161b22] text-gray-300 hover:bg-[#1f262e] border border-white/10'
                        }`}
                      >
                        <ThumbsUp size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-[bounce_0.4s_ease-in-out]" : ""} />
                        <span>{likesCount > 0 ? likesCount : '点赞'}</span>
                      </button>

                      {/* 收藏按钮 */}
                      <button 
                        onClick={handleToggleFavorite}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all active:scale-95 border ${
                          isFavorited
                            ? 'bg-pink-600/20 text-pink-400 border-pink-500/50'
                            : 'bg-[#161b22] text-gray-300 hover:bg-[#1f262e] border-white/10'
                        }`}
                      >
                        <Heart size={18} fill={isFavorited ? "currentColor" : "none"} className={isFavorited ? "animate-pulse" : ""} />
                        <span>{isFavorited ? '已收藏' : '收藏'}</span>
                      </button>

                      {/* 分享按钮 */}
                      <button className="flex items-center gap-2 px-4 py-2 bg-[#161b22] hover:bg-[#1f262e] text-gray-300 rounded-full border border-white/10 transition-colors">
                        <Share2 size={18} /> <span className="hidden sm:inline">分享</span>
                      </button>
                   </div>
                </div>

                {/* 简介卡片 */}
                <div className="bg-[#161b22] rounded-xl p-6 border border-white/5">
                   <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                     <MessageSquare size={18} className="text-blue-500"/> 剧情简介
                   </h3>
                   <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-wrap">
                     {video.description || '暂无简介...'}
                   </p>
                </div>
              </div>

              {/* 3. 评论区模块 (New) */}
              <CommentSection targetId={videoId} targetType="MOVIE" />

            </div>

            {/* 右侧：相关推荐 (占1列) */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4 pl-1 border-l-4 border-blue-500 leading-none">猜你喜欢</h3>
              
              <div className="flex flex-col gap-4">
                {relatedVideos.length > 0 ? relatedVideos.map((item) => (
                  <Link key={item.id} href={`/movies/${item.id}`} className="flex gap-3 group">
                      <div className="w-40 aspect-video bg-gray-800 rounded-lg overflow-hidden relative shrink-0 border border-white/5">
                         {item.coverUrl ? (
                           <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-600"><PlayCircle /></div>
                         )}
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                      <div className="flex flex-col py-1">
                          <h4 className="text-sm font-bold text-gray-200 line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight">
                            {item.title}
                          </h4>
                          <div className="mt-auto text-xs text-gray-500 flex items-center gap-2">
                            <span className="bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">{item.type}</span>
                            <span>{item.views} 播放</span>
                          </div>
                      </div>
                  </Link>
                )) : (
                  <div className="text-gray-500 text-sm py-4 text-center">暂无相关推荐</div>
                )}
              </div>
            </div>

         </div>
      </div>
    </div>
  );
}