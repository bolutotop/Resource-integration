'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SourceType = 'Age' | 'Yhmc';

interface SourceContextType {
  currentSource: SourceType;
  switchSource: (source: SourceType) => void;
}

const SourceContext = createContext<SourceContextType | undefined>(undefined);

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [currentSource, setCurrentSource] = useState<SourceType>('Age');

  // 初始化时从 LocalStorage 读取用户上次的选择
  useEffect(() => {
    const saved = localStorage.getItem('kali_source');
    if (saved === 'Age' || saved === 'Yhmc') {
      setCurrentSource(saved);
    }
  }, []);

  const switchSource = (source: SourceType) => {
    setCurrentSource(source);
    localStorage.setItem('kali_source', source);
    // 切换源后，通常建议刷新页面或重置路由，以触发数据重新加载
    window.location.href = '/movies'; 
  };

  return (
    <SourceContext.Provider value={{ currentSource, switchSource }}>
      {children}
    </SourceContext.Provider>
  );
}

export const useSource = () => {
  const context = useContext(SourceContext);
  if (!context) throw new Error('useSource must be used within SourceProvider');
  return context;
};