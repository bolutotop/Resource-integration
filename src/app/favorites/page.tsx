'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { getFavoriteList } from '@/app/actions/favorite';
import { 
  Heart, Clock, Film, Package, Gamepad2, Music, 
  Link as LinkIcon, Lock, LayoutGrid, ChevronRight, Bookmark
} from 'lucide-react';
import Link from 'next/link';
import { useAuthModal } from '@/context/AuthModalContext';
import { getSession } from '@/app/actions/user-auth';

// 专区配置
const TABS = [
  { id: 'ALL', label: '全部收藏', icon: LayoutGrid, color: 'text-gray-400' },
  { id: 'MOVIE', label: '影视收藏', icon: Film, color: 'text-blue-400' },
  { id: 'SOFTWARE', label: '软件收藏', icon: Package, color: 'text-green-400' },
  { id: 'GAME', label: '游戏收藏', icon: Gamepad2, color: 'text-purple-400' },
  { id: 'MUSIC', label: '音乐收藏', icon: Music, color: 'text-orange-400' },
];

const TypeBadge = ({ type }: { type: string }) => {
  const tab = TABS.find(t => t.id === type);
  const Icon = tab?.icon || LinkIcon;
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

export default function FavoritesPage() {
  const [favList, setFavList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  
  const { openLoginModal } = useAuthModal();

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
      const data = await getFavoriteList();
      setFavList(data);
      setLoading(false);
    };
    checkAuthAndLoad();
  }, []);

  const filteredList = activeTab === 'ALL' 
    ? favList 
    : favList.filter(item => item.targetType === activeTab);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
          <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
            <Bookmark size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">我的收藏</h1>
            <p className="text-sm text-gray-500">您珍藏的优质资源</p>
          </div>
        </div>

        {loading ? (
           <div className="text-center py-20 text-gray-500">同步收藏夹...</div>
        ) : !isAuthorized ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-6">
             <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
               <Lock size={32} className="text-gray-400" />
             </div>
             <div className="text-center space-y-2">
               <h2 className="text-xl font-bold text-white">请先登录</h2>
               <button onClick={openLoginModal} className="text-blue-500 hover:underline">点击登录查看收藏</button>
             </div>
           </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* 左侧菜单 */}
            <aside className="w-full lg:w-64 shrink-0 space-y-2">
              <div className="bg-[#161b22] border border-white/5 rounded-xl p-2 sticky top-24">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const count = tab.id === 'ALL' 
                    ? favList.length 
                    : favList.filter(i => i.targetType === tab.id).length;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-medium mb-1 ${
                        isActive 
                          ? 'bg-pink-600/10 text-pink-400 border border-pink-500/20' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon size={18} className={isActive ? "text-pink-400" : tab.color} />
                        <span>{tab.label}</span>
                      </div>
                      {count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-pink-500/20 text-pink-300' : 'bg-gray-800 text-gray-500'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* 右侧列表 */}
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
                      {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Heart, { size: 32, className: "text-gray-500" })}
                   </div>
                   <p className="text-gray-500">暂无收藏</p>
                   {activeTab !== 'ALL' && (
                     <Link href={`/${activeTab === 'MOVIE' ? 'movies' : activeTab.toLowerCase()}`} className="mt-4 text-blue-500 text-sm hover:underline flex items-center gap-1">
                       去{TABS.find(t => t.id === activeTab)?.label.replace('收藏','')}看看 <ChevronRight size={14} />
                     </Link>
                   )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredList.map((item) => (
                    <Link 
                      key={item.id} 
                      href={item.routeUrl}
                      className="flex gap-4 p-4 bg-[#161b22] border border-white/5 rounded-xl hover:border-pink-500/30 hover:bg-[#1c2128] transition-all group relative overflow-hidden"
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
                          <h3 className="text-sm font-bold text-gray-200 line-clamp-2 group-hover:text-pink-400 transition-colors leading-relaxed">
                            {item.title}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                             {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <Heart size={14} className="text-pink-500 fill-pink-500" />
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