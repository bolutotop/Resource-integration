'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, X, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // 1. 新增：引入路由钩子
import { getSession, logoutUser } from '@/app/actions/user-auth';
import AuthForm from './AuthForm';
import UserDropdown from './UserDropdown';

// --- 引入 Context Hook (保持不变) ---
import { useAuthModal } from '@/context/AuthModalContext';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- 2. 新增：搜索框内部状态 ---
  // 这样就不需要父组件传 props 也能打字了
  const initialSearch = searchParams.get('search') || '';
  const [keyword, setKeyword] = useState(initialSearch);

  // --- Auth 状态 (保持你原有的逻辑) ---
  const [currentUser, setCurrentUser] = useState<{id: number, name: string, email: string} | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoginOpen, openLoginModal, closeLoginModal } = useAuthModal();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getSession();
      if (user) {
        setCurrentUser(user);
      }
    };
    checkAuth();
  }, []);

  // --- 3. 新增：处理搜索提交 ---
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keyword.trim()) {
      // 跳转到 /catalog 并带上参数
      router.push(`/catalog?search=${encodeURIComponent(keyword)}`);
    }
  };

  // 清空搜索
  const clearSearch = () => {
    setKeyword('');
    router.push('/catalog'); // 可选：清空时是否跳转回全部列表，看你需求
  };

  const handleLogout = async () => {
    if (confirm("确定要退出登录吗？")) {
      await logoutUser();
      setCurrentUser(null);
      setIsMenuOpen(false);
      window.location.reload();
    }
  };

  // 处理弹窗关闭 (保持不变)
  const handleCloseModal = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'modal-overlay') {
      closeLoginModal();
    }
  };

  return (
    <>
      <header className="h-16 sticky top-0 z-40 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 lg:px-8 shrink-0">
        
        {/* Logo (保持不变) */}
        <Link href="/" className="flex items-center gap-2 mr-8">
           <div className="w-8 h-8 bg-gradient-to-tr from-green-400 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white">K</div>
           <span className="text-xl font-bold tracking-tight text-white hidden md:block">Kali<span className="text-blue-500">Res</span></span>
        </Link>

        {/* 搜索栏 (核心修改点) */}
        <div className="flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="搜索资源..." 
              // 修改：绑定本地 state
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleSearch} // 修改：绑定跳转逻辑
              className="w-full bg-[#161b22] border border-white/5 text-sm text-gray-200 rounded-full pl-10 pr-10 py-2 focus:outline-none focus:bg-[#0d1117] focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600"
            />
            {keyword && (
              <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"><X size={14} /></button>
            )}
        </div>

        {/* 右侧功能区 (保持不变) */}
        <div className="flex items-center gap-4 ml-6">
          <button className="text-gray-400 hover:text-white transition-colors relative hidden sm:block"><Clock size={20} /></button>
          <button className="text-gray-400 hover:text-white transition-colors relative hidden sm:block">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0d1117]"></span>
          </button>
          
          {currentUser ? (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all border ${
                  isMenuOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-transparent hover:bg-gray-800'
                }`}
              >
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-inner cursor-pointer">
                   {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                 </div>
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsMenuOpen(false)} />
                  <UserDropdown user={currentUser} onLogout={handleLogout} onClose={() => setIsMenuOpen(false)} />
                </>
              )}
            </div>
          ) : (
            <div 
              // 保持使用 context 的方法
              onClick={openLoginModal}
              className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600 cursor-pointer flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all active:scale-95"
            >
               <User size={16} />
            </div>
          )}
        </div>
      </header>

      {/* 登录弹窗 (保持不变) */}
      {isLoginOpen && (
        <div 
          id="modal-overlay"
          onClick={handleCloseModal}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-3xl p-4 md:p-8 animate-in fade-in duration-500"
        >
          <div className="relative w-full flex justify-center max-w-[1000px]"> 
            <button 
              onClick={closeLoginModal}
              className="absolute -top-12 right-0 md:-right-12 z-[201] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <AuthForm />
          </div>
        </div>
      )}
    </>
  );
}