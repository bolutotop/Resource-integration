'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import { getVideos, getFilterOptions } from '@/app/actions/video'; // 引入 getFilterOptions
import { Loader2, Filter, Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSource } from '@/context/SourceContext';
import SourceSelector from '@/components/SourceSelector';

// --- 核心内容组件 ---
function CatalogContent() {
  const searchParams = useSearchParams();
  // const router = useRouter(); // 如果暂时不用路由跳转，可以先注释
  const { currentSource } = useSource();

  // --- 状态定义 ---
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 1. 动态筛选选项状态
  const [dynamicOptions, setDynamicOptions] = useState<{
    categories: string[];
    years: string[];
  }>({ categories: [], years: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);

  // 2. 当前选中的筛选值
  const [filters, setFilters] = useState({
    category: '全部',
    year: '全部',
    status: '全部'
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 固定状态选项 (如果源支持状态筛选，可以在这里配置)
  // const STATUS_OPTIONS = ['全部', '连载', '完结', '未播放'];

  // --- 3. 当源改变时：获取该源的筛选选项 + 重置筛选 ---
  useEffect(() => {
    const initSourceData = async () => {
      setOptionsLoading(true);
      // 重置筛选条件，防止切换源后残留旧源的筛选值（如 "剧场版" 在新源中不存在）
      setFilters({ category: '全部', year: '全部', status: '全部' });
      setPage(1);

      // 获取动态选项
      try {
        const options = await getFilterOptions(currentSource);
        setDynamicOptions(options);
      } catch (error) {
        console.error("Failed to load filter options:", error);
        // 出错时给默认空值，防止页面崩溃
        setDynamicOptions({ categories: [], years: [] });
      }
      setOptionsLoading(false);
    };

    initSourceData();
  }, [currentSource]);

  // --- 4. 当筛选条件或页码改变时：获取视频列表 ---
  useEffect(() => {
    const fetchData = async () => {
      // 如果选项还在加载，先不请求视频，避免参数错乱
      if (optionsLoading) return;

      setLoading(true);
      
      // 构建查询参数
      const queryCategory = filters.category === '全部' ? undefined : filters.category;
      const queryYear = filters.year === '全部' ? undefined : filters.year;
      const queryStatus = filters.status === '全部' ? undefined : filters.status;
      
      // 获取搜索栏参数（如果有）
      const urlSearchQuery = searchParams.get('search') || '';

      const res = await getVideos({
        source: currentSource,
        search: urlSearchQuery, // 传入搜索词
        category: queryCategory,
        year: queryYear,
        status: queryStatus,
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
  }, [filters, page, currentSource, optionsLoading, searchParams]);

  // --- 处理筛选点击 ---
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // 切换筛选重置页码
  };

  // --- 渲染单个筛选行 ---
  const renderFilterRow = (label: string, key: 'category' | 'year' | 'status', options: string[]) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-gray-500 font-bold shrink-0 w-12">{label}</span>
      <div className="flex flex-wrap gap-2">
        {/* 手动添加 "全部" 选项 */}
        <button
          onClick={() => handleFilterChange(key, '全部')}
          className={`px-3 py-1 rounded-full transition-all ${
            filters[key] === '全部' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          全部
        </button>
        
        {/* 遍历动态选项 */}
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleFilterChange(key, opt)}
            className={`px-3 py-1 rounded-full transition-all ${
              filters[key] === opt ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  // --- 分页逻辑 (保留原来的数字分页) ---
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
      
      {/* 头部与源选择 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
             <Film className="text-blue-500"/> 
             {searchParams.get('search') ? `搜索: ${searchParams.get('search')}` : '全部片库'}
           </h1>
           <SourceSelector />
        </div>
        <div className="text-xs text-gray-500">
            共找到 {totalCount} 部资源
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 mb-8 space-y-4 shadow-xl">
        {optionsLoading ? (
           <div className="flex items-center gap-2 text-gray-500 py-4">
             <Loader2 className="animate-spin" size={16}/> 正在加载筛选选项...
           </div>
        ) : (
           <>
             {/* 动态渲染分类 */}
             {renderFilterRow("分类", "category", dynamicOptions.categories)}
             {/* 动态渲染年份 */}
             {renderFilterRow("年份", "year", dynamicOptions.years)}
             {/* 静态渲染状态 (如果你后端支持状态筛选，可以解开下面这行) */}
             {/* renderFilterRow("状态", "status", STATUS_OPTIONS) */} 
           </>
        )}
      </div>

      {/* 视频列表 */}
      {loading ? (
         <div className="flex flex-col items-center justify-center py-20 text-gray-500">
           <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
           <p>正在加载片库...</p>
         </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {videos.map((video) => (
            <Link key={video.id} href={`/movies/${video.id}`} className="group block">
              <div className="aspect-[2/3] rounded-lg overflow-hidden relative border border-white/5 mb-3 bg-[#1c2128]">
                <img 
                  src={video.coverUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {video.status && (
                  <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">
                    {video.status}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </div>
              <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400 transition-colors">
                {video.title}
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
                <span>{video.year || '未知'}</span>
                {video.type && (
                    <>
                        <span className="w-0.5 h-0.5 bg-gray-500 rounded-full"></span>
                        <span className="truncate max-w-[80px]">{video.type}</span>
                    </>
                )}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 bg-[#161b22] rounded-xl border border-white/5">
           <p>没有找到相关资源</p>
           <button onClick={() => setFilters({category:'全部', year:'全部', status:'全部'})} className="mt-4 text-blue-400 hover:underline">
             重置筛选
           </button>
        </div>
      )}

      {/* 分页组件 */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 mb-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1} 
            className="p-2 rounded-lg bg-[#161b22] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          
          {getPageNumbers().map(p => (
            <button 
                key={p} 
                onClick={() => setPage(p)} 
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === p ? 'bg-blue-600 text-white' : 'bg-[#161b22] text-gray-400 hover:text-white'
                }`}
            >
                {p}
            </button>
          ))}
          
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages} 
            className="p-2 rounded-lg bg-[#161b22] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans">
      <Header />
      <Suspense fallback={
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
      }>
        <CatalogContent />
      </Suspense>
    </div>
  );
}