'use client';

import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Video, Users, Settings, LogOut, 
  TrendingUp, Activity, HardDrive, Plus 
} from 'lucide-react';
import Link from 'next/link'; // 别忘了引入 Link

import { Image as ImageIcon } from 'lucide-react'; // 别忘了导入 Icon

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // 清除 Cookie
    document.cookie = 'kali_admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  // --- 修改点：在这里直接定义好 change (涨跌幅)，不要用 Math.random() ---
  const stats = [
    { label: '总视频数', value: '1,284', change: '+12.5%', icon: Video, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '总播放量', value: '8.5M', change: '+8.2%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: '注册用户', value: '45.2K', change: '+24.3%', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: '服务器负载', value: '32%', change: '-5.1%', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] flex font-sans text-gray-200">
      
      {/* Sidebar (左侧导航) */}
      <aside className="w-64 border-r border-white/5 bg-[#161b22] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
           <span className="font-bold text-lg text-white">Kali<span className="text-blue-500">Admin</span></span>
           <span className="ml-2 text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">PRO</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-lg font-medium border border-blue-600/20">
            <LayoutDashboard size={18} /> 仪表盘
          </button>
<Link 
    href="/admin/videos" 
    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
  >
    <Video size={18} /> 视频管理
  </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Users size={18} /> 用户列表
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <HardDrive size={18} /> 资源监控
          </button>
          <Link 
  href="/admin/images" 
  className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
>
  <ImageIcon size={18} /> 媒体库
</Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Settings size={18} /> 系统设置
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} /> 退出登录
          </button>
        </div>
      </aside>

      {/* Main Content (右侧内容) */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">仪表盘</h1>
            <p className="text-sm text-gray-500 mt-1">欢迎回来，Administrator</p>
          </div>

        </header>

        {/* 统计卡片 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#161b22] border border-white/5 p-6 rounded-xl hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                  <stat.icon size={20} />
                </div>
                {/* 修改点：这里直接使用 stat.change，不再动态生成 */}
                <span className="text-xs text-green-400 font-mono">{stat.change}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 占位内容区域 */}
        <div className="bg-[#161b22] border border-white/5 rounded-xl p-8 h-96 flex items-center justify-center text-gray-600 border-dashed">
            这里将放置数据图表或最近的视频列表...
        </div>
      </main>

    </div>
  );
}