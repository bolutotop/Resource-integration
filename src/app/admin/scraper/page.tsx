'use client';

import React, { useState } from 'react';
import { syncSourceData } from '@/app/actions/scraper'; // 引入刚才写的后端脚本
import { Loader2, Play, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ScraperAdminPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [config, setConfig] = useState({
    source: 'Age',
    startPage: 1,
    endPage: 1 // 首次测试只爬第1页，防止请求过多
  });

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleSync = async () => {
    if (loading) return;
    setLoading(true);
    setLogs([]); // 清空日志
    addLog(`开始任务：同步 ${config.source} (第 ${config.startPage} - ${config.endPage} 页)...`);

    try {
      // 调用 Server Action
      const res = await syncSourceData(config.source, Number(config.startPage), Number(config.endPage));
      
      if (res.success) {
        addLog(`✅ 成功：${res.message}`);
      } else {
        addLog(`❌ 失败：${res.message}`);
      }
    } catch (error: any) {
      addLog(`❌ 严重错误：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">资源采集中心</h1>
              <p className="text-sm text-gray-500">批量抓取元数据入库</p>
            </div>
          </div>
          <Link href="/movies" className="text-sm text-blue-400 hover:underline">
            查看前台效果 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 左侧：控制面板 */}
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-white/5 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Play size={18} className="text-green-400" /> 任务配置
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">数据源 (Source)</label>
                  <select 
                    value={config.source}
                    onChange={e => setConfig({...config, source: e.target.value})}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="Age">Age 动漫 (agedm.io)</option>
                    {/* 以后加了软件源这里会有更多选项 */}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">起始页码</label>
                    <input 
                      type="number" 
                      value={config.startPage}
                      onChange={e => setConfig({...config, startPage: Number(e.target.value)})}
                      className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">结束页码</label>
                    <input 
                      type="number" 
                      value={config.endPage}
                      onChange={e => setConfig({...config, endPage: Number(e.target.value)})}
                      className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSync}
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                      loading 
                        ? 'bg-blue-600/50 cursor-not-allowed text-blue-200' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                    }`}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                    {loading ? '正在采集...' : '开始采集入库'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    注意：大量采集中途请勿关闭页面
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：日志输出 */}
          <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 flex flex-col h-[400px]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-400" /> 运行日志
            </h2>
            <div className="flex-1 bg-[#0d1117] rounded-lg p-4 overflow-y-auto font-mono text-xs space-y-2 border border-white/5 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600 italic">
                  等待任务开始...
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`flex items-start gap-2 ${log.includes('成功') ? 'text-green-400' : log.includes('失败') ? 'text-red-400' : 'text-gray-300'}`}>
                    <span className="shrink-0 opacity-50">&gt;</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}