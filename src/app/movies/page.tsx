'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { getVideos, getHomeGroupedData } from '@/app/actions/video'; // 引入新的 API
import { Flame, Clock, ChevronRight, PlayCircle } from 'lucide-react';
import { useSource } from '@/context/SourceContext';
import SourceSelector from '@/components/SourceSelector';

// --- 通用视频卡片 ---
const VideoCard = ({ video }: { video: any }) => (
  <Link href={`/movies/${video.id}`} className="group block w-36 md:w-44 shrink-0">
    <div className="aspect-[2/3] rounded-lg overflow-hidden relative border border-white/5 mb-2 bg-[#161b22]">
      <img src={video.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
        {video.status}
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
        <PlayCircle className="text-white w-10 h-10 drop-shadow-lg" />
      </div>
    </div>
    <h3 className="text-xs md:text-sm font-bold text-gray-200 truncate group-hover:text-blue-400">{video.title}</h3>
    <p className="text-[10px] text-gray-500 truncate">{video.type}</p>
  </Link>
);

// --- 横向滚动板块 ---
const SectionRow = ({ title, videos, icon: Icon, colorClass }: any) => {
  if (!videos || videos.length === 0) return null;
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 text-white">
          {Icon && <Icon className={colorClass} size={20} />}
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        </div>
        <Link href="/catalog" className="text-xs text-gray-500 hover:text-white flex items-center">
          更多 <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {videos.map((v: any) => <VideoCard key={v.id} video={v} />)}
      </div>
    </section>
  );
};

export default function HomePage() {
  const { currentSource } = useSource();
  const [loading, setLoading] = useState(true);

  // Age 模式数据
  const [ageRecommends, setAgeRecommends] = useState([]);
  const [ageRecents, setAgeRecents] = useState([]);

  // Yhmc 模式数据 (动态数组)
  const [yhmcSections, setYhmcSections] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);

    if (currentSource === 'Age') {
      // Age 逻辑：保持手动分发的请求
      Promise.all([
        getVideos({ isRecommended: true, pageSize: 12, source: 'Age' }),
        getVideos({ isRecent: true, pageSize: 18, source: 'Age' })
      ]).then(([rec, recent]) => {
        setAgeRecommends(rec.data as any);
        setAgeRecents(recent.data as any);
        setLoading(false);
      });

    } else if (currentSource === 'Yhmc') {
      // Yhmc 逻辑：调用后端聚合后的分组数据
      getHomeGroupedData('Yhmc').then((groupedData: any) => {
        const sections = Object.entries(groupedData).map(([key, list]) => ({
          title: key === '正在热映' ? key : `最新${key}`,
          videos: list,
          colorClass: key === '正在热映' ? 'text-red-500' : 'text-blue-400',
          icon: key === '正在热映' ? Flame : Clock
        }));

        // 排序：正在热映置顶
        sections.sort((a, b) => (a.title === '正在热映' ? -1 : 1));

        setYhmcSections(sections);
        setLoading(false);
      });
    }
  }, [currentSource]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200">
      <Header />
      
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        {/* 顶部标题栏 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {currentSource === 'Age' ? 'Age 动漫' : '樱花动漫 (Yhmc)'}
            </h1>
            <SourceSelector />
          </div>
          <Link href="/catalog" className="text-sm text-blue-400 hover:text-blue-300 pb-2">
            浏览全部片库 &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-500 italic">加载中...</div>
        ) : (
          <>
            {/* Age 布局 */}
            {currentSource === 'Age' && (
              <>
                <SectionRow title="今日推荐" videos={ageRecommends} icon={Flame} colorClass="text-red-500" />
                <section>
                  <div className="flex items-center gap-2 mb-4 text-white">
                    <Clock className="text-green-500" size={20} /> 
                    <h2 className="text-xl font-bold">最近更新</h2>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {ageRecents.map((v: any) => <VideoCard key={v.id} video={v} />)}
                  </div>
                </section>
              </>
            )}

            {/* Yhmc 布局：动态渲染所有板块 */}
            {currentSource === 'Yhmc' && (
              <div className="space-y-2">
                {yhmcSections.map((section) => (
                  <SectionRow 
                    key={section.title}
                    title={section.title} 
                    videos={section.videos} 
                    icon={section.icon} 
                    colorClass={section.colorClass} 
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}