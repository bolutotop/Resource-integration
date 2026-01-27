'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, User, Clock, X 
} from 'lucide-react';
import Link from 'next/link';
import { getSession, logoutUser } from '@/app/actions/user-auth';
import AuthForm from './AuthForm';
import UserDropdown from './UserDropdown'; // 引入新组件

interface HeaderProps {
  searchText?: string;
  setSearchText?: (value: string) => void;
  onSearch?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function Header({ 
  searchText = '', 
  setSearchText, 
  onSearch 
}: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<{id: number, name: string, email: string} | null>(null);
  
  // 状态管理
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 控制下拉菜单

  // 1. 初始化检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getSession();
      if (user) {
        setCurrentUser(user);
      }
    };
    checkAuth();
  }, []);

  // 2. 处理退出登录 (传给 Dropdown 使用)
  const handleLogout = async () => {
    if (confirm("确定要退出登录吗？")) {
      await logoutUser();
      setCurrentUser(null);
      setIsMenuOpen(false); // 关闭菜单
      window.location.reload();
    }
  };

  // 处理弹窗关闭
  const handleCloseModal = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'modal-overlay') {
      setIsLoginOpen(false);
    }
  };

  return (
    <>
      <header className="h-16 sticky top-0 z-40 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 lg:px-8 shrink-0">
        
        {/* Logo区域 */}
        <Link href="/" className="flex items-center gap-2 mr-8">
           <div className="w-8 h-8 bg-gradient-to-tr from-green-400 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
             K
           </div>
           <span className="text-xl font-bold tracking-tight text-white hidden md:block">Kali<span className="text-blue-500">Video</span></span>
        </Link>

        {/* 搜索栏 */}
        <div className="flex-1 max-w-xl relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="搜索：黑客帝国 / 动作 / 基努..." 
            value={searchText}
            onChange={(e) => setSearchText && setSearchText(e.target.value)}
            onKeyDown={onSearch}
            className="w-full bg-[#161b22] border border-white/5 text-sm text-gray-200 rounded-full pl-10 pr-10 py-2 focus:outline-none focus:bg-[#0d1117] focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600"
          />
          {searchText && setSearchText && (
            <button 
              onClick={() => setSearchText('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 右侧功能区 */}
        <div className="flex items-center gap-4 ml-6">
          <button className="text-gray-400 hover:text-white transition-colors relative hidden sm:block"><Clock size={20} /></button>
          <button className="text-gray-400 hover:text-white transition-colors relative hidden sm:block">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0d1117]"></span>
          </button>
          
          {/* 用户头像区域 (核心修改) */}
          {currentUser ? (
            <div className="relative">
              {/* 头像按钮 */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} // 切换菜单
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all border ${
                  isMenuOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-transparent hover:bg-gray-800'
                }`}
              >
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-inner cursor-pointer">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                 </div>
              </button>

              {/* 下拉菜单组件 */}
              {isMenuOpen && (
                <>
                  {/* 透明全屏遮罩：点击外部关闭菜单 */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  {/* 实际菜单 */}
                  <UserDropdown 
                    user={currentUser} 
                    onLogout={handleLogout} 
                    onClose={() => setIsMenuOpen(false)}
                  />
                </>
              )}
            </div>
          ) : (
            <div 
              onClick={() => setIsLoginOpen(true)}
              className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600 cursor-pointer flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all active:scale-95"
            >
               <User size={16} />
            </div>
          )}
        </div>
      </header>

      {/* 登录弹窗 */}
      {isLoginOpen && (
        <div 
          id="modal-overlay"
          onClick={handleCloseModal}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-3xl p-4 md:p-8 animate-in fade-in duration-500"
        >
          <div className="relative w-full flex justify-center max-w-[1000px]"> 
            <button 
              onClick={() => setIsLoginOpen(false)}
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