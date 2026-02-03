'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { getVideos } from '@/app/actions/video';
import { Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function CatalogPage() {
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

  // 选项配置
  const options = {
    category: ['全部', 'TV', '剧场版', 'OVA'],
    year: ['全部', '2026', '2025', '2024', '2023', '2022', '2021', '2000以前'],
    status: ['全部', '连载', '完结', '未播放']
  };

  // 请求数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getVideos({
        category: filters.category === '全部' ? undefined : filters.category,
        year: filters.year === '全部' ? undefined : filters.year,
        status: filters.status === '全部' ? undefined : filters.status,
        page: page, // 传入当前页码
        pageSize: 24 // 每页显示数量
      });
      
      setVideos(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setLoading(false);
    };

    fetchData();
    // 每次筛选条件改变或页码改变时，触发请求
  }, [filters, page]);

  // 处理筛选变化
  const handleFilterChange = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1); // ⚠️ 关键：筛选条件变了，必须重置回第一页
  };

  // 生成页码数组 (简单的 UI 逻辑，只显示周围的页码)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // 最多显示5个按钮
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200">
      <Header />
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* 筛选区 */}
        <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 mb-8 space-y-4">
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2 text-white font-bold"><Filter size={18}/> 筛选片库</div>
             <span className="text-xs text-gray-500">共找到 {totalCount} 部资源</span>
           </div>
           
           {/* 渲染筛选按钮 (保持不变) */}
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

        {/* 列表内容区 */}
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
                    <img 
                      src={video.coverUrl} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy" 
                    />
                    <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {video.status}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400">{video.title}</h3>
                  <p className="text-[10px] text-gray-500">{video.year}</p>
                </Link>
              ))}
            </div>
            
            {videos.length === 0 && (
              <div className="text-center py-20 text-gray-500">没有找到相关视频</div>
            )}
          </>
        )}

        {/* --- 分页组件 --- */}
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
                  page === p 
                    ? 'bg-blue-600 text-white border border-blue-500' 
                    : 'bg-[#161b22] border border-white/10 text-gray-400 hover:text-white hover:border-white/30'
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
    </div>
  );
}