'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Film, Music, Gamepad2, Package, 
  ArrowRight, Sparkles 
} from 'lucide-react';
import Header from '@/components/Header';

// 专区配置
const zones = [
  {
    id: 'movies',
    title: '影视专区',
    desc: '高清电影、电视剧、动漫、纪录片在线观看',
    icon: Film,
    color: 'from-blue-500 to-cyan-400',
    href: '/movies', // 路由指向刚才移动的页面
    bgImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'software',
    title: '软件仓库',
    desc: 'Windows / Mac 破解软件、生产力工具下载',
    icon: Package,
    color: 'from-emerald-500 to-green-400',
    href: '/software', // 这是一个待开发的路由
    bgImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'games',
    title: '游戏殿堂',
    desc: '3A 大作、独立游戏、复古模拟器资源',
    icon: Gamepad2,
    color: 'from-purple-500 to-pink-500',
    href: '/games',
    bgImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'music',
    title: '无损音乐',
    desc: 'Hi-Res 音质、黑胶转录、发烧友聚集地',
    icon: Music,
    color: 'from-orange-500 to-yellow-400',
    href: '/music',
    bgImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1000&auto=format&fit=crop'
  }
];

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans flex flex-col">
      
      {/* 统一 Header，不显示具体搜索框，因为这是聚合页 */}
      <Header showSearch={false} />

      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        
        {/* 欢迎标语 */}
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 mb-2">
            <Sparkles size={12} />
            <span>资源聚合 · 极速下载 · 永久免费</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            探索无限 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">数字资源</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            KaliRes 是一个综合性资源分享平台。无论你想看电影、找软件、玩游戏还是听音乐，这里都是你的终点站。
          </p>
        </div>

        {/* 专区卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-7xl">
          {zones.map((zone, index) => (
            <Link 
              key={zone.id} 
              href={zone.href}
              className="group relative h-[320px] rounded-3xl overflow-hidden border border-white/5 shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 hover:-translate-y-2"
            >
              {/* 背景图 */}
              <div className="absolute inset-0">
                <img 
                  src={zone.bgImage} 
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700" 
                  alt={zone.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent" />
              </div>

              {/* 内容 */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${zone.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <zone.icon size={24} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  {zone.title}
                  <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-gray-300" />
                </h3>
                
                <p className="text-gray-400 text-sm line-clamp-2 group-hover:text-gray-200 transition-colors">
                  {zone.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center text-gray-600 text-sm">
        &copy; 2025 KaliRes Team. All rights reserved.
      </footer>
    </div>
  );
} 