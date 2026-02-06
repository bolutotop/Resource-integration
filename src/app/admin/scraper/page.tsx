'use client';

import { useState } from 'react';
import { DownloadCloud, LayoutTemplate, ListVideo, Loader2, Trash2, Filter, Calendar } from 'lucide-react';
import { syncHomeData, syncCatalog } from '@/app/actions/scraper';

export default function AdminScraperPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // 页码范围
  const [pageRange, setPageRange] = useState({ start: 1, end: 5 });
  
  // 源选择状态
  const [selectedSource, setSelectedSource] = useState('Yhmc');
  
  // 分类与年份状态
  const [category, setCategory] = useState('日韩动漫');
  const [year, setYear] = useState(''); // 默认为空，表示全部

  const categories = ['日韩动漫', '国产动漫', '欧美动漫', '电影', '电视剧', '综艺', '短剧', '动画片'];
  const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '10年代', '00年代', '老片'];

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // 1. 处理同步目录 (融合了页码范围和年份筛选)
  const handleSyncCatalog = async () => {
    if (loading) return;
    
    const start = Number(pageRange.start);
    const end = Number(pageRange.end);

    if (start > end) {
      alert("起始页不能大于结束页");
      return;
    }

    setLoading(true);
    const yearMsg = year ? `[${year}年]` : '[全部年份]';
    addLog(`🚀 [${selectedSource}] 开始任务: ${category} ${yearMsg} (第 ${start} - ${end} 页)...`);
    
    try {
      for (let i = start; i <= end; i++) {
        addLog(`⏳ 正在抓取第 ${i} 页...`);
        
        // 调用 syncCatalog，传入 category 和 year
        const res = await syncCatalog(selectedSource, i, category, year);
        
        if (res.success) {
          addLog(`✅ [第${i}页] 同步成功: ${res.count ?? 0} 条`);
        } else {
          addLog(`❌ [第${i}页] 失败: ${res.message}`);
        }
      }
      addLog(`✨ [${selectedSource}] ${category} ${yearMsg} 范围同步结束`);
    } catch (e: any) {
      addLog(`❌ 严重错误: ${e.message}`);
    }
    setLoading(false);
  };

  // 2. 处理同步首页
  const handleSyncHome = async () => {
    if (loading) return;
    setLoading(true);
    addLog(`🚀 [${selectedSource}] 开始同步首页推荐数据...`);
    try {
      const res = await syncHomeData(selectedSource);
      if (res.success) {
        addLog(`✅ [${selectedSource}] 首页同步成功: ${res.message}`);
      } else {
        addLog(`❌ [${selectedSource}] 首页同步失败: ${res.message}`);
      }
    } catch (e: any) {
      addLog(`❌ 错误: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-8">
      
      {/* 顶部标题栏 + 源/分类选择器 */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DownloadCloud className="text-blue-500" /> 采集任务管理
        </h1>
        
        {/* 控制栏 */}
        <div className="flex flex-wrap items-center gap-4 bg-[#161b22] px-4 py-2 rounded-xl border border-white/10 shadow-xl">
          
          {/* 数据源选择 */}
          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            <span className="text-sm text-gray-400">数据源:</span>
            <select 
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-transparent text-blue-400 font-bold outline-none cursor-pointer hover:text-blue-300 transition-colors"
            >
              <option value="Age" className="bg-[#161b22]">Age动漫</option>
              <option value="Yhmc" className="bg-[#161b22]">樱花动漫 (Yhmc)</option>
            </select>
          </div>

          {/* 只有 Yhmc 显示分类和年份 */}
          {selectedSource === 'Yhmc' && (
            <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* 分类选择 */}
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-500" />
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#0d1117] border border-white/10 rounded px-2 py-1 text-sm text-green-400 font-medium outline-none focus:border-green-500 transition-colors"
                >
                  {categories.map(c => <option key={c} value={c} className="bg-[#161b22]">{c}</option>)}
                </select>
              </div>

              {/* 年份选择 */}
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-500" />
                <select 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-[#0d1117] border border-white/10 rounded px-2 py-1 text-sm text-yellow-400 font-medium outline-none focus:border-yellow-500 transition-colors"
                >
                  <option value="" className="bg-[#161b22]">全部年份</option>
                  {years.map(y => <option key={y} value={y} className="bg-[#161b22]">{y}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左侧：操作区 */}
        <div className="space-y-6">
          
          {/* 首页采集卡片 */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 hover:border-purple-500/30 transition-all shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                <LayoutTemplate size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">同步首页</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  同步 <span className="text-blue-400 font-medium">{selectedSource}</span> 的今日推荐和最近更新。
                </p>
                <button 
                  onClick={handleSyncHome}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                  立即同步首页
                </button>
              </div>
            </div>
          </div>

          {/* 目录采集卡片 */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-all shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <ListVideo size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">批量入库 (目录)</h3>
                
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  抓取 <span className="text-blue-400 font-medium">{selectedSource}</span> 
                  {selectedSource === 'Yhmc' && (
                    <>
                      <span className="text-green-400 font-medium mx-1">[{category}]</span>
                      <span className="text-yellow-400 font-medium">[{year || '全部年份'}]</span>
                    </>
                  )}
                  的数据。
                </p>
                
                {/* 页码选择器 */}
                <div className="flex items-center gap-3 mb-5">
                   <div className="flex items-center gap-2 bg-[#0d1117] p-2 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 pl-1">页码范围:</span>
                      <input 
                        type="number" 
                        value={pageRange.start}
                        onChange={(e) => setPageRange({...pageRange, start: parseInt(e.target.value) || 1})}
                        className="w-14 bg-[#161b22] border border-white/10 rounded px-1 py-0.5 text-center text-sm focus:border-blue-500 outline-none transition-colors"
                      />
                      <span className="text-gray-600">-</span>
                      <input 
                        type="number" 
                        value={pageRange.end}
                        onChange={(e) => setPageRange({...pageRange, end: parseInt(e.target.value) || 1})}
                        className="w-14 bg-[#161b22] border border-white/10 rounded px-1 py-0.5 text-center text-sm focus:border-blue-500 outline-none transition-colors"
                      />
                   </div>
                </div>

                <button 
                  onClick={handleSyncCatalog}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                  开始同步 {pageRange.start}-{pageRange.end} 页
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：日志区 */}
        <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 flex flex-col h-[500px] shadow-lg">
          <h3 className="text-white font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">运行日志 <span className="text-xs font-normal text-gray-500 font-mono border border-white/10 px-1.5 rounded">Real-time</span></span>
            <button 
              onClick={() => setLogs([])} 
              className="p-1.5 hover:bg-white/5 rounded-md text-gray-500 hover:text-red-400 transition-colors"
              title="清空日志"
            >
              <Trash2 size={16} />
            </button>
          </h3>
          <div className="flex-1 bg-[#0d1117] rounded-lg p-4 overflow-y-auto font-mono text-xs space-y-2 border border-white/5 custom-scrollbar shadow-inner">
            {logs.length === 0 && <div className="text-gray-600 italic text-center mt-20">等待任务启动...</div>}
            {logs.map((log, i) => (
              <div key={i} className={`pb-1 border-b border-white/5 last:border-0 break-all ${
                log.includes('❌') ? 'text-red-400' : 
                log.includes('✅') ? 'text-green-400' : 
                log.includes('⏳') ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}