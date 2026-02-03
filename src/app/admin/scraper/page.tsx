'use client';

import { useState } from 'react';
import { DownloadCloud, LayoutTemplate, ListVideo, Loader2 } from 'lucide-react';
import { syncSourceData, syncHomeData } from '@/app/actions/scraper';

export default function AdminScraperPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // --- 新增：页码状态 ---
  const [pageRange, setPageRange] = useState({ start: 1, end: 5 });

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // 1. 处理同步目录 (使用输入框的值)
  const handleSyncCatalog = async () => {
    if (loading) return;
    
    // 简单校验
    if (pageRange.start > pageRange.end) {
      alert("起始页不能大于结束页");
      return;
    }

    setLoading(true);
    addLog(`🚀 开始同步目录页 (第 ${pageRange.start} - ${pageRange.end} 页)...`);
    
    try {
      // 传入动态页码
      const res = await syncSourceData('Age', Number(pageRange.start), Number(pageRange.end));
      
      if (res.success) {
        addLog(`✅ 目录同步成功: ${res.message}`);
      } else {
        addLog(`❌ 目录同步失败: ${res.message}`);
      }
    } catch (e: any) {
      addLog(`❌ 发生错误: ${e.message}`);
    }
    setLoading(false);
  };

  // 2. 处理同步首页 (保持不变)
  const handleSyncHome = async () => {
    if (loading) return;
    setLoading(true);
    addLog("🚀 开始同步首页推荐数据...");
    try {
      const res = await syncHomeData('Age');
      if (res.success) {
        addLog(`✅ 首页同步成功: ${res.message}`);
      } else {
        addLog(`❌ 首页同步失败: ${res.message}`);
      }
    } catch (e: any) {
      addLog(`❌ 发生错误: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-8">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <DownloadCloud className="text-blue-500" /> 采集任务管理
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左侧：操作区 */}
        <div className="space-y-6">
          
          {/* 首页采集卡片 */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                <LayoutTemplate size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">同步首页数据</h3>
                <p className="text-sm text-gray-500 mt-1">
                  更新 "今日推荐" 和 "最近更新"。建议每日运行。
                </p>
                <button 
                  onClick={handleSyncHome}
                  disabled={loading}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                  立即同步首页
                </button>
              </div>
            </div>
          </div>

          {/* 目录采集卡片 (修改版) */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <ListVideo size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">批量入库 (目录)</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  抓取所有视频的基础信息、标签、年份。用于初始化片库或补全数据。
                </p>
                
                {/* --- 新增：页码输入框 --- */}
                <div className="flex items-center gap-2 mb-4 bg-[#0d1117] p-2 rounded-lg border border-white/5 w-fit">
                   <span className="text-sm text-gray-500 pl-2">页码范围:</span>
                   <input 
                     type="number" 
                     min="1"
                     value={pageRange.start}
                     onChange={(e) => setPageRange({...pageRange, start: parseInt(e.target.value)})}
                     className="w-16 bg-[#161b22] border border-white/10 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-blue-500"
                   />
                   <span className="text-gray-500">-</span>
                   <input 
                     type="number" 
                     min="1"
                     value={pageRange.end}
                     onChange={(e) => setPageRange({...pageRange, end: parseInt(e.target.value)})}
                     className="w-16 bg-[#161b22] border border-white/10 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-blue-500"
                   />
                </div>

                <button 
                  onClick={handleSyncCatalog}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                  开始采集 ({pageRange.start}-{pageRange.end}页)
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 右侧：日志区 (保持不变) */}
        <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 flex flex-col h-[500px]">
          <h3 className="text-white font-bold mb-4 flex items-center justify-between">
            <span>运行日志</span>
            <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-white">清空</button>
          </h3>
          <div className="flex-1 bg-[#0d1117] rounded-lg p-4 overflow-y-auto font-mono text-xs space-y-2 border border-white/5 custom-scrollbar">
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