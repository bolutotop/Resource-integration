'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Star, ThumbsUp, Loader2, PlayCircle, Share2, 
  MessageSquare, Heart, Server, Play, Calendar, Tag, Info 
} from 'lucide-react';
import Link from 'next/link';

// 组件引入
import Header from '@/components/Header';
import CommentSection from '@/components/CommentSection';
import UIPlayer from '@/components/UIPlayer'; // 1. 引入自定义播放器组件

// Action 引入
import { 
  getVideoById, 
  getRelatedVideos, 
  toggleVideoLike, 
  getVideoLikeStatus 
} from '@/app/actions/video';
import { getScraperDetailData, getScraperVideo } from '@/app/actions/scraper'; 

// Hook 引入
import { useAuthModal } from '@/context/AuthModalContext';
import { useRecordHistory } from '@/hooks/useRecordHistory';
import { useFavorite } from '@/hooks/useFavorite';

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); 
  const videoId = Number(id);
  const { openLoginModal } = useAuthModal(); 

  // --- 基础状态 ---
  const [video, setVideo] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 爬虫数据状态 ---
  const [detailData, setDetailData] = useState<any>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
   
  // --- 播放器状态 ---
  const [playingVideo, setPlayingVideo] = useState<{ url: string, type: 'native' | 'iframe' } | null>(null);
  const [resolving, setResolving] = useState(false);

  // --- 点赞状态 ---
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // --- 钩子：历史记录与收藏 ---
  useRecordHistory({
    id: videoId,
    type: 'MOVIE',
    title: video?.title || '',
    coverUrl: video?.coverUrl || '',
    routeUrl: `/movies/${videoId}`,
    enable: !!video 
  });

  const { isFavorited, handleToggleFavorite } = useFavorite({
    id: videoId,
    type: 'MOVIE',
    title: video?.title || '',
    coverUrl: video?.coverUrl || '',
    routeUrl: `/movies/${videoId}`
  });

  // --- 1. 初始化加载 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getVideoById(videoId);
        if (data) {
          setVideo(data);
          
          const currentSource = data.sourceSite || 'Age';
          console.log(`[Detail] 加载视频: ${data.title}, 源: ${currentSource}, ID: ${data.sourceId}`);

          const promises = [
            getRelatedVideos(videoId, data.type),
            getVideoLikeStatus(videoId),
            data.sourceId ? getScraperDetailData(data.sourceId, currentSource) : null
          ];

          const [related, likeStatus, scraperRes] = await Promise.all(promises);

          setRelatedVideos(related || []);
          if (likeStatus) {
            setIsLiked(likeStatus.isLiked);
            setLikesCount(likeStatus.likesCount);
          }
          if (scraperRes?.success) {
            setDetailData(scraperRes.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [videoId]);

  // --- 2. 核心播放逻辑 ---
  const handlePlay = async (playUrl: string) => {
    setResolving(true);
    setPlayingVideo(null); 
    try {
      const currentSource = video?.sourceSite || 'Age';
      const res = await getScraperVideo(playUrl, currentSource);
      
      if (res.success && res.data) {
        setPlayingVideo(res.data);
      } else {
        alert("视频解析失败，请尝试切换线路");
      }
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setResolving(false);
    }
  };

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
        if (res.message === "请先登录") openLoginModal();
      }
    } catch (error) {
      setIsLiked(prevIsLiked);
      setLikesCount(prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading && !video) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!video) return <div className="min-h-screen bg-[#0d1117] text-gray-400 flex items-center justify-center">视频未找到</div>;

  const playlists = detailData?.playlists || [];
  const dbTags = video.tags || [];

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans">
      <Header />

      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左侧：内容区 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. 播放器渲染 */}
            {/* ⚠️ 修改点：移除了 flex items-center justify-center，以便 UIPlayer 占满容器 */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-white/5">
              {resolving ? (
                // 解析中状态：需要手动居中
                <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-400">
                  <Loader2 size={40} className="animate-spin" />
                  <span className="text-sm font-medium">正在解析视频地址...</span>
                </div>
              ) : playingVideo ? (
                playingVideo.type === 'iframe' ? (
                  // Iframe 模式 (Age源等)
                  <iframe 
                    src={playingVideo.url} 
                    className="w-full h-full" 
                    allowFullScreen 
                    scrolling="no" 
                    frameBorder="0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  // Native 模式 (Yhmc源等) - 使用自定义 UIPlayer
                  // key 属性确保切换集数时组件完全重置
                  <UIPlayer key={playingVideo.url} url={playingVideo.url} />
                )
              ) : (
                // 未播放状态：需要手动居中
                <div className="h-full flex flex-col items-center justify-center text-gray-500 group">
                  <Play size={48} className="mx-auto mb-2 opacity-20 group-hover:scale-110 transition-transform" />
                  <p>请在下方选择集数开始播放</p>
                </div>
              )}
            </div>

            {/* 2. 视频信息 */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {video.title} 
                <span className="ml-3 text-xs font-normal px-2 py-1 bg-white/10 rounded text-gray-400">
                  {video.sourceSite || 'Age'}源
                </span>
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm mb-4">
                {/* 年份 */}
                {video.year && (
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg text-blue-400 border border-white/5">
                    <Calendar size={14} /> {video.year}
                  </span>
                )}
                
                {/* 状态 */}
                {video.status && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-green-500/10 text-green-400">
                    <Info size={14} /> {video.status}
                  </span>
                )}

                {/* 数据库标签遍历 */}
                {dbTags.map((tag: any) => (
                  <span key={tag.id} className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg text-gray-400 border border-white/5">
                    <Tag size={12} /> {tag.name}
                  </span>
                ))}
              </div>

              {/* 操作栏 */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor" /> {Number(video.rating || 0).toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <PlayCircle size={16} /> {video.views} 次播放
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={handleLike} disabled={likeLoading} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all border ${isLiked ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-[#161b22] text-gray-300 border-white/10 hover:bg-[#1f262e]'}`}>
                    <ThumbsUp size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span>{likesCount}</span>
                  </button>

                  <button onClick={handleToggleFavorite} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all border ${isFavorited ? 'bg-pink-600/20 text-pink-400 border-pink-500/50' : 'bg-[#161b22] text-gray-300 border-white/10 hover:bg-[#1f262e]'}`}>
                    <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
                    <span>{isFavorited ? '已收藏' : '收藏'}</span>
                  </button>

                  <button className="p-2 bg-[#161b22] hover:bg-[#1f262e] text-gray-300 rounded-full border border-white/10">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. 选集线路 */}
            {playlists.length > 0 ? (
              <div className="bg-[#161b22] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Server size={18} className="text-blue-400"/> 播放线路
                </h3>
                <div className="flex flex-wrap gap-2 mb-4 border-b border-white/5 pb-4">
                  {playlists.map((pl: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSourceIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeSourceIndex === idx ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {pl.sourceName}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {playlists[activeSourceIndex]?.episodes.map((ep: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handlePlay(ep.url)}
                      className={`px-2 py-2 border rounded text-xs transition-all truncate ${
                        playingVideo?.url === ep.url 
                        ? 'border-blue-500 bg-blue-600/20 text-blue-400' 
                        : 'border-white/5 bg-[#0d1117] text-gray-300 hover:bg-blue-600/10'
                      }`}
                    >
                      {ep.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
                <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 text-center text-gray-500">
                    正在获取播放列表或暂无资源...
                </div>
            )}

            {/* 4. 剧情简介 */}
            <div className="bg-[#161b22] rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500"/> 剧情简介
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-wrap">
                {detailData?.metadata?.description || video.description || '暂无简介...'}
              </p>
            </div>

            <CommentSection targetId={videoId} targetType="MOVIE" />
          </div>

          {/* 右侧：相关推荐 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4 pl-1 border-l-4 border-blue-500 leading-none">猜你喜欢</h3>
            <div className="flex flex-col gap-4">
              {relatedVideos.map((item) => (
                <Link key={item.id} href={`/movies/${item.id}`} className="flex gap-3 group">
                  <div className="w-32 aspect-video bg-gray-800 rounded-lg overflow-hidden relative shrink-0 border border-white/5">
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600"><PlayCircle /></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-sm font-bold text-gray-200 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-1">{item.year} · {item.type}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}