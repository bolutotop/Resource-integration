'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Lock, Loader2, Server, AlertCircle 
} from 'lucide-react';
import { adminLogin } from '@/app/actions/auth'; // 引入刚才写的后端方法

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    // 调用 Server Action 进行安全验证
    const result = await adminLogin(null, formData);

    if (result.success) {
      // 登录成功，跳转
      router.push('/admin');
    } else {
      // 登录失败，显示错误
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050505] font-sans">
      
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      ></div>
      
      <div className="relative z-10 w-full max-w-[380px] mx-4">
        
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2 rounded-t-xl flex items-center gap-2 justify-center font-mono">
            <AlertCircle size={12} /> RESTRICTED AREA / ADMIN ONLY
        </div>

        <div className="bg-[#111]/90 backdrop-blur-md border border-white/10 border-t-0 rounded-b-xl shadow-2xl p-8">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-200 mb-4">
               <Server size={24} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">KaliVideo <span className="text-red-500">Admin</span></h1>
            <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">系统管理后台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 animate-pulse">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Admin ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600 group-focus-within:text-red-500 transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <input
                  name="username" // 必须加 name 属性，Server Action 靠这个取值
                  type="text"
                  required
                  className="w-full bg-black/50 border border-gray-800 text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-gray-700 font-mono text-sm"
                  placeholder="Administrator"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Passkey</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600 group-focus-within:text-red-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  name="password" // 必须加 name 属性
                  type="password"
                  required
                  className="w-full bg-black/50 border border-gray-800 text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-gray-700 font-mono text-sm"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600/90 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 hover:shadow-red-900/40 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Server size={16} /> 接入系统
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => router.push('/')}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center justify-center gap-1 w-full"
            >
              ← 返回前台首页
            </button>
          </div>

        </div>
        
        <div className="mt-4 text-center text-[10px] text-gray-700 font-mono">
           IP: ::1 | Secure Connection
        </div>
      </div>
    </div>
  );
}