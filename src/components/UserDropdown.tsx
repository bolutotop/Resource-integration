'use client';

import React from 'react';
import { 
  LogOut, Settings, User, Moon, Languages, 
  HelpCircle, MessageSquare, Shield, Keyboard, 
  MonitorPlay, CreditCard, Users, History, Bookmark
} from 'lucide-react';
import Link from 'next/link';

interface UserDropdownProps {
  user: {
    name: string;
    email: string;
  };
  onLogout: () => void;
  onClose: () => void;
}

// --- 1. 新增：定义菜单项的通用结构 ---
interface MenuItem {
  icon: React.ElementType; // 允许 Lucide 图标组件
  label: string;
  href?: string;           // 可选
  action?: () => void;     // 可选
  hasArrow?: boolean;      // 可选
}

export default function UserDropdown({ user, onLogout, onClose }: UserDropdownProps) {
  
  // --- 2. 修改：显式指定类型为 MenuItem[][] ---
  const menuGroups: MenuItem[][] = [
    [
      { icon: User, label: "Google Account", href: "#" },
      { icon: Users, label: "Switch account", href: "#", hasArrow: true },
      { icon: LogOut, label: "Sign out", action: onLogout },
    ],
    [
      { icon: History, label: "浏览历史", href: "/history" },
      { icon: Bookmark, label: "我的收藏", href: "/favorites" },
      { icon: MonitorPlay, label: "YouTube Studio", href: "#" },
      { icon: CreditCard, label: "Purchases and memberships", href: "#" },
    ],
    [
      { icon: Shield, label: "Your data in YouTube", href: "#" },
      { icon: Moon, label: "Appearance: Device theme", href: "#", hasArrow: true },
      { icon: Languages, label: "Language: English", href: "#", hasArrow: true },
      { icon: Shield, label: "Restricted Mode: Off", href: "#", hasArrow: true },
      { icon: Keyboard, label: "Keyboard shortcuts", href: "#" },
    ],
    [
      { icon: Settings, label: "Settings", href: "#" },
    ],
    [
      { icon: HelpCircle, label: "Help", href: "#" },
      { icon: MessageSquare, label: "Send feedback", href: "#" },
    ]
  ];

  return (
    <div className="absolute top-full right-0 mt-2 w-[300px] bg-[#282828] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      
      {/* ... 头部代码保持不变 ... */}
      <div className="p-4 border-b border-white/10 flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-white font-medium truncate">{user.name}</span>
          <span className="text-gray-400 text-sm truncate">{user.email}</span>
          <Link href="#" className="text-blue-400 text-sm mt-1 hover:text-blue-300">
            View your channel
          </Link>
        </div>
      </div>

      <div className="max-h-[calc(100vh-200px)] overflow-y-auto py-2 custom-scrollbar">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <div className="h-[1px] bg-white/10 my-2 mx-0" />}
            
            {group.map((item, itemIndex) => {
              const ItemIcon = item.icon;
              
              const content = (
                <div 
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#3e3e3e] cursor-pointer transition-colors text-gray-200"
                  onClick={(e) => {
                    // --- 3. 现在这里不会报错了，因为 action 在接口里定义为可选属性 ---
                    if (item.action) {
                      e.preventDefault();
                      item.action();
                    }
                    onClose();
                  }}
                >
                  <ItemIcon size={20} className="text-gray-400 font-light" />
                  <span className="flex-1 text-sm font-normal">{item.label}</span>
                  {item.hasArrow && <span className="text-gray-500 text-lg">›</span>}
                </div>
              );

              return item.href ? (
                <Link key={itemIndex} href={item.href}>
                  {content}
                </Link>
              ) : (
                <div key={itemIndex}>{content}</div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}