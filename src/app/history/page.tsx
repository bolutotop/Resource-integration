'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { getHistoryList, clearHistory } from '@/app/actions/history';
import { 
  History, Trash2, Clock, Film, Package, Gamepad2, Music, 
  Link as LinkIcon, Lock, LayoutGrid, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';
import { useAuthModal } from '@/context/AuthModalContext';
import { getSession } from '@/app/actions/user-auth';
import { useRouter } from 'next/navigation';

// --- 配置：支持的分类 Tab ---
// 以后如果加了“图片专区”，只需在这里加一行即可
const TABS = [
  { id: 'ALL', label: '全部记录', icon: LayoutGrid, color: 'text-gray-400' },
  { id: 'MOVIE', label: '影视专区', icon: Film, color: 'text-blue-400' },
  { id: 'SOFTWARE', label: '软件仓库', icon: Package, color: 'text-green-400' },
  { id: 'GAME', label: '游戏殿堂', icon: Gamepad2, color: 'text-purple-400' },
  { id: 'MUSIC', label: '无损音乐', icon: Music, color: 'text-orange-400' },
];

// 辅助组件：根据类型渲染封面上的小图标
const TypeBadge = ({ type }: { type: string }) => {
  const tab = TABS.find(t => t.id === type);
  const Icon = tab?.icon || LinkIcon;
  // 动态获取颜色类名有点麻烦，这里简单映射一下背景色
  let bgClass = "bg-gray-600";
  if (type === 'MOVIE') bgClass = "bg-blue-600";
  if (type === 'SOFTWARE') bgClass = "bg-green-600";
  if (type === 'GAME') bgClass = "bg-purple-600";
  if (type === 'MUSIC') bgClass = "bg-orange-600";

  return (
    <div className={`absolute top-0 right-0 ${bgClass} text-white px-1.5 py-0.5 rounded-bl-lg shadow-sm z-10`}>
      <Icon size={12} />
    </div>
  );
};

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // --- 新增：当前选中的分类 ---
  const [activeTab, setActiveTab] = useState('ALL');
  
  const { openLoginModal } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const user = await getSession();
      if (!user) {
        setLoading(false);
        setIsAuthorized(false);
        openLoginModal();
        return;
      }
      setIsAuthorized(true);
      const data = await getHistoryList();
      setHistoryList(data);
      setLoading(false);
    };
    checkAuthAndLoad();
  }, []);

  const handleClear = async () => {
    if (confirm("确定要清空所有历史记录吗？")) {
      await clearHistory();
      setHistoryList([]);
    }
  };

  // --- 核心逻辑：根据当前 Tab 过滤数据 ---
  const filteredList = activeTab === 'ALL' 
    ? historyList 
    : historyList.filter(item => item.targetType === activeTab);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        
        {/* 顶部标题 */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">浏览历史</h1>
            <p className="text-sm text-gray-500">管理您的足迹</p>
          </div>
        </div>

        {loading ? (
           <div className="text-center py-20 text-gray-500">正在同步...</div>
        ) : !isAuthorized ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-6">
             <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
               <Lock size={32} className="text-gray-400" />
             </div>
             <div className="text-center space-y-2">
               <h2 className="text-xl font-bold text-white">请先登录</h2>
               <button onClick={openLoginModal} className="text-blue-500 hover:underline">点击登录</button>
             </div>
           </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* --- 左侧：分类导航栏 --- */}
            <aside className="w-full lg:w-64 shrink-0 space-y-2">
              <div className="bg-[#161b22] border border-white/5 rounded-xl p-2 sticky top-24">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  // 计算该分类下的数量
                  const count = tab.id === 'ALL' 
                    ? historyList.length 
                    : historyList.filter(i => i.targetType === tab.id).length;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-medium mb-1 ${
                        isActive 
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon size={18} className={isActive ? "text-blue-400" : tab.color} />
                        <span>{tab.label}</span>
                      </div>
                      {count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 清空按钮放在侧边栏底部 */}
              {historyList.length > 0 && (
                <button 
                  onClick={handleClear}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-4 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm"
                >
                  <Trash2 size={16} /> 清空所有历史
                </button>
              )}
            </aside>

            {/* --- 右侧：内容列表区 --- */}
            <section className="flex-1 min-w-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {TABS.find(t => t.id === activeTab)?.label}
                  <span className="text-gray-600 text-sm font-normal">({filteredList.length})</span>
                </h2>
              </div>

              {filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#161b22] border border-white/5 rounded-2xl border-dashed">
                   <div className="p-4 bg-gray-800/50 rounded-full mb-4">
                      {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Clock, { size: 32, className: "text-gray-500" })}
                   </div>
                   <p className="text-gray-500">暂无{TABS.find(t => t.id === activeTab)?.label.replace('专区','').replace('仓库','')}记录</p>
                   {activeTab !== 'ALL' && (
                     <Link href={`/${activeTab === 'MOVIE' ? 'movies' : activeTab.toLowerCase()}`} className="mt-4 text-blue-500 text-sm hover:underline flex items-center gap-1">
                       前往专区 <ChevronRight size={14} />
                     </Link>
                   )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredList.map((item) => (
                    <Link 
                      key={item.id} 
                      href={item.routeUrl}
                      className="flex gap-4 p-4 bg-[#161b22] border border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-[#1c2128] transition-all group relative overflow-hidden"
                    >
                      {/* 封面 */}
                      <div className="w-28 aspect-video bg-gray-800 rounded-lg overflow-hidden shrink-0 relative shadow-lg">
                         {item.coverUrl ? (
                           <img src={item.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-xl">K</div>
                         )}
                         <TypeBadge type={item.targetType} />
                      </div>

                      {/* 信息 */}
                      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                        <div>
                          <h3 className="text-sm font-bold text-gray-200 line-clamp-2 group-hover:text-blue-400 transition-colors leading-relaxed">
                            {item.title}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock size={12} /> {timeAgo(item.visitedAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </main>
    </div>
  );
}