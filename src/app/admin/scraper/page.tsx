'use client';

import { useState } from 'react';
import { DownloadCloud, LayoutTemplate, ListVideo, Loader2, Trash2 } from 'lucide-react';
import { syncSourceData, syncHomeData } from '@/app/actions/scraper';

export default function AdminScraperPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [pageRange, setPageRange] = useState({ start: 1, end: 5 });
  
  // --- 新增：源选择状态 ---
  const [selectedSource, setSelectedSource] = useState('Age'); 

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // 1. 处理同步目录
  const handleSyncCatalog = async () => {
    if (loading) return;
    if (pageRange.start > pageRange.end) {
      alert("起始页不能大于结束页");
      return;
    }

    setLoading(true);
    addLog(`🚀 [${selectedSource}] 开始同步目录 (第 ${pageRange.start} - ${pageRange.end} 页)...`);
    
    try {
      const res = await syncSourceData(selectedSource, Number(pageRange.start), Number(pageRange.end));
      if (res.success) {
        addLog(`✅ [${selectedSource}] 目录同步成功: ${res.message}`);
      } else {
        addLog(`❌ [${selectedSource}] 目录同步失败: ${res.message}`);
      }
    } catch (e: any) {
      addLog(`❌ 错误: ${e.message}`);
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
      
      {/* 顶部标题栏 + 源选择器 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DownloadCloud className="text-blue-500" /> 采集任务管理
        </h1>
        
        <div className="flex items-center gap-3 bg-[#161b22] px-4 py-2 rounded-xl border border-white/10 shadow-xl">
          <span className="text-sm text-gray-400">当前数据源:</span>
          <select 
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-transparent text-blue-400 font-bold outline-none cursor-pointer hover:text-blue-300 transition-colors"
          >
            <option value="Age" className="bg-[#161b22]">Age动漫</option>
            <option value="Yhmc" className="bg-[#161b22]">樱花动漫 (Yhmc)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左侧：操作区 */}
        <div className="space-y-6">
          
          {/* 首页采集卡片 */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 hover:border-purple-500/30 transition-all">
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
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <ListVideo size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">批量入库 (目录)</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  同步 <span className="text-blue-400 font-medium">{selectedSource}</span> 的全量目录数据，支持自定义页码。
                </p>
                
                <div className="flex items-center gap-2 mb-4 bg-[#0d1117] p-2 rounded-lg border border-white/5 w-fit">
                   <span className="text-xs text-gray-500 pl-2">页码范围:</span>
                   <input 
                     type="number" 
                     value={pageRange.start}
                     onChange={(e) => setPageRange({...pageRange, start: parseInt(e.target.value) || 1})}
                     className="w-16 bg-[#161b22] border border-white/10 rounded px-2 py-1 text-center text-sm focus:border-blue-500 outline-none"
                   />
                   <span className="text-gray-600">-</span>
                   <input 
                     type="number" 
                     value={pageRange.end}
                     onChange={(e) => setPageRange({...pageRange, end: parseInt(e.target.value) || 1})}
                     className="w-16 bg-[#161b22] border border-white/10 rounded px-2 py-1 text-center text-sm focus:border-blue-500 outline-none"
                   />
                </div>

                <button 
                  onClick={handleSyncCatalog}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                  开始采集 ({pageRange.start}-{pageRange.end}页)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：日志区 */}
        <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 flex flex-col h-[500px]">
          <h3 className="text-white font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">运行日志 <span className="text-xs font-normal text-gray-500 font-mono">Real-time</span></span>
            <button 
              onClick={() => setLogs([])} 
              className="p-1.5 hover:bg-white/5 rounded-md text-gray-500 hover:text-red-400 transition-colors"
              title="清空日志"
            >
              <Trash2 size={16} />
            </button>
          </h3>
          <div className="flex-1 bg-[#0d1117] rounded-lg p-4 overflow-y-auto font-mono text-xs space-y-2 border border-white/5 custom-scrollbar">
            {logs.length === 0 && <div className="text-gray-600 italic">等待任务启动...</div>}
            {logs.map((log, i) => (
              <div key={i} className={`pb-1 border-b border-white/5 last:border-0 ${
                log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-gray-400'
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