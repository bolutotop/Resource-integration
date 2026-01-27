'use client';

import { useEffect } from 'react';
import { recordHistory, ResourceType } from '@/app/actions/history';

interface UseRecordHistoryProps {
  id: number;
  type: ResourceType;
  title: string;
  coverUrl?: string;
  routeUrl: string;
  enable?: boolean; // 控制是否记录 (比如数据还在加载时不记录)
}

export function useRecordHistory({
  id,
  type,
  title,
  coverUrl,
  routeUrl,
  enable = true
}: UseRecordHistoryProps) {
  
  useEffect(() => {
    // 只有当数据加载完成(enable=true)且存在有效ID时才记录
    if (enable && id && title) {
      // 延时记录 (防止用户秒进秒退也记录，增加一点防抖)
      const timer = setTimeout(() => {
        recordHistory({
          targetId: id,
          targetType: type,
          title,
          coverUrl,
          routeUrl
        });
      }, 2000); // 停留2秒以上才算有效浏览

      return () => clearTimeout(timer);
    }
  }, [id, type, title, coverUrl, routeUrl, enable]);
}