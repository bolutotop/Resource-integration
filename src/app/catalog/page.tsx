'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { getVideos } from '@/app/actions/video';
import { Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation'; // 引入路由参数
import { useSource } from '@/context/SourceContext'; // 1. 引入 Context
import SourceSelector from '@/components/SourceSelector'; // 2. 引入源切换组件

// --- 分页逻辑抽取 ---
function CatalogContent() {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';
  
  const { currentSource } = useSource(); // 3. 获取当前数据源

  // 数据状态
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 筛选状态
  const [filters, setFilters] = useState({
    category: '全部',
    year: '全部',
    status: '全部'
  });

  const options = {
    category: ['全部', 'TV', '剧场版', 'OVA'],
    year: ['全部', '2026', '2025', '2024', '2023', '2022', '2021', '2000以前'],
    status: ['全部', '连载', '完结', '未播放']
  };

  // 监听源变化或搜索词变化，重置页码
  useEffect(() => {
    setPage(1);
  }, [currentSource, urlSearchQuery]);

  // 核心请求逻辑
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getVideos({
        source: currentSource, // 4. 传入当前选择的源
        search: urlSearchQuery, // 传入搜索词
        category: filters.category === '全部' ? undefined : filters.category,
        year: filters.year === '全部' ? undefined : filters.year,
        status: filters.status === '全部' ? undefined : filters.status,
        page: page,
        pageSize: 24
      });
      
      if (res && res.data) {
        setVideos(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
      } else {
        setVideos([]);
        setTotalPages(1);
        setTotalCount(0);
      }
      setLoading(false);
    };

    fetchData();
  }, [filters, page, urlSearchQuery, currentSource]); // 5. 依赖项同步

  const handleFilterChange = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1); 
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8">
      {/* 6. 源切换器与标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">
          {urlSearchQuery ? `搜索: ${urlSearchQuery}` : '全部片库'}
        </h1>
        <SourceSelector />
      </div>

      {/* 筛选区 */}
      <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 mb-8 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-white font-bold"><Filter size={18}/> 筛选片库</div>
          <span className="text-xs text-gray-500">共找到 {totalCount} 部资源</span>
        </div>
        
        {Object.entries(options).map(([key, opts]) => (
          <div key={key} className="flex gap-2 flex-wrap items-center">
            <span className="text-gray-500 text-sm py-1 w-12 shrink-0">
              {key === 'category' ? '类型' : key === 'year' ? '年份' : '状态'}:
            </span>
            {opts.map(opt => (
              <button key={opt} 
                onClick={() => handleFilterChange(key, opt)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  (filters as any)[key] === opt ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >{opt}</button>
            ))}
          </div>
        ))}
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {videos.map((video: any) => (
              <Link key={video.id} href={`/movies/${video.id}`} className="group block">
                <div className="aspect-[2/3] rounded-lg overflow-hidden relative border border-white/5 mb-2 bg-[#161b22]">
                  <img src={video.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {video.status}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400">{video.title}</h3>
                <p className="text-[10px] text-gray-500">{video.year}</p>
              </Link>
            ))}
          </div>
          {videos.length === 0 && <div className="text-center py-20 text-gray-500">没有找到相关视频</div>}
        </>
      )}

      {/* 分页组件 */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 mb-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-[#161b22] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeft size={18} />
          </button>
          {getPageNumbers().map(p => (
            <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-[#161b22] text-gray-400 hover:text-white'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-[#161b22] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// --- 主页面入口 (处理 Suspense) ---
export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200">
      <Header />
      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>}>
        <CatalogContent />
      </Suspense>
    </div>
  );
}